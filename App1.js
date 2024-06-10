document.addEventListener("DOMContentLoaded", function () {
    console.log("DOMContentLoaded event fired."); 

    const canvasWidth = 1800; 
    const canvasHeight = 3000;
    const leftMargin = 200; 
    const rightMargin = 200; 

    
    // Create an SVG container with margins
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", canvasWidth)
        .attr("height", canvasHeight);

    // Create a Tree layout with adjusted dimensions
    const tree = d3.tree().size([canvasHeight - 800, canvasWidth - leftMargin - rightMargin]);

    // Initial empty hierarchy with only the root node
    let root = { name: "Root",children: [], color: "inherit" };

    // Function to set the color for a node and its descendants
    function setColor(node, color) {
        node.color = color;
        if (node.children) {
            node.children.forEach(child => setColor(child, color));
        }
    }

    // Event listener for setting node color
    document.getElementById("setColor").addEventListener("click", function () {
        hideMenuOptions();

        // Prompt the user for a color in RGB format
        const selectedColor = prompt("Enter the color in RGB format or choose from predefined palettes:");

        if (selectedColor !== null && selectedColor.trim() !== "") {
            // Set the color for the selected node and its subtree
            setColor(currentParent.data, selectedColor);

            // Update the root hierarchy
            rootHierarchy = d3.hierarchy(root);

            // Redisplay the updated tree with colors
            updateTree();
        }
    });

    // Initialize the root hierarchy
    let rootHierarchy = d3.hierarchy(root);

    // Function to update the tree layout and redraw the visualization
    function updateTree() {
        // Update the tree layout
        tree(rootHierarchy);

        // Update the tree visualization
        const links = rootHierarchy.links();
        const nodes = rootHierarchy.descendants();

        // Calculate the translation for the entire tree
        const treeTranslation = `translate(${leftMargin}, 0)`; 

        // Apply the translation to the SVG container
        svg.attr("transform", treeTranslation);

        // Create a curved link generator
        const curvedLink = d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x);

        // Remove the existing tree elements
        svg.selectAll("path").remove();
        svg.selectAll("circle.node").remove();
        svg.selectAll("text.label").remove();

        // Add links as paths
        svg.selectAll("path")
            .data(links)
            .enter()
            .append("path")
            .attr("d", d => curvedLink(d))
            .attr("fill", "none")
            .attr("stroke", "steelblue");

    // Function to show the menu options and position it next to the clicked node
    function showMenuOptions(x, y) {
        const menu = document.getElementById("menu");

        // Calculate the position of the menu based on the clicked node's coordinates
        const menuX = x + 20; 
        const menuY = y; 

        // Set the position of the menu
        menu.style.left = menuX + "px";
        menu.style.top = menuY + "px";

        // Display the menu
        menu.style.display = "block";
        d3.select(this).remove();
    }

    
    let loadedIndicators = [];
    
// Event listener for node click
svg.selectAll("circle.node")
.data(nodes)
.enter()
.append("circle")
.attr("class", "node")
.attr("cx", d => d.y + 10)
.attr("cy", d => d.x)
.attr("r", 6)
.attr("fill", d => d.data.color)
    .on("click", function (event, d) {
        currentParent = d;
      
        showMenuOptions(d.y, d.x);
        
    });


// Add node labels
svg.selectAll("text.label")
.data(nodes)
.enter()
.append("text")
.attr("class", "label")
.attr("x", d => d.y + 17)
.attr("y", d => d.x + 7)
.text(d => d.data.name);
    }

// Function to hide the menu options
function hideMenuOptions() {
    const menu = document.getElementById("menu");
    menu.style.display = "none";
}

// Event listener for adding an inner node
document.getElementById("addInnerNode").addEventListener("click", function () {
    hideMenuOptions();

    // Check if the currentParent is a leaf node
    if (currentParent.data.type === "Indicatore") {
        alert("You cannot add child nodes to a leaf node.");
    } else {
        let newNodeType;

        // Determine the node type based on the currentParent's type
        switch (currentParent.data.type) {
            case "Root":
                // Root can have Asse as the first level
                newNodeType = "Asse";
                break;
            case "Asse":
                // Asse can have Categoria as the second level
                newNodeType = "Categoria";
                break;
            case "Categoria":
                // Categoria can have Tema as the third level
                newNodeType = "Tema";
                break;
            default:
                // Default to Asse type if no match found
                newNodeType = "Asse";
                break;
        }

        // Prompt the user for a name for the new inner node
        const newNodeName = prompt("Enter the name for the new inner node:");

        // NewNodeName is not empty and the user didn't click Cancel
        if (newNodeName !== null && newNodeName.trim() !== "") {
            // Create a new inner node with the given name and type
            const newInnerNode = { name: newNodeName, type: newNodeType, children: [], color: currentParent.data.color };

            // Add the new inner node as a child of the clicked node
            currentParent.data.children.push(newInnerNode);

            // Update the root hierarchy
            rootHierarchy = d3.hierarchy(root);

            // Redisplay the updated tree
            updateTree();
        }
    }
});



let loadedIndicators;


// Event listener for adding a leaf node
document.getElementById("addLeafNode").addEventListener("click", function () {
    hideMenuOptions();

    // Check if the currentParent is a leaf node
    if (currentParent.data.type === "Indicatore") {
        alert("You cannot add child nodes to a leaf node.");
        return;
    }

    // Show a prompt with two options: Add New Leaf Node or Select an Indicator
    const userChoice = prompt("Choose an option:\n1. Add New Leaf Node\n2. Select an Indicator");

    // Check the user's choice
    if (userChoice === "1") {
        // Option 1: Add New Leaf Node
        const newNodeName = prompt("Enter the name for the new leaf node:");
        if (newNodeName !== null && newNodeName.trim() !== "") {
            // Create a new leaf node with the given name and type
            const newLeafNode = { name: newNodeName, type: "Indicatore", children: [], color: currentParent.data.color };

            // Add the new leaf node directly to the clicked node
            currentParent.data.children.push(newLeafNode);

            // Update the root hierarchy
            rootHierarchy = d3.hierarchy(root);

            // Redisplay the updated tree
            updateTree();
        }
    } else if (userChoice === "2") {
        alert("Please select an indicator from the dropdown above. (Note: The dropdown is located near the button you just clicked.)");

        // Option 2: Select an Indicator
        addEventListenerForDropdown();
      
    } else {
        // User canceled or entered an invalid choice
        console.log("Invalid choice or operation canceled.");
        alert("Invalid choice or operation canceled.");
    }
});

// Function to add an event listener for dropdown selection
function addEventListenerForDropdown() {
    // Ensure loadedIndicators is defined and contains data
    if (loadedIndicators && Array.isArray(loadedIndicators) && loadedIndicators.length > 0) {
        // Show a dropdown with loaded indicators for user selection
        const indicatorList = document.getElementById("indicatorList");

        // Clear existing options
        indicatorList.innerHTML = "";

        // Add a default option
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.text = "Select an Indicator";
        indicatorList.appendChild(defaultOption);

        // Create a search input field
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = "Search indicators...";

        // Append the search input to the dropdown container
        indicatorList.appendChild(searchInput);

        // Add indicators as options
        loadedIndicators.forEach((indicator, index) => {
            const option = document.createElement("option");
            option.value = index.toString();
            option.text = `${indicator.name}`;
            indicatorList.appendChild(option);
        });

        // Find the rightmost button's position
        const buttons = document.getElementsByClassName("load-button");
        const lastButton = buttons[buttons.length - 1];

        // Position the dropdown next to the rightmost button
        indicatorList.style.position = "absolute";
        indicatorList.style.left = `${lastButton.offsetLeft + lastButton.offsetWidth + 10}px`; // Adjust the position as needed
        indicatorList.style.top = `${lastButton.offsetTop}px`; // Adjust the position as needed

        // Show the dropdown
        indicatorList.style.display = "block";

        // Add event listener for search input
        searchInput.addEventListener("input", function () {
            const searchTerm = searchInput.value.toLowerCase();
            const options = indicatorList.getElementsByTagName("option");
            Array.from(options).forEach(option => {
                const indicatorName = option.textContent.toLowerCase();
                if (indicatorName.includes(searchTerm)) {
                    option.style.display = "block";
                } else {
                    option.style.display = "none";
                }
            });
        });

        // Add an event listener for dropdown selection
        function dropdownSelectionHandler() {
            const selectedOptionIndex = indicatorList.value;

            const selectedIndicatorData = loadedIndicators[selectedOptionIndex];

            if (selectedIndicatorData) {
                // Create a new leaf node with the selected indicator
                const newLeafNode = {
                    name: `${selectedIndicatorData.name}`,
                    type: "Indicatore",
                    color: currentParent.data.color,
                    indicatorData: selectedIndicatorData
                };

                // Add the new leaf node directly to the clicked node
                currentParent.data.children.push(newLeafNode);

                // Update the root hierarchy
                rootHierarchy = d3.hierarchy(root);

                // Redisplay the updated tree
                updateTree();

                // Hide the dropdown after selection
                indicatorList.style.display = "none";

                // Remove the event listener to avoid attaching multiple listeners unintentionally
                indicatorList.removeEventListener("change", dropdownSelectionHandler);
            } else {
                alert("Error: Selected indicator not found.");
            }
        }

        // Add the event listener for dropdown selection
        indicatorList.addEventListener("change", dropdownSelectionHandler);
    } else {
        alert("No indicators loaded. Please load indicators first.");
    }
}



// Add an event listener for Load Indicators button
document.getElementById("loadIndicatorsButton").addEventListener("click", function () {
    // Check if the current hierarchy is not empty
    if (isHierarchyNotEmpty()) {
        // Prompt for confirmation
        const confirmation = confirm("Loading indicators will overwrite the existing hierarchy. Continue?");
        if (!confirmation) {
            return;
        }
    }

    // Prompt the user to select a file containing only indicators
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json"; // Restrict file selection to JSON files
    fileInput.addEventListener("change", function (event) {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            loadIndicatorsFromFile(selectedFile);
        }
    });
    fileInput.click();
});

function loadIndicatorsFromFile(file) {
    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            // Parse the file content into an array of indicators
             loadedIndicators = JSON.parse(event.target.result).children || [];

            // Ensure loadedIndicators is an array
            const extractedIndicators = Array.isArray(loadedIndicators)
                ? loadedIndicators.map(indicator => ({
                    name: indicator.name,
                  
                }))
                : [];

            // Populate the dropdown with extracted indicators
            populateIndicatorList(extractedIndicators);

            // Initialize the hierarchy with just the root node
            root = { name: "root", children: [], color: "inherit" };
            rootHierarchy = d3.hierarchy(root);

            // Redraw the tree visualization with the updated hierarchy
            updateTree();

            // Display a success message to the user
            console.log("Indicators loaded successfully!");
            alert("Indicators loaded successfully!");


        } catch (error) {
            // Handle errors (e.g., invalid file format)
            console.error("Error loading indicators:", error);
            alert("Error loading indicators. Please check the file format.");
        }
    };

    reader.readAsText(file);
}

// Function to populate the dropdown with indicators
function populateIndicatorList(indicators) {
    const indicatorList = document.getElementById("indicatorList");

    // Clear existing options
    indicatorList.innerHTML = "";

    // Add a default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.text = "Select an Indicator";
    indicatorList.appendChild(defaultOption);

    // Add indicators as options
    indicators.forEach(indicator => {
        const option = document.createElement("option");
     
        option.text = `${indicator.name}`;
        indicatorList.appendChild(option);
    });
}

    // Event listener for removing a subtree
    document.getElementById("removeNode").addEventListener("click", function () {
        // Check if the currentParent is the root node
        if (currentParent === rootHierarchy) {
            alert("You cannot remove the root node.");
        } else {
            // Ask for confirmation before deleting
            const confirmation = confirm("Are you sure you want to delete this node and its subtree?");

            if (confirmation) {
                // Remove the selected node and its subtree
                currentParent.parent.data.children = currentParent.parent.data.children.filter(child => child !== currentParent.data);

                // Update the root hierarchy
                rootHierarchy = d3.hierarchy(root);

                // Redisplay the updated tree
                updateTree();
            }
            // Hide the menu options
            hideMenuOptions();
        }
    });

   

    // Initialize the current parent for new nodes 
    let currentParent = root;

    // Display a reminder to load indicators if the hierarchy is empty
    if (!isHierarchyNotEmpty()) {
        alert("To create the hierarchy from scratch, find the 'Root' node where you can start. Before that, please load indicators.");

    }

    // Call updateTree to display the initial tree with the root node
    updateTree();

     // Load starts from here
     document.getElementById("openButton").addEventListener("click", function () {
        // Check if the current hierarchy is not empty
        if (isHierarchyNotEmpty()) {
            // Prompt for confirmation
            const confirmation = confirm("Opening a new hierarchy will overwrite the existing one. Continue?");
            if (!confirmation) {
                return;
            }
        }
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json"; // Restrict file selection to JSON files 
        fileInput.addEventListener("change", function (event) {
            const selectedFile = event.target.files[0];
            if (selectedFile) {
                loadHierarchyFromFile(selectedFile);
            }
        });
        fileInput.click();
    });


    // Function to load the hierarchy from a file
    function loadHierarchyFromFile(file) {
        const reader = new FileReader();

        reader.onload = function (event) {
            try {
                // Parse the file content into a hierarchy object 
                const loadedHierarchy = JSON.parse(event.target.result);

                // Log the loaded data for debugging
                console.log("Loaded Hierarchy Data:", loadedHierarchy);

                // Replace the existing hierarchy with the loaded one
                replaceHierarchy(loadedHierarchy);

                // Display a success message to the user
                alert("Hierarchy loaded successfully!");
            } catch (error) {
                // Handle errors 
                console.error("Error loading hierarchy:", error);
                alert("Error loading hierarchy. Please check the file format.");
            }
        };

        reader.readAsText(file);
    }

    // Function to replace the existing hierarchy with a new one
    function replaceHierarchy(newHierarchy) {
        root = newHierarchy;

        // Reinitialize the root hierarchy
        rootHierarchy = d3.hierarchy(root);

        // Redraw the tree visualization with the updated hierarchy
        updateTree();
    }

    hideMenuOptions();

    // Function to check if the current hierarchy is not empty
    function isHierarchyNotEmpty() {
        return root.children && root.children.length > 0;
    }

    // Function to get the suggested filename for saving
function getSuggestedFilename() {
    // If the hierarchy was loaded from a file, use the same filename; otherwise, use "Untitled.json"
    return loadedFilename || "Untitled.json";
}

// Variable to store the loaded filename 
let loadedFilename = null;

  // Event listener for the "Save" button
document.getElementById("saveButton").addEventListener("click", function () {
    if (isHierarchyNotEmpty()) {
        const suggestedFilename = getSuggestedFilename();

        const newFilename = prompt("Enter a filename to save the hierarchy:", suggestedFilename);

        if (newFilename !== null && newFilename.trim() !== "") {
            // Exclude the "indicatorData" property (except "segno") before saving
            const hierarchyWithoutIndicatorData = excludeIndicatorDataExceptSegno(root);

            // Serialize the hierarchy to JSON format
            const serializedHierarchy = JSON.stringify(hierarchyWithoutIndicatorData);

            // Create a Blob (binary large object) for the JSON data
            const blob = new Blob([serializedHierarchy], { type: "application/json" });

            // Create an <a> element to trigger the download
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = newFilename;

            // Trigger a click event on the <a> element to start the download
            a.click();
        }
    } else {
        alert("The hierarchy is empty. Nothing to save.");
    }
});


// Event listener for menu options
document.getElementById("menu").addEventListener("click", function (event) {
    const selectedOptionId = event.target.id;

    // Perform actions based on the selected option
    switch (selectedOptionId) {
        case "addInnerNode":
            // Handle Add Inner Node
            break;
        case "addLeafNode":
            // Handle Add Leaf Node
            break;
        case "removeNode":
            // Handle Remove Node
            break;
        case "setColor":
            // Handle Set Color
            break;
        case "cancelOption":
            // Handle Cancel: Hide the menu
            hideMenuOptions();
            break;
        default:
       
            break;
    }
});


// Function to exclude the "indicatorData" property from the hierarchy (except "segno")
function excludeIndicatorDataExceptSegno(node) {
    const newNode = { ...node };  // Create a shallow copy
    if (newNode.indicatorData) {
       
        delete newNode.indicatorData;  // Exclude the "indicatorData" property
    }
    if (newNode.children) {
        newNode.children = newNode.children.map(child => excludeIndicatorDataExceptSegno(child));
    }
    return newNode;
}

  // Get the button element by its id
  var nextButton = document.getElementById("nextButton");

  // Add a click event listener to the button
  nextButton.addEventListener("click", function() {
      // Redirect to Page2.html when the button is clicked
      window.location.href = "index.html";
  });
});

