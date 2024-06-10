// Calculate mean using Math object
function calculateMean(arr) {
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
}

// Calculate standard deviation using Math object
function calculateStdDev(arr) {
    const meanValue = calculateMean(arr);
    const squaredDiffs = arr.map(val => Math.pow(val - meanValue, 2));
    const variance = calculateMean(squaredDiffs);
    return Math.sqrt(variance);
}

// Assign internal values using the provided logic
function assignInternalValues(node) {
    if (node.data) {
        const dataValues = node.data.map(entry => entry.normalized_valore || entry.valore || 0);
        if (dataValues.length > 0) {
            const meanValue = calculateMean(dataValues);
            const stdDev = calculateStdDev(dataValues);
            const cvValue = meanValue !== 0 ? stdDev / meanValue : 0;
            return { meanValue, stdDev, cvValue };
        } else {
            return { meanValue: 0, stdDev: 0, cvValue: 0 };
        }
    }

    let meanValues = [];
    let stdDevs = [];
    (node.children || []).forEach(child => {
        const { meanValue, stdDev, _ } = assignInternalValues(child);
        meanValues.push(meanValue);
        stdDevs.push(stdDev);
    });

    const meanValue = calculateMean(meanValues);
    const stdDev = calculateStdDev(stdDevs);
    const cvValue = meanValue !== 0 ? stdDev / meanValue : 0;

    if (node.type && ["Asse", "Categoria", "Tema"].includes(node.type)) {
        node.sign = 1;
    }

    node.value = Math.round(Math.max(0, meanValue + stdDev * cvValue) * 100) / 100;

    return { meanValue, stdDev, cvValue };
}

// Function to handle file input and processing for Step 3
function handleStep3FolderSelection(event) {
    const files = event.target.files; // Get the selected files from the input element
    console.log('Files selected:', files); // Log selected files for debugging

    // Create a zip file
    const zip = new JSZip();

    // Process each file
    for (const file of files) {
        if (file.name.endsWith('_NORMALIZED.json')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const jsonData = JSON.parse(event.target.result);

                // Assign internal values
                assignInternalValues(jsonData);

                // Add the JSON data to the zip file
                zip.file(`${file.name.replace('_NORMALIZED.json', '')}_FinalValues.json`, JSON.stringify(jsonData, null, 2));
                
                // Check if all files are processed and create download link
                if (Object.keys(zip.files).length === files.length) {
                    zip.generateAsync({ type: 'blob' }).then(function(content) {
                        // Create a download link for the zip file
                        const downloadLink = document.createElement('a');
                        downloadLink.href = URL.createObjectURL(content);
                        downloadLink.download = 'ProcessedData.zip';
                        downloadLink.click();
                        console.log('All files have been saved in one zip folder.');
                    });
                }
            };
            reader.readAsText(file);
        }
    }
}

// Function to handle Step 3 processing
// Function to handle Step 3 processing
function step3Function() {
    // Create an input element of type file
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', ''); // Allow directory selection in Chrome
    input.setAttribute('directory', ''); // Allow directory selection in Firefox
    input.addEventListener('change', handleStep3FolderSelection); // Change the event listener to use the renamed function
    input.click(); // Trigger the file selection dialog
}
