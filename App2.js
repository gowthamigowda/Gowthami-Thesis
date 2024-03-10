document.addEventListener("DOMContentLoaded", function () {
    let paths;
    let selectedCities = [];

    
   
// Function to load and render sunburst diagram
function loadSunburst(containerId, data) {
    console.log("Loading sunburst for container:", containerId);
    // Clear previous content in the container
    document.getElementById(containerId).innerHTML = '';

    const width = 900;
    const height = 900;
    const fixedRadius = 450;
    const radius = fixedRadius;

    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`)
        .style('background-color', 'lightgray');

    const g = svg.append('g'); // Create a new 'g' element to group paths

    const partition = d3.partition().size([2 * Math.PI, radius]);

    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => Math.max(0, d.y0))
        .outerRadius(d => Math.max(0, d.y1));

    // Initialize x scale
    const x = d3.scaleLinear().range([0, 2 * Math.PI]);

    const root = d3.hierarchy(data);
    root.sum(d => 1);

// Define an array of colors for each "Asse" segment
const asseColors = ['rgb(34, 139, 34)', 'Purple', 'blue', 'yellow', 'orange', 'purple']; // Add more colors as needed

const paths = g.selectAll('path')
    .data(partition(root).descendants())
    .join('path')
    .attr('display', d => d.depth <= 3 ? null : 'none') // Ensure the correct display attribute
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
            color = 'white';
            saturation = 0; // No saturation
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
       
        
        

   
        
        
        
        
        
        
        const text = g.selectAll("text")
        .data(partition(root).descendants())
        .join("text")
        .filter(d => d.depth <= 3) // Adjust depth condition as needed
        .attr("transform", d => {
            const position = arc.centroid(d);
            const rotation = computeTextRotation(d);
            return `translate(${position}) rotate(${rotation})`;
        })
        .attr("dy", "0.35em") // Adjust vertical positioning of the text
        .attr("text-anchor", "middle")
        .html(d => {
            const arcLength = (d.x1 - d.x0) * radius;
            const textLength = d.data.name.length;

            // Adjust the threshold value as needed
            const maxCharsPerLine = 10;

            // Insert line breaks if text length exceeds the threshold
            if (textLength > maxCharsPerLine) {
                const words = d.data.name.split(' ');
                const lines = [];
                let currentLine = '';

                words.forEach(word => {
                    if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
                        currentLine += (currentLine === '' ? '' : ' ') + word;
                    } else {
                        lines.push(currentLine);
                        currentLine = word;
                    }
                });

                lines.push(currentLine);
                return lines.map((line, index) => `<tspan x="0" dy="${index === 0 ? 0 : '1.2em'}">${line}</tspan>`).join('');
            } else {
                return `<tspan>${d.data.name}</tspan>`;
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

    const cityJsonPath1 = `${basePath}1/${city}_FinalValues.json`;
    const cityJsonPath2 = `${basePath}2/${city}_FinalValues.json`;

    fetch(cityJsonPath1)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to load data for ${city} in sunburst container 1. Status: ${response.status}`);
        }
        return response.json();
    })
    .then(cityData1 => {
        console.log(`Data for ${city} in sunburst container 1:`, cityData1);
        loadSunburst('sunburstContainer1', cityData1);
        updateSunburstColors('sunburstContainer1', parseCityName(cityJsonPath1)); // Pass selectedCity
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
        loadSunburst('sunburstContainer2', cityData2);
        updateSunburstColors('sunburstContainer2', parseCityName(cityJsonPath2)); // Pass selectedCity
        console.log(`Sunburst and colors updated for sunburst container 2.`);
      
    })
    .catch(error => console.error(`Error loading data for ${city} in sunburst container 2:`, error));
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
const path1 = "Data1.json";
const path2 = "Data2.json";

const hierarchyData1 = fetch(path1).then(response => response.json());
const hierarchyData2 = fetch(path2).then(response => response.json());

hierarchyData1.then(data => {
    console.log("Data for Sunburst(1):", data);
    loadSunburst("sunburstContainer1", data);
    globalData = data;
});

hierarchyData2.then(data => {
    console.log("Data for Sunburst(2):", data);
    loadSunburst("sunburstContainer2", data);
   
});


// Update the selected cities when the city dropdown changes
$('#cityDropdown').on('change', function () {
    console.log('Dropdown change event fired');
    const selectedCity = $(this).val(); // Get the selected city
    console.log('Selected city:', selectedCity);

    if (selectedCity.length === 1) {
        console.log('One city selected:', selectedCity[0]);
        
        // Update selectedCities with the single selected city
        selectedCities = [selectedCity[0]];

        // Only one city is selected
        // Update sunburst, bar chart, and line chart for the single selected city
        loadCityData(selectedCity[0]); // Pass selectedCity instead of selectedCities[0]
        
       
    }
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
                loadSunburst('sunburstContainer1', cityData1);
                loadSunburst('sunburstContainer2', cityData2);

                // Display updated colors in the console
                const colorsContainer1 = d3.selectAll(`#sunburstContainer1 path`).nodes().map(node => d3.select(node).style('fill'));
                const colorsContainer2 = d3.selectAll(`#sunburstContainer2 path`).nodes().map(node => d3.select(node).style('fill'));
                console.log(`Updated colors in sunburstContainer1:`, colorsContainer1);
                console.log(`Updated colors in sunburstContainer2:`, colorsContainer2);

                console.log(`Sunburst colors for ${containerId} updated.`);
            })
            .catch(error => console.error(`Error loading data for ${selectedCity}:`, error));
    } catch (error) {
        console.error('Error in updateSunburstColors:', error);
    }
}







        function handleMouseEnter(event, d) {
            // Handle mouse enter event
            if (d.data.type === 'Tema') {
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
        
        
        
        function getIndicatorData(cityData, temaName, cityName) {
            const foundTema = findTema(cityData, temaName);
            if (foundTema) {
                const indicatorData = foundTema.children
                    .filter(child => child.type === 'Indicatore')
                    .map(indicator => ({
                        name: indicator.name,
                        data: indicator.data.filter(data => data.comune === cityName)
                    }));
                return indicatorData;
            } else {
                console.error(`Tema "${temaName}" not found in ${cityName}`);
                return [];
            }
        }
        
        function findTema(data, temaName) {
            if (data.name === temaName && data.type === 'Tema') {
                return data;
            } else if (data.children) {
                for (const child of data.children) {
                    const found = findTema(child, temaName);
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

// Event listener for the click event
function handleClick(event, d) {
    let selectedYear; // Declare selectedYear here
    
    try {
        // Extract the selected cities from the dropdown
        const selectedCities = $('#cityDropdown').val();
        console.log('Selected cities in handleClick:', selectedCities); // Log the selected cities

        
        // Check if the clicked cell's type is "Tema" before proceeding
        if (d && d.data && d.data.type === 'Tema') {
            console.log('Clicked on cell with type "Tema":', d.data.name);

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

            Promise.all([fetchCityData(filePathCity1), fetchCityData(filePathCity2)])
                .then(([cityData1, cityData2]) => {
                    // Extract indicator data for City 1
                    indicatorDataForCity1 = getIndicatorData(cityData1, d.data.name, city1);
                    console.log(`Indicator data for ${city1} and selected Tema:`, indicatorDataForCity1);

                    // Extract indicator data for City 2
                    indicatorDataForCity2 = getIndicatorData(cityData2, d.data.name, city2);
                    console.log(`Indicator data for ${city2} and selected Tema:`, indicatorDataForCity2);

                    // Use the selected year obtained from the dropdown
                    selectedYear = selectedYear; // Use the selectedYear variable directly

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

// Define the createHistogram function
function createHistogram(selectedYear, city1Data, city2Data, city1, city2, years) {
    console.log('Creating histogram for year:', selectedYear);
    console.log('City 1 data:', city1Data);
    console.log('City 2 data:', city2Data);
    console.log('City 1:', city1);
    console.log('City 2:', city2);

    // Log the data that will be used to create the histogram
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
    const y = d3.scaleLinear()
        .domain([0, yMax])
        .nice()
        .range([height, 0]);

    // Define scale for x-axis (ordinal scale for indicator names)
    const x = d3.scaleBand()
        .domain(city1Data.map(entry => entry.name))
        .range([0, width])
        .padding(0.1);

        // Remove existing SVG to clear before redrawing
    d3.select("#histogram").select("svg").remove();

    // Create SVG element for the histogram
    const svg = d3.select("#histogram").select("svg");
    if (svg.empty()) {
        const svg = d3.select("#histogram")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
// Create bars for city 1
svg.selectAll(".bar-city1")
    .data(city1Data)
    .enter().append("rect")
    .attr("class", "bar-city1")
    .attr("x", d => x(d.name))
    .attr("y", d => y(d.data[0].normalized_valore))
    .attr("width", x.bandwidth() / 2)
    .attr("height", d => height - y(d.data[0].normalized_valore)) // Removed extra closing parenthesis here
    .style("fill", "steelblue");

// Create bars for city 2
svg.selectAll(".bar-city2")
    .data(city2Data)
    .enter().append("rect")
    .attr("class", "bar-city2")
    .attr("x", d => x(d.name) + x.bandwidth() / 2)
    .attr("y", d => y(d.data[0].normalized_valore))
    .attr("width", x.bandwidth() / 2)
    .attr("height", d => height - y(d.data[0].normalized_valore)) // Removed extra closing parenthesis here
    .style("fill", "orange");


       // Add x-axis
svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("font-weight", "bold") // Make the text bold
    .style("fill", "black") // Set the text color to black
    .style("text-anchor", "middle"); // Center the text horizontally

        // Add y-axis
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
.attr("y", height + 30) // Move the legend down below the x-axis labels
.attr("width", 10)
.attr("height", 10)
.style("fill", "steelblue");

svg.append("text")
.attr("x", width - 80)
.attr("y", height + 40) // Move the legend text down below the x-axis labels
.text(city1)
.style("font-size", "12px")
.attr("alignment-baseline", "middle");

// Legend for orange (City 2)
svg.append("rect")
.attr("x", width - 100)
.attr("y", height + 50) // Move the legend down below the x-axis labels
.attr("width", 10)
.attr("height", 10)
.style("fill", "orange");

svg.append("text")
.attr("x", width - 80)
.attr("y", height + 60) // Move the legend text down below the x-axis labels
.text(city2)
.style("font-size", "12px")
.attr("alignment-baseline", "middle");

    }
}
// Get the button element by its id
var nextButton = document.getElementById("nextButton");
console.log("Attaching event listener to 'Next Page' button...");
// Add a click event listener to the button
nextButton.addEventListener("click", function() {
    // Redirect to Page2.html when the button is clicked
    window.location.href = "App3.html";
});

});

