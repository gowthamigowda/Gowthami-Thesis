document.addEventListener("DOMContentLoaded", function () {
    let paths;
    let selectedCities = [];

    
   
// Function to load and render sunburst diagram
function loadSunburst(containerId, data, maxDepth) {
    let container = document.getElementById(containerId);

    // Create the container if it doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        document.body.appendChild(container);
    }

    // Clear previous content in the container
    container.innerHTML = '';

    console.log("Loading sunburst for container:", containerId);

    const width = 1000;
    const height = 1000;
    const fixedRadius = 550;
    const radius = fixedRadius;

    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

    const g = svg.append('g'); // Create a new 'g' element to group paths

    // Define an array of colors for each "Asse" segment
    const asseColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
    // Define a color scale based on values
        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, 1]); // Adjust domain based on your data range

        // Check if the legend container already exists
        let legendContainer = document.querySelector('.legend-container');

        // Create a legend container outside of the SVG if it doesn't exist
        if (!legendContainer) {
            legendContainer = document.createElement('div');
            legendContainer.className = 'legend-container';
            document.body.appendChild(legendContainer);

            // Define a legend for the color scale
            const legend = d3.select(legendContainer).append("svg")
                .attr("class", "legend")
                .attr("width", 500)
                .attr("height", 120);

            // Create gradient for color scale
            const defs = legend.append("defs");
            const gradient = defs.append("linearGradient")
                .attr("id", "colorScaleGradient")
                .attr("x1", "0%")
                .attr("x2", "100%");

            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", d3.interpolateBlues(0));

            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", d3.interpolateBlues(1));

            // Append gradient to legend
            legend.append("rect")
                .attr("width", 300)
                .attr("height", 20)
                .style("fill", "url(#colorScaleGradient)");

            // Create legend labels
            const legendScale = d3.scaleLinear()
                .domain([0, 1])
                .range([0, 300]);

            const legendAxis = d3.axisBottom(legendScale)
                .ticks(5)
                .tickFormat(d3.format(".0%"));

            legend.append("g")
                .attr("transform", "translate(0,20)")
                .call(legendAxis);

            // Move value text a bit down
            legend.append("text")
                .attr("x", 0)
                .attr("y", 50)
                .text("Value (0% to 100%)")
                .style("font-family", "Arial")
                .style("font-size", "12px");

            // Add explanation text below the legend
            legend.append("text")
                .attr("x", 0)
                .attr("y", 70)
                .text("Darker colors indicate higher values.")
                .style("font-family", "Arial")
                .style("font-size", "12px")
                .style("fill", "#333")
                .style("font-weight", "bold");

            legend.append("text")
                .attr("x", 0)
                .attr("y", 90)
                .text("Lighter colors indicate lower values.")
                .style("font-family", "Arial")
                .style("font-size", "12px")
                .style("fill", "#333")
                .style("font-weight", "bold");
        }






    const partition = d3.partition().size([2 * Math.PI, radius]);
   
    const arc = d3.arc()
    .startAngle(d => Math.max(0, d.x0  )) 
    .endAngle(d => Math.min(2 * Math.PI, d.x1 + 0.08)) 
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.002))
    .padRadius(radius * 0.5)
    .innerRadius(d => Math.max(0, d.y0 ))
    .outerRadius(d => Math.max(0, d.y1 - 0.5)); 


    // Initialize x scale
    const x = d3.scaleLinear().range([0, 2 * Math.PI]);

    const root = d3.hierarchy(data);
    root.sum(d => 1);




const paths = g.selectAll('path')
    .data(partition(root).descendants())
    .join('path')
    .attr('display', d => d.depth <= maxDepth ? null : 'none')
    .attr('d', arc)
    .on('click', handleClick) // Add click event listener
        .on('mouseenter', handleMouseEnter) // Add mouse enter event listener
        .on('mouseleave', handleMouseLeave) // Add mouse leave event listener
        
    .style('fill', function (d) {
        let color;
        let saturation;

        // Log segment type
        console.log("Segment type:", d.data.type);

        // Calculate color and saturation based on segment type
        if (d.data.type === 'Asse') {
            // For Asse (Axis), assign a color based on its index in the data array
            const asseIndex = d.parent ? d.parent.children.findIndex(child => child === d) : 0;
            color = asseColors[asseIndex % asseColors.length];

            // Save color in the data for later inheritance
            d.color = color;

            // Adjust saturation based on the value attribute
            saturation = d.data.value ? d.data.value / 100 : 0.5; // Assuming value is a percentage
        } else if (d.parent && d.parent.data.type === 'Asse') {
            // For Categoria (Category), inherit color from parent Asse with adjusted saturation
            const parentColor = d.parent.color || asseColors[0]; // Default to first Asse color if no parent color
            color = parentColor;

            // Adjust saturation based on the value attribute
            saturation = d.data.value ? d.data.value / 100 : 0.5; // Assuming value is a percentage
        } else if (d.parent && d.parent.data.type === 'Categoria') {
            // For Tema (Theme), inherit color from parent Categoria with adjusted saturation
            const parentColor = d.parent.parent.color || asseColors[0]; // Default to first Asse color if no parent color
            color = parentColor;

            // Adjust saturation based on the value attribute
            saturation = d.data.value ? d.data.value / 100 : 0.5; // Assuming value is a percentage
        } else {
            // Default to black for other segments
            color = 'black';
            saturation = 0; // No saturation
        }

        // Log the selected color
        console.log("Color:", color);

        // For the root segment, set it to white
        if (!d.parent) {
             // For Asse (Axis), assign a color based on its index in the data array
             const asseIndex = d.parent ? d.parent.children.findIndex(child => child === d) : 0;
             color = asseColors[asseIndex % asseColors.length];
 
             // Save color in the data for later inheritance
             d.color = color;
 
             // Adjust saturation based on the value attribute
             saturation = d.data.value ? d.data.value / 100 : 0.5; // Assuming value is a percentage
        }

        // Construct HSL color string with adjusted saturation
        const hslColor = d3.hsl(color);
        hslColor.s = saturation;

        // Return the color
        return hslColor.toString();
    })

       .append('title')
        .text(d => {
            const indicatorData = d.data.data 
            return `${d.ancestors().map(d => d.data.name).reverse().join('/')}\n${format(d.value)}\nValue: ${d.data.value || 'N/A'}`;
        });
       
 

        

   
        
        
        
        
        


// Define a function to abbreviate text
function abbreviateText(text, maxLength) {
    if (text.length > maxLength) {
        return text.substring(0, maxLength - 3) + '...'; // Abbreviate and add ellipsis
    }
    return text;
}

const text = g.selectAll("text")
    .data(partition(root).descendants())
    .join("text")
    .filter(d => d.depth <= maxDepth) // Adjust depth condition as needed
    .attr("transform", d => {
        const angle = (d.x0 + d.x1) / 2 * 180 / Math.PI; // Calculate the angle
        const radius = (d.y0 + d.y1) / 2; // Calculate the radius
        const translateOffset = 35;
        return `rotate(${angle - 90}) translate(${radius - translateOffset},0) rotate(${angle < 180 ? 0 : 180})`;
    })
    .attr("dy", "0.35em") // Adjust vertical positioning of the text
    .attr("text-anchor", d => (d.x0 + d.x1) / 2 * 180 / Math.PI < 180 ? "start" : "end")
    

    .style("font-family", "sans-serif") // Set the font family to sans-serif
    .style("font-size", "17px") // Set the font size to 12px
    .style("font-weight", "normal") // Set the font weight to normal
    .text(d => {
        const arcLength = (d.x1 - d.x0) * radius;
        const textLength = d.data.name.length;

        // Adjust the threshold value as needed
        const maxCharsPerLine = 10; // Increase maxCharsPerLine to accommodate longer labels

        // Abbreviate label if it exceeds the maximum characters per line
        if (textLength > maxCharsPerLine) {
            return abbreviateText(d.data.name, maxCharsPerLine);
        } else {
            return d.data.name;
        }
    });




    function computeTextRotation(d) {
        const angle = (d.x0 + d.x1) / Math.PI * 90;
        // Avoid upside-down labels; labels as rims
        return (angle < 90 || angle > 270) ? angle : angle + 180;
    }
}

// Format function
function format(value) {
    return value;
}

function loadCityData(city) {
    console.log('Loading data for city:', city);
    const basePath = 'FinalFromBatchProcessingFor';

    // Clear initial sunburst containers
    clearSunburstContainers('sunburstContainer1');
    clearSunburstContainers('sunburstContainer2');

    // Create new container elements for each sunburst diagram
    const containerId1 = `sunburstContainer1_${city}`;
    const containerId2 = `sunburstContainer2_${city}`;

    const container1 = document.createElement('div');
    container1.id = containerId1;
    container1.style.display = 'inline-block';
    document.body.appendChild(container1);

    const container2 = document.createElement('div');
    container2.id = containerId2;
    container2.style.display = 'inline-block';
    document.body.appendChild(container2);

    // Create heading elements for each city
    const heading1 = document.createElement('h2');
    heading1.textContent = `City : ${city}`;
    document.body.insertBefore(heading1, container1);

    

    const cityJsonPath1 = `${basePath}1/${city}_FinalValues.json`;
    const cityJsonPath2 = `${basePath}2/${city}_FinalValues.json`;

    // Hide the initial sunburst containers
    document.getElementById('sunburstContainer1').style.display = 'none';
    document.getElementById('sunburstContainer2').style.display = 'none';

    fetch(cityJsonPath1)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load data for ${city} in sunburst container 1. Status: ${response.status}`);
            }
            return response.json();
        })
        .then(cityData1 => {
            console.log(`Data for ${city} in sunburst container 1:`, cityData1);
            loadSunburst(containerId1, cityData1, 3);
            updateSunburstColors(containerId1, parseCityName(cityJsonPath1));
            console.log(`Sunburst and colors updated for sunburst container 1.`);
        })
        .catch(error => console.error(`Error loading data for ${city} in sunburst container 1:`, error));

    fetch(cityJsonPath2)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load data for ${city} in sunburst container 2. Status: ${response.status}`);
            }
            return response.json();
        })
        .then(cityData2 => {
            console.log(`Data for ${city} in sunburst container 2:`, cityData2);
            loadSunburst(containerId2, cityData2, 2);
            updateSunburstColors(containerId2, parseCityName(cityJsonPath2));
            console.log(`Sunburst and colors updated for sunburst container 2.`);
        })
        .catch(error => console.error(`Error loading data for ${city} in sunburst container 2:`, error));
}



// Function to clear sunburst containers
function clearSunburstContainers(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = ''; // Clear container content
        container.style.display = 'block'; // Set display to 'block' to make it visible again
    }
}



  



function parseCityName(jsonPath) {
    // Extract city name from the file path
    const parts = jsonPath.split('/');
    const fileName = parts[parts.length - 1];
    console.log('File name:', fileName);
    const city = fileName.split('_')[0]; // Assuming the city name is before the first underscore
    console.log('Parsed city:', city);
    return city;
}

let globalData;

// Load initial sunburst diagrams
const path1 = "hierarchy1.json";
const path2 = "hierarchy2.json";

const hierarchyData1 = fetch(path1).then(response => response.json());
const hierarchyData2 = fetch(path2).then(response => response.json());

hierarchyData1.then(data => {
    console.log("Data for Sunburst(1):", data);
    loadSunburst("sunburstContainer1", data, 3);
    globalData = data;
});

hierarchyData2.then(data => {
    console.log("Data for Sunburst(2):", data);
    loadSunburst("sunburstContainer2", data, 2);
   
});

// Initially hide the year dropdown
$('#yearDropdown').hide();

// Update the selected cities when the city dropdown changes
$('#cityDropdown').on('change', function() {
    console.log('Dropdown change event fired');
    const selectedCities = $(this).val(); // Get the selected cities
  
    if (selectedCities.length > 0) {
        // Show the year dropdown if a city is selected
        $('#yearDropdown').show();
    } else {
        // Hide the year dropdown if no city is selected
        $('#yearDropdown').hide();
    }
  
    // Load data and render sunburst diagrams for each selected city
    selectedCities.forEach(city => {
        
      console.log('Loading data for city:', city);
      loadCityData(city); // Load data for the selected city
    });
  });
  
 
  
 


  function updateSunburstColors(containerId, selectedCity) {
    try {
        console.log(`Updating sunburst colors for ${containerId}...`);
        console.log('Selected city:', selectedCity);

        // Construct file paths for each sunburst container based on the selected city
        const basePath = 'FinalFromBatchProcessingFor';
        const cityJsonPath1 = `${basePath}1/${selectedCity}_FinalValues.json`;
        const cityJsonPath2 = `${basePath}2/${selectedCity}_FinalValues.json`;

        // Fetch the data for the selected city for both sunburst containers
        const fetchCityData1 = fetch(cityJsonPath1).then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load data for ${selectedCity}. Status: ${response.status}`);
            }
            return response.json();
        });

        const fetchCityData2 = fetch(cityJsonPath2).then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load data for ${selectedCity}. Status: ${response.status}`);
            }
            return response.json();
        });

        // Wait for both fetch operations to complete
        Promise.all([fetchCityData1, fetchCityData2])
            .then(([cityData1, cityData2]) => {
                console.log(`Data for ${selectedCity} (Container 1):`, cityData1);
                console.log(`Data for ${selectedCity} (Container 2):`, cityData2);

                // Update sunburst colors after loading data for both containers
                loadSunburst('sunburstContainer1', cityData1, 3);
                loadSunburst('sunburstContainer2', cityData2, 2);

                // Display updated colors in the console
                const colorsContainer1 = d3.selectAll(`#sunburstContainer1 path`).nodes().map(node => d3.select(node).style('fill'));
                const colorsContainer2 = d3.selectAll(`#sunburstContainer2 path`).nodes().map(node => d3.select(node).style('fill'));
                console.log(`Updated colors in sunburstContainer1:`, colorsContainer1);
                console.log(`Updated colors in sunburstContainer2:`, colorsContainer2);

                console.log(`Sunburst colors for ${containerId} updated.`);

                // Add style to sunburstContainer2 to position it below sunburstContainer1
                document.getElementById("sunburstContainer2").style.marginTop = "20px";
            })
            .catch(error => console.error(`Error loading data for ${selectedCity}:`, error));
    } catch (error) {
        console.error('Error in updateSunburstColors:', error);
    }
}








       function handleMouseEnter(event, d) {
            // Handle mouse enter event
            if (d.data.type === 'Categoria' || d.data.type === 'Tema') {
                d3.select(this)
                .style('cursor', 'pointer');
                // Display data for all indicators under the "Tema"
                d.data.children.forEach(indicator => {
                    if (indicator.type === 'Indicatore') {
                       
                    }
                });
            }
        }
        function handleMouseLeave(event, d) {
            // Handle mouse leave event
            if (d.depth === 3 && d.data.type === 'Tema') {
                
                // Restore opacity of the cell
                d3.select(this).style('opacity', 1);
            }
        }
       
        function fetchCityData(jsonPath) {
            return fetch(jsonPath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load data from ${jsonPath}. Status: ${response.status}`);
                    }
                    return response.json();
                });
        }
        
        
    function getIndicatorData(cityData, temaName, categoryName, cityName) {
    // Find the "Tema" or "Categoria" based on the provided name
    const foundCategory = findCategory(cityData, temaName, categoryName);
    if (foundCategory) {
        // Initialize an array to store indicator data
        const indicatorData = [];
        // Traverse through the children of the found category to collect indicator data
        for (const child of foundCategory.children) {
            if (child.type === 'Indicatore') {
                // Filter data for the specific city
                const cityIndicatorData = child.data.filter(data => data.comune === cityName);
                if (cityIndicatorData.length === 0) {
                    // If no data is found for the city, push a placeholder object
                    indicatorData.push({ name: child.name, data: [{ year: '', normalized_valore: 0 }] });
                } else {
                    // Otherwise, push the retrieved data
                    indicatorData.push({ name: child.name, data: cityIndicatorData });
                }
            }
        }
        return indicatorData;
    } else {
        console.error(`Category "${categoryName}" not found in ${cityName}`);
        // Return an empty array in case of missing category
        return [];
    }
}
 
        function findCategory(data, temaName, categoryName) {
            if (data.name === temaName && data.type === 'Tema') {
                // If the data matches the provided temaName and is of type "Tema", return it
                return data;
            } else if (data.name === categoryName && data.type === 'Categoria') {
                // If the data matches the provided categoryName and is of type "Categoria", return it
                return data;
            } else if (data.children) {
                // If data has children, recursively search for the category within its children
                for (const child of data.children) {
                    const found = findCategory(child, temaName, categoryName);
                    if (found) return found;
                }
            }
            return null;
        }
        
            
 // Function to extract indicator data for a specific year
function getIndicatorDataForYear(indicatorData, year) {
    return indicatorData.filter(entry => entry.year === year);
}


let years = ['2016', '2017', '2018', '2019', '2020', '2021', '2022']; // Define the years array globally
let indicatorDataForCity1, indicatorDataForCity2; // Declare indicatorDataForCity1 and indicatorDataForCity2 here
 city1 = selectedCities[0];
city2 = selectedCities[1];

function handleClick(event, d) {
    let selectedYear; // Declare selectedYear here
    
    try {
        // Extract the selected cities from the dropdown
        const selectedCities = $('#cityDropdown').val();
        console.log('Selected cities in handleClick:', selectedCities); // Log the selected cities

        // Check if the clicked cell's type is either "Tema" or "Categoria" before proceeding
        if (d && d.data) {
            console.log('Clicked on cell with type:', d.data.type, d.data.name);

            // Construct file paths for each city based on the selected city
            const basePath = 'FinalFromBatchProcessingFor';

            // City 1
            city1 = selectedCities[0];
            const filePathCity1 = `${basePath}/Merged_${city1}_FinalValues.json`;
            console.log('Selected city file for City 1:', filePathCity1);

            // City 2
            city2 = selectedCities[1];
            const filePathCity2 = `${basePath}/Merged_${city2}_FinalValues.json`;
            console.log('Selected city file for City 2:', filePathCity2);

            // Determine whether to fetch indicator data based on "Tema" or "Categoria"
            let temaName = '';
            let categoryName = '';
            if (d.data.type === 'Tema') {
                temaName = d.data.name;
                // Get the category name from the parent if available
                categoryName = d.data.parent ? d.data.parent.name : '';
            } else if (d.data.type === 'Categoria') {
                // Check if the Categoria has a Tema child
                const temaChild = d.data.children.find(child => child.type === 'Tema');
                if (temaChild) {
                    // If a Tema child exists, prioritize it
                    temaName = temaChild.name;
                } else {
                    // If no Tema child exists, consider the Categoria itself as the main category
                    categoryName = d.data.name;
                }
            } else {
                categoryName = d.data.name;
            }

            Promise.all([fetchCityData(filePathCity1), fetchCityData(filePathCity2)])
                .then(([cityData1, cityData2]) => {
                    // Extract indicator data for City 1
                    indicatorDataForCity1 = getIndicatorData(cityData1, temaName, categoryName, city1);
                    console.log(`Indicator data for ${city1} and selected ${d.data.type}:`, indicatorDataForCity1);

                    // Extract indicator data for City 2
                    indicatorDataForCity2 = getIndicatorData(cityData2, temaName, categoryName, city2);
                    console.log(`Indicator data for ${city2} and selected ${d.data.type}:`, indicatorDataForCity2);

                    // Use the selected year obtained from the dropdown
                    selectedYear = $('#yearDropdown').val(); // Update selectedYear with the value from the dropdown

                    // Create histogram with data from both cities
                    createHistogram(selectedYear, indicatorDataForCity1, indicatorDataForCity2, city1, city2, years);
                })
                .catch(error => {
                    console.error('Error fetching city data:', error);
                });
        }
    } catch (error) {
        console.error('Error in handleClick:', error);
    }
}

let selectedYear = $('#yearDropdown').val();

// Dropdown change event listener for selecting the year
$('#yearDropdown').on('change', function () {
    console.log('Year dropdown change event fired');
    selectedYear = $(this).val(); // Update the selected year
    console.log('Selected year:', selectedYear);

    console.log('Indicator data for City 1:', indicatorDataForCity1);
    console.log('Indicator data for City 2:', indicatorDataForCity2);
    console.log('City 1:', city1);
    console.log('City 2:', city2);

    // Filter data for the selected year
    const filteredCity1Data = filterDataForYear(indicatorDataForCity1, selectedYear);
    const filteredCity2Data = filterDataForYear(indicatorDataForCity2, selectedYear);

    console.log('Filtered data for City 1:', filteredCity1Data);
    console.log('Filtered data for City 2:', filteredCity2Data);

    // Update the histogram with the filtered data and other parameters
    createHistogram(selectedYear, filteredCity1Data, filteredCity2Data, city1, city2, years);
});

// Define a function to filter data for the selected year
function filterDataForYear(data, year) {
    return data.map(entry => ({
        ...entry,
        data: entry.data.filter(d => d.year === year)
    })).filter(entry => entry.data.length > 0);
}

// Define a function to expand a single sector and show its leaf indicators
function expandSector(d) {
    const expandedData = d.data.children; // Get the leaf indicators
    const expandedSector = d3.select('#expandedSector');

    // Clear any existing content
    expandedSector.selectAll('*').remove();

    // Create list of leaf indicators
    expandedSector.append('h3').text(`Leaf Indicators for ${d.data.name}`);
    const ul = expandedSector.append('ul');

    expandedData.forEach(child => {
        ul.append('li')
            .text(child.name)
            .on('click', () => handleClick(null, { data: child })); // Handle click to show corresponding Barnhart data
    });
}

// Function to create histogram
function createHistogram(selectedYear, city1Data, city2Data, city1, city2, years) {
    console.log('Creating histogram for year:', selectedYear);
    console.log('City 1 data:', city1Data);
    console.log('City 2 data:', city2Data);
    console.log('City 1:', city1);
    console.log('City 2:', city2);

    
    console.log('Data for City 1 to be used in the histogram:', city1Data);
    console.log('Data for City 2 to be used in the histogram:', city2Data);

    // Define the dimensions and margins for the histogram
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Define scale for y-axis
    const yMax = Math.max(
        d3.max(city1Data.flatMap(entry => entry.data.map(d => d.normalized_valore))),
        d3.max(city2Data.flatMap(entry => entry.data.map(d => d.normalized_valore)))
    );
    const yMin = Math.min(
        d3.min(city1Data.flatMap(entry => entry.data.map(d => d.normalized_valore))),
        d3.min(city2Data.flatMap(entry => entry.data.map(d => d.normalized_valore)))
    );
    const y = d3.scaleLinear()
        .domain([yMin, yMax]) // Set the domain to include the minimum and maximum values
        .nice()
        .range([height, 0]);

    // Define scale for x-axis (ordinal scale for indicator names)
    const x = d3.scaleBand()
        .domain(city1Data.map(entry => entry.name))
        .range([0, width])
        .padding(0.1);

    // Calculate bar width based on the number of bars
    const barWidth = Math.min(100, width / (city1Data.length * 2));

    // Remove existing SVG to clear before redrawing
    d3.select("#histogram").select("svg").remove();

    // Create SVG element for the histogram
    const svg = d3.select("#histogram")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create bars for city 1 with tooltip
    svg.selectAll(".bar-city1")
        .data(city1Data)
        .enter().append("rect")
        .attr("class", "bar-city1")
        .attr("x", d => x(d.name))
        .attr("y", d => y(d.data[0].normalized_valore))
        .attr("width", barWidth)
        .attr("height", d => height - y(d.data[0].normalized_valore))
        .style("fill", "steelblue")
        .append("title")
        .text(d => `Indicator: ${d.name}\nCity: ${city1}\nNormalized Value: ${d.data[0].normalized_valore}`);

    // Create bars for city 2 with tooltip
    svg.selectAll(".bar-city2")
        .data(city2Data)
        .enter().append("rect")
        .attr("class", "bar-city2")
        .attr("x", d => x(d.name) + barWidth)
        .attr("y", d => y(d.data[0].normalized_valore))
        .attr("width", barWidth)
        .attr("height", d => height - y(d.data[0].normalized_valore))
        .style("fill", "orange")
        .append("title")
        .text(d => `Indicator: ${d.name}\nCity: ${city2}\nNormalized Value: ${d.data[0].normalized_valore}`);

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-weight", "bold")
        .style("fill", "black")
        .style("text-anchor", "end") // Align text to end
        .attr("dx", "-0.8em") // Adjust position
        .attr("dy", "0.15em") // Adjust position
        .attr("transform", "rotate(-15)"); // Rotate labels by -45 degrees

    // Add y-axis without custom tick format to display exact values
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .text(`Histogram for Selected Cities (Year: ${selectedYear})`);

    // Legend for steel blue (City 1)
    svg.append("rect")
        .attr("x", width - 100)
        .attr("y", height + 30)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", "steelblue");

    svg.append("text")
        .attr("x", width - 80)
        .attr("y", height + 40)
        .text(city1)
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");

    // Legend for orange (City 2)
    svg.append("rect")
        .attr("x", width - 100)
        .attr("y", height + 50)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", "orange");

    svg.append("text")
        .attr("x", width - 80)
        .attr("y", height + 60)
        .text(city2)
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
}


// Get the button element by its id
var nextButton = document.getElementById("nextButton");
console.log("Attaching event listener to 'Next Page' button...");
// Add a click event listener to the button
nextButton.addEventListener("click", function() {
    // Redirect to Page2.html when the button is clicked
    window.location.href = "Page4.html";
});

});



