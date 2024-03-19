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
const asseColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
// Add more colors as needed

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
                const indicators = foundTema.children.filter(child => child.type === 'Indicatore');
                const indicatorData = indicators.map(indicator => ({
                    name: indicator.name,
                    data: indicator.data.filter(data => data.comune === cityName)
                }));
                return indicatorData;
            } else {
                console.error(`Tema "${temaName}" not found in ${cityName}`);
                return [];
            }
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




// Define the years array globally
let years = ['2016', '2017', '2018', '2019', '2020', '2021', '2022'];

// Declare selectedCity globally to make it accessible throughout the script
let city;
let selectedTema;
let indicatorDataForSelectedCity, indicatorDataForOtherCities = {};

// Event listener for the click event
function handleClick(event, d) {
    let selectedYear;

    try {
        const selectedCity = $('#cityDropdown').val();
        console.log('Selected city in handleClick:', selectedCity);

        if (d && d.data && d.data.type === 'Tema') {
            console.log('Clicked on cell with type "Tema":', d.data.name);
            selectedTema = d.data.name;

            const basePath = 'FinalFromBatchProcessingFor';
            const filePathCity = `${basePath}/Merged_${selectedCity}_FinalValues.json`;
            console.log('Selected city file:', filePathCity);

            fetchCityData(filePathCity)
                .then(cityData => {
                    indicatorDataForSelectedCity = d.data.children.filter(child => child.type === 'Indicatore');
                    console.log(`Indicator data for ${selectedCity} and selected Tema:`, indicatorDataForSelectedCity);

                    selectedYear = $('#yearDropdown').val();
                    fetchOtherCitiesData(selectedCity, selectedTema, selectedYear);
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
function fetchOtherCitiesData(selectedCity, temaName, selectedYear) {
    const basePath = 'FinalFromBatchProcessingFor';
    const promises = [];

    const allCities = ['Bari', 'Bologna', 'Catania', 'Firenze', 'Genova', 'Milano', 'Napoli', 'Palermo', 'Roma', 'Torino', 'Venezia', 'Verona'];

    allCities.forEach(city => {
        if (city !== selectedCity) {
            const filePathCity = `${basePath}/Merged_${city}_FinalValues.json`;
            promises.push(fetchCityData(filePathCity)
                .then(cityData => {
                    const indicatorDataForCity = getIndicatorData(cityData, temaName, city);
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
    fetchOtherCitiesData(selectedCity, selectedTema, selectedYear);



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
    const y = d3.scaleLinear()
        .domain([0, yMax])
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
        .style("fill", colorScale('city')); // Assign color based on category

    // Create bars for average values
    svg.selectAll(".bar-avg")
        .data(combinedData)
        .enter().append("rect")
        .attr("class", "bar-avg")
        .attr("x", d => x(d.name) + x.bandwidth() / 2)
        .attr("y", d => y(d.avgValue))
        .attr("width", x.bandwidth() / 2)
        .attr("height", d => height - y(d.avgValue))
        .style("fill", colorScale('average')); // Assign color based on category

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
        .call(d3.axisLeft(y));

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
    window.location.href = "App4.html";
});


});

