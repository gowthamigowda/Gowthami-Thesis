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
    if (d && d.data && (d.data.type === 'Asse' || d.data.type === 'Categoria' || d.data.type === 'Tema')){
    // Handle mouse enter event
    d3.select(this)
        .style('cursor', 'pointer');
    }
}

        function handleMouseLeave(event, d) {
            // Handle mouse leave event
            if (d && d.data && (d.data.type === 'Asse' || d.data.type === 'Categoria' || d.data.type === 'Tema')){
                
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
        
        function handleClick(event, d) {
            try {
                const selectedCities = $('#cityDropdown').val(); // Assuming this returns an array of selected city names
        
                if (d && d.data) {
                    console.log('Clicked on cell with type:', d.data.type);
        
                    // Extract the name and type of the clicked cell
                    const clickedName = d.data.name;
                    const clickedType = d.data.type;
        
                    // Accumulate data for all selected cities
                    const combinedData = [];
        
                    selectedCities.forEach(selectedCity => {
                        const basePath = 'FinalFromBatchProcessingFor';
                        const filePathCity = `${basePath}/Merged_${selectedCity}_FinalValues.json`;
                        console.log('Selected city file:', filePathCity);
        
                        fetchCityData(filePathCity)
                            .then(cityData => {
                                // Fetch the value for the clicked type and name
                                const selectedData = findDataByType(cityData, clickedName, clickedType);
                                if (selectedData) {
                                    const value = selectedData.value; // Assuming "value" is the property you want to fetch
                                    console.log(`Value for ${selectedCity} and selected ${clickedType} ${clickedName}:`, value);
                                    // Push data for the current city to combinedData array
                                    combinedData.push({ name: selectedCity, value: value });
                                } else {
                                    console.log(`Data not found for ${selectedCity} and selected ${clickedType} ${clickedName}`);
                                }
        
                                // If data has been collected for all selected cities, create histogram
                                if (combinedData.length === selectedCities.length) {
                                    createHistogram(combinedData, selectedCities, clickedName);

                                }
                            })
                            .catch(error => {
                                console.error('Error fetching city data:', error);
                            });
                    });
                }
            } catch (error) {
                console.error('Error in handleClick:', error);
            }
        }
        
        
// Function to find data by type recursively
function findDataByType(data, name, type) {
    if (data.name === name && data.type === type) {
        return data;
    } else if (data.children) {
        for (const child of data.children) {
            const found = findDataByType(child, name, type);
            if (found) return found;
        }
    }
    return null;
}








function createHistogram(data, cityNames, clickedName) {
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.1)
        .domain(cityNames);

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, d => d.value)]);

    // Define color scale
    const color = d3.scaleOrdinal()
        .domain(cityNames)
        .range(d3.schemeCategory10); // Adjust the range of colors as needed

    const svg = d3.select("#histogram").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", (d, i) => x(cityNames[i]))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.value))
        .attr("height", d => height - y(d.value))
        .style("fill", (d, i) => color(cityNames[i])); // Assign color based on city name

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .style("font-weight", "bold") // Apply bold font-weight
        .attr("transform", "rotate(-45)");

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom)
        .style("text-anchor", "middle")
        .text("Selected Cities");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Value");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .style("text-anchor", "middle")
        .text(`BarChart for selected cities - ${clickedName}`);
}


});
