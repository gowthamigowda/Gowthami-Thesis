// Your code with updated mean and std calculation
function normalizeValues(data, meanValue, stdDev) {
    data.children.forEach(asse => {
        (asse.children || []).forEach(categoria => {
            (categoria.children || []).forEach(tema => {
                if (tema.data) {
                    tema.data.forEach(entry => {
                        if (!('normalized_valore' in entry)) {
                            const valore = entry.valore;
                            entry.normalized_valore = parseFloat((100 * Math.abs((valore - meanValue) / stdDev)).toFixed(2));
                        }
                    });
                } else {
                    (tema.children || []).forEach(indicatore => {
                        indicatore.data.forEach(entry => {
                            if (!('normalized_valore' in entry)) {
                                const valore = entry.valore;
                                entry.normalized_valore = parseFloat((100 * Math.abs((valore - meanValue) / stdDev)).toFixed(2));
                            }
                        });
                    });
                }
            });
        });
    });
}

// Calculate mean function
function calculateMean(arr) {
    let sum = 0;
    arr.forEach(val => {
        sum += val;
    });
    return sum / arr.length;
}

// Calculate standard deviation function
function calculateStdDev(arr, meanValue) {
    const squaredDiffs = arr.map(val => Math.pow(val - meanValue, 2));
    const variance = calculateMean(squaredDiffs);
    return Math.sqrt(variance);
}

// Function to handle file input and processing
function handleFolderSelection(event) {
    const files = event.target.files; // Get the selected files from the input element
    console.log('Files selected:', files); // Log selected files for debugging

    const zip = new JSZip(); // Create a new ZIP file

    let currentIndex = 0; // Track the current file index

    function processNextFile() {
        if (currentIndex < files.length) {
            const file = files[currentIndex];
            console.log('Processing file:', file.name); // Log file name for debugging

            if (file.name.endsWith('_modified.json')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    console.log('File loaded:', file.name); // Log file loaded for debugging
                    const jsonData = JSON.parse(event.target.result);

                    // Collect all 'valore' values
                    let allValues = [];
                    jsonData.children.forEach(asse => {
                        (asse.children || []).forEach(categoria => {
                            (categoria.children || []).forEach(tema => {
                                if (tema.data) {
                                    allValues = allValues.concat(tema.data.map(entry => entry.valore));
                                } else {
                                    (tema.children || []).forEach(indicatore => {
                                        allValues = allValues.concat(indicatore.data.map(entry => entry.valore));
                                    });
                                }
                            });
                        });
                    });

                    const meanValue = calculateMean(allValues);
                    const stdDev = calculateStdDev(allValues, meanValue);

                    // Apply normalization to the entire data
                    normalizeValues(jsonData, meanValue, stdDev);

                    // Save the updated data to the ZIP file
                    const cityOutputFilename = `${file.name.replace('_modified.json', '')}_NORMALIZED.json`;
                    zip.file(cityOutputFilename, JSON.stringify(jsonData, null, 2));

                    console.log(`Normalized data for ${file.name.replace('_modified.json', '')} has been processed.`);

                    // Process the next file
                    currentIndex++;
                    processNextFile();
                };
                reader.readAsText(file);
            } else {
                // If the file doesn't end with '_modified.json', skip and process next file
                currentIndex++;
                processNextFile();
            }
        } else {
            // All files processed, create and save the ZIP file
            zip.generateAsync({ type: 'blob' }).then(function(content) {
                // Create a download link for the ZIP file
                const zipDownloadLink = document.createElement('a');
                zipDownloadLink.href = URL.createObjectURL(content);
                zipDownloadLink.download = 'normalized_files.zip';
                zipDownloadLink.click();

                console.log('ZIP file created and downloaded.');
            });
        }
    }

    // Start processing files sequentially
    processNextFile();
}

// Function to handle Step 2 processing
function step2Function() {
    // Create an input element of type file
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', ''); // Allow directory selection in Chrome
    input.setAttribute('directory', ''); // Allow directory selection in Firefox
    input.addEventListener('change', handleFolderSelection);
    input.click(); // Trigger the file selection dialog
}
