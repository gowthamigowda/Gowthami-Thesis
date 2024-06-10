// Function to handle file upload and processing
function handleFileUpload() {
    // Create input element for JSON file
    const jsonInput = document.createElement('input');
    jsonInput.type = 'file';
    jsonInput.accept = '.json';
    jsonInput.addEventListener('change', function(event) {
      const jsonFile = event.target.files[0];
      const reader = new FileReader();
      reader.onload = function(event) {
        const jsonData = JSON.parse(event.target.result);
        console.log('Uploaded JSON data:', jsonData);
        // Once JSON is loaded, prompt user to upload Excel file
        handleExcelUpload(jsonData);
      };
      reader.readAsText(jsonFile);
    });
    jsonInput.click(); // Trigger click event to open file dialog
  }
  
  // Function to handle Excel file upload
  function handleExcelUpload(jsonData) {
    // Create input element for Excel file
    const excelInput = document.createElement('input');
    excelInput.type = 'file';
    excelInput.accept = '.xlsx, .xls';
    excelInput.addEventListener('change', function(event) {
      const excelFile = event.target.files[0];
      const reader = new FileReader();
      reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log('Uploaded Excel data:', excelData);
        processJsonAndExcel(jsonData, excelData);
      };
      reader.readAsArrayBuffer(excelFile);
    });
    excelInput.click(); // Trigger click event to open file dialog
  
  }
  
// Function to process JSON and Excel data and download modified JSON files
function processJsonAndExcel(jsonData, excelData) {
    const uniqueYears = [...new Set(excelData.map(item => item['ANNO']))].sort();
    const uniqueCities = [...new Set(excelData.map(item => item['COMUNE']))].sort();
    const outputDir = 'output_step_one';
  
    // Ask the user for a name to suggest for the ZIP file
    const suggestedName = window.prompt('Please suggest a name for saving the ZIP file:');
    if (!suggestedName) {
      console.log('User canceled the operation.');
      return; // Exit the function if the user cancels
    }
  
    // Create a JSZip instance
    const zip = new JSZip();
  
    // Process each city
    for (const city of uniqueCities) {
      const cityJsonData = JSON.parse(JSON.stringify(jsonData)); // Deep copy JSON data
      addFieldsToIndicators(cityJsonData, city, excelData, uniqueYears);
      const outputFilename = `${city}_modified.json`;
  
      // Add modified JSON data to the zip file
      zip.file(`${outputDir}/${outputFilename}`, JSON.stringify(cityJsonData, null, 2));
    }
  
    // Generate the zip file asynchronously
    zip.generateAsync({ type: 'blob' }).then(function(content) {
      // Create a download link for the zip file
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(content);
      downloadLink.download = `${suggestedName}.zip`; // Use suggested name for the ZIP file
      downloadLink.click();
      console.log(`ZIP file "${suggestedName}.zip" created and downloaded.`);
    });
  }
  
  

      

  
  
  // Function to recursively add fields from Excel data to each indicator for a specific city
  function addFieldsToIndicators(node, city, excelData, uniqueYears) {
    if (node.children && node.children.length === 0) {
      // Replace node with children with node without children and add data directly
      delete node.children;
      addDataToNode(node, city, excelData, uniqueYears);
    } else if (node.children) {
      // Continue recursively processing nodes with children
      node.children.forEach(child => addFieldsToIndicators(child, city, excelData, uniqueYears));
    } else if (node.name) {
      // Leaf node (indicator without children)
      addDataToNode(node, city, excelData, uniqueYears);
    }
  }
  
  // Helper function to add data directly to a node
  function addDataToNode(node, city, excelData, uniqueYears) {
    const indicatorName = node.name;
    const dataList = [];
    uniqueYears.forEach(year => {
      // Find matching data for the indicator
      const matchingData = excelData.find(item =>
        item['INDICATORE'] === indicatorName &&
        item['ANNO'] === year &&
        item['COMUNE'] === city
      );
      if (matchingData) {
        // Add fields to the indicator node for each year and city
        dataList.push({
          year: year.toString(),
          comune: matchingData['COMUNE'],
          valore: matchingData['VALORE'],
          segno: matchingData['SEGNO']
        });
      }
    });
    node.data = dataList;
  }
  
  // Function to be called when the "Step 1" button is clicked
  function step1Function() {
    handleFileUpload();
  }
  