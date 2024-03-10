$(document).ready(function() {
    // Retrieve selected city from query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const selectedCity = urlParams.get('city');
    if (selectedCity) {
        // Append selected city to sidebar
        $('#sidebar').append(`<h2>Selected City: ${selectedCity}</h2>`);
    } else {
        // Handle case when no city is selected
        console.error('No city selected.');
    }

    // Event listener for sunburst1 "Tema" cells
    $('#sunburstContainer1').on('click', 'path[type="Tema"]', function() {
        // Load data for selected city
        loadCityData(selectedCity, 1);
    });

    // Event listener for sunburst2 "Tema" cells
    $('#sunburstContainer2').on('click', 'path[type="Tema"]', function() {
        // Load data for selected city
        loadCityData(selectedCity, 2);
    });

    // Function to load data for selected city
    function loadCityData(selectedCity, sunburstNumber) {
        // Your logic to load data for the selected city and sunburst number
    }
});
