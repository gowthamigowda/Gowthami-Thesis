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
    .startAngle(d => Math.max(0, d.x0  )) // Ensure start angle is within valid range
    .endAngle(d => Math.min(2 * Math.PI, d.x1 + 0.08)) // Ensure end angle is within valid range and slightly overlap
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.002))
    .padRadius(radius * 0.5)
    .innerRadius(d => Math.max(0, d.y0 ))
    .outerRadius(d => Math.max(0, d.y1 - 0.5)); // Adjust outer radius to remove gaps

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
$('#cityDropdown').on('change', function () {
    console.log('Dropdown change event fired');
    const selectedCity = $(this).val(); // Get the selected city
    console.log('Selected city:', selectedCity);

    if (selectedCities.length < 1) {
        // Show the year dropdown if a city is selected
        $('#yearDropdown').show();
    } else {
        // Hide the year dropdown if no city is selected
        $('#yearDropdown').hide();
    }
  
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
                loadSunburst('sunburstContainer1', cityData1, 3);
                loadSunburst('sunburstContainer2', cityData2, 2);

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
    if (d.data.type === 'Tema' || (d.data.type === 'Categoria' && !hasTemaChildren(d))) {
        d3.select(this)
            .style('cursor', 'pointer');
        
        // Display data for all indicators under the "Tema"
        if (d.data.type === 'Tema') {
            d.data.children.forEach(indicator => {
                if (indicator.type === 'Indicatore') {
                    // Your code to display data for indicators
                }
            });
        }
    }
}

// Function to check if the "Categoria" has "Tema" children
function hasTemaChildren(node) {
    if (node && node.data.type === 'Categoria') {
        return node.data.children.some(child => child.type === 'Tema');
    }
    return false;
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
        if (foundCategory.type === 'Tema') {
            // If the found category is "Tema", traverse its children to collect indicator data
            const indicatorData = foundCategory.children
                .filter(child => child.type === 'Indicatore')
                .map(indicator => ({
                    name: indicator.name,
                    data: indicator.data.filter(data => data.comune === cityName)
                }));
            return indicatorData;
        } else if (foundCategory.type === 'Categoria') {
            // If the found category is "Categoria" and has no nested "Tema", directly extract indicator data
            const indicatorData = foundCategory.children
                .filter(child => child.type === 'Indicatore')
                .map(indicator => ({
                    name: indicator.name,
                    data: indicator.data.filter(data => data.comune === cityName)
                }));
            return indicatorData;
        }
    } else {
        console.error(`Category "${categoryName}" not found in ${cityName}`);
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

// Function to calculate the average normalized_valore for each indicator
function calculateAverage(indicatorData) {
    const averageData = {};
    indicatorData.forEach(indicator => {
        const totalNormalizedValore = indicator.data.reduce((sum, data) => sum + data.normalized_valore, 0);
        const averageNormalizedValore = totalNormalizedValore / indicator.data.length;
        averageData[indicator.name] = averageNormalizedValore;
    });
    return averageData;
}



// Function to extract indicator data for a specific year
function getIndicatorDataForYear(indicatorData, year) {
return indicatorData.filter(entry => entry.year === year);
}




// Define the years array globally
let years = ['2016', '2017', '2018', '2019', '2020', '2021', '2022'];

// Declare selectedCity and selectedTema globally to make them accessible throughout the script
let selectedCity;
let selectedTema;
let indicatorDataForSelectedCity, indicatorDataForOtherCities = {};
// Define a global variable to store the value of 'd'
let clickedD;

// Event listener for the click event
function handleClick(event, d) {
    clickedD = d;
    let selectedYear;

    try {
        selectedCity = $('#cityDropdown').val();
        console.log('Selected city in handleClick:', selectedCity);

        // Check if the clicked cell's type is either "Tema" or "Categoria" before proceeding
        if (d && d.data) {
            console.log('Clicked on cell with type "Tema":', d.data.name);

            const basePath = 'FinalFromBatchProcessingFor';
            const filePathCity = `${basePath}/Merged_${selectedCity}_FinalValues.json`;
            console.log('Selected city file:', filePathCity);

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
                    // If a Tema child exists, do not proceed further
                    console.log('Clicked Categoria has a child Tema. Do not proceed further.');
                    return; // Exit the function
                } else {
                    // If no Tema child exists, consider the Categoria itself as the main category
                    categoryName = d.data.name;
                }
            } else {
                categoryName = d.data.name;
            }

            fetchCityData(filePathCity)
                .then(cityData => {
                    indicatorDataForSelectedCity = d.data.children.filter(child => child.type === 'Indicatore');
                    console.log(`Indicator data for ${selectedCity} and selected Tema:`, indicatorDataForSelectedCity);

                    selectedYear = $('#yearDropdown').val();
                    // Pass 'd' as an argument to fetchOtherCitiesData
                    fetchOtherCitiesData(selectedCity, temaName, selectedYear, d);
                })
                .catch(error => {
                    console.error('Error fetching city data:', error);
                });
        }
    } catch (error) {
        console.error('Error in handleClick:', error);
    }
}

// Fetch data for other cities
function fetchOtherCitiesData(selectedCity, temaName, selectedYear, d) {
    const basePath = 'FinalFromBatchProcessingFor';
    const promises = [];

    const allCities = ['Bari', 'Bologna', 'Catania', 'Firenze', 'Genova', 'Milano', 'Napoli', 'Palermo', 'Roma', 'Torino', 'Venezia', 'Verona'];

    temaName = '';
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

    allCities.forEach(city => {
        if (city !== selectedCity) {
            const filePathCity = `${basePath}/Merged_${city}_FinalValues.json`;
            promises.push(fetchCityData(filePathCity)
                .then(cityData => {
                    const indicatorDataForCity = getIndicatorData(cityData, temaName, categoryName, city);
                    console.log(`Indicator data for ${city} and selected Tema:`, indicatorDataForCity);
                    indicatorDataForOtherCities[city] = indicatorDataForCity;
                })
                .catch(error => {
                    console.error(`Error fetching data for ${city}:`, error);
                }));
        }
    });

    Promise.all(promises)
        .then(() => {
            const averageDataForOtherCities = calculateAverage(Object.values(indicatorDataForOtherCities).flat());
            selectedYear = $('#yearDropdown').val();

            createGroupedHistogram(selectedYear, indicatorDataForSelectedCity, averageDataForOtherCities, selectedCity, years);
        })
        .catch(error => {
            console.error('Error fetching data for other cities:', error);
        });
}

$('#yearDropdown').on('change', function () {
    console.log('Year dropdown change event fired');
    const selectedYear = $(this).val();
    console.log('Selected year:', selectedYear);
    const selectedCity = $('#cityDropdown').val();
    // Pass 'd' as an argument to fetchOtherCitiesData
    fetchOtherCitiesData(selectedCity, selectedTema, selectedYear, clickedD);

    // Filter data for the selected year for the selected city
    const filteredSelectedCityData = filterDataForYear(indicatorDataForSelectedCity, selectedYear);
    // Filter data for the selected year for all other cities
    const filteredOtherCitiesData = {};
    Object.keys(indicatorDataForOtherCities).forEach(city => {
        filteredOtherCitiesData[city] = filterDataForYear(indicatorDataForOtherCities[city], selectedYear);
    });

    console.log('Filtered data for Selected City:', filteredSelectedCityData);
    console.log('Filtered data for Other Cities:', filteredOtherCitiesData);

    // Update the histogram with the filtered data and other parameters
    createGroupedHistogram(selectedYear, filteredSelectedCityData, filteredOtherCitiesData, selectedCity, years);
});



// Define a function to filter data for the selected year
function filterDataForYear(data, year) {
return data.map(entry => ({
...entry,
data: entry.data.filter(d => d.year === year)
})).filter(entry => entry.data.length > 0);
}

function createGroupedHistogram(selectedYear, cityData, avgData, city, years) {
    console.log('Creating grouped histogram for year:', selectedYear);
    console.log('Average data:', avgData);
    console.log('city', city);

    // Calculate the average of normalized_valore for each indicator across all cities
    const avgNormalizedValore = {};
    Object.keys(avgData).forEach(indicator => {
        const cityValue = avgData[indicator]; // Get the average value directly
        avgNormalizedValore[indicator] = cityValue; // Store the average value in avgNormalizedValore
    });

    // Combine city and average data for each indicator
    const combinedData = cityData.map(entry => {
        const cityEntry = entry.data.find(d => d.year === selectedYear);
        const cityValue = cityEntry ? cityEntry.normalized_valore : 0; // Default to 0 if cityEntry is undefined
        const avgValue = avgData[entry.name] || 0; // Default to 0 if avgData[entry.name] is undefined
        return {
            name: entry.name,
            cityValue: cityValue,
            avgValue: avgValue
        };
    });

    // Define the dimensions and margins for the histogram
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    // Define scale for y-axis
const yMax = Math.max(
    d3.max(combinedData, d => d.cityValue),
    d3.max(combinedData, d => d.avgValue)
);
const yMin = Math.min(
    d3.min(combinedData, d => d.cityValue),
        d3.min(combinedData, d => d.avgValue)
);
const y = d3.scaleLinear()
    .domain([yMin, yMax]) // Set the domain to include the minimum and maximum values
    .nice()
    .range([height, 0]);

    

    // Define scale for x-axis (ordinal scale for indicator names)
    const x = d3.scaleBand()
        .domain(combinedData.map(d => d.name))
        .range([0, width])
        .padding(0.1);

    // Remove existing SVG to clear before redrawing
    d3.select("#histogram").select("svg").remove();

    // Create SVG element for the histogram
    const svg = d3.select("#histogram")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define color scale for bars
    const colorScale = d3.scaleOrdinal()
        .domain(['city', 'average'])
        .range(['steelblue', 'green']);

    // Create bars for city values
svg.selectAll(".bar-city")
.data(combinedData)
.enter().append("rect")
.attr("class", "bar-city")
.attr("x", d => x(d.name))
.attr("y", d => y(d.cityValue))
.attr("width", x.bandwidth() / 2)
.attr("height", d => height - y(d.cityValue))
.style("fill", colorScale('city')) // Assign color based on category
.append("title") // Add title element for tooltip
.text(d => `${d.name}\nValue: ${d.cityValue}\nCity: ${city}`);

// Create bars for average values
svg.selectAll(".bar-avg")
.data(combinedData)
.enter().append("rect")
.attr("class", "bar-avg")
.attr("x", d => x(d.name) + x.bandwidth() / 2)
.attr("y", d => y(d.avgValue))
.attr("width", x.bandwidth() / 2)
.attr("height", d => height - y(d.avgValue))
.style("fill", colorScale('average')) // Assign color based on category
.append("title") // Add title element for tooltip
.text(d => `${d.name}\nAverage: ${d.avgValue}`);



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

    // Add y-axis
svg.append("g")
.call(d3.axisLeft(y).tickFormat(d => d.toFixed(2)));


    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .text(`Grouped Histogram for ${city} (Year: ${selectedYear})`);

    // Update city legend text
    svg.select("#cityLegendText")
        .text(city);

    // Legend for steel blue (City values)
    svg.append("rect")
        .attr("x", width - 100)
        .attr("y", height + 30)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", "steelblue");

    svg.append("text")
        .attr("x", width - 80)
        .attr("y", height + 40)
        .attr("id", "cityLegendText") // Add id attribute for easy selection
        .text(city) // Initial city name
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");

    // Legend for orange (Average values)
    svg.append("rect")
        .attr("x", width - 100)
        .attr("y", height + 50)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", "green");

    svg.append("text")
        .attr("x", width - 80)
        .attr("y", height + 60)
        .text("Average of all cities")
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
}

// Get the button element by its id
var nextButton = document.getElementById("nextButton");
console.log("Attaching event listener to 'Next Page' button...");
// Add a click event listener to the button
nextButton.addEventListener("click", function() {
    // Redirect to Page2.html when the button is clicked
    window.location.href = "Page5.html";
});


});

