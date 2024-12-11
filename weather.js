const apiKey = 'f4f5083996d37b0f6c01a5068acdc831'; // Your API key
const baseUrl = 'https://api.openweathermap.org/data/2.5/forecast'; // Base URL for the API

// Utility function: Sets a button as active and changes its style
function setActiveButton(buttonId, parentGroupId) {
    $(`#${parentGroupId} .btn`).removeClass("btn-primary").addClass("btn-secondary"); // Reset all buttons to default
    $(`#${buttonId}`).removeClass("btn-secondary").addClass("btn-primary"); // Highlight the selected button
}

// Utility function: Resets the styles of child buttons in a group
function resetChildButtons(parentGroupId) {
    $(`#${parentGroupId} .btn`).removeClass("btn-primary").addClass("btn-secondary"); // Reset to default
}

// Main logic: Execute when the document is fully loaded
$(document).ready(function () {
    const detailsBox = $("#weatherDetails"); // Weather details container

    // Event handler: Fetch weather data when the "Get Forecast" button is clicked
    $("#getForecastBtn").click(() => {
        fetchWeatherData(); // Call API to fetch data
        setActiveButton("getForecastBtn", "input-group"); // Highlight this button
        resetChildButtons("displayButtons"); // Reset other buttons
    });

    // Event handler: Show table view
    $("#showTableBtn").click(() => {
        $("#forecastTable").show(); // Show table
        $("#forecastChart").hide(); // Hide chart
        $("#chartFilterButtons").hide(); // Hide chart filter buttons
        setActiveButton("showTableBtn", "displayButtons"); // Highlight table button
        resetChildButtons("chartFilterButtons"); // Reset chart buttons
        $("#intervalButtons").hide(); // Hide interval buttons
        detailsBox.hide(); // Hide details box
    });

    // Event handler: Show chart view
    $("#showChartBtn").click(() => {
        $("#forecastTable").hide(); // Hide table
        $("#forecastChart").hide(); // Initially hide chart
        $("#chartFilterButtons").show(); // Show chart filter buttons
        $("#dayButtons").hide(); // Hide day buttons
        $("#intervalButtons").hide(); // Hide interval buttons
        setActiveButton("showChartBtn", "displayButtons"); // Highlight chart button
        resetChildButtons("chartFilterButtons"); // Reset other chart buttons
    });

    // Event handler: Show 5-day chart
    $("#show5DayChartBtn").click(() => {
        updateChart(forecastData, '5-day'); // Update chart with 5-day data
        $("#dayButtons").hide(); // Hide day buttons
        $("#intervalButtons").hide(); // Hide interval buttons
        $("#forecastChart").show(); // Show chart
        setActiveButton("show5DayChartBtn", "chartFilterButtons"); // Highlight 5-day button
        resetChildButtons("dayButtons"); // Reset day buttons
        detailsBox.hide(); // Hide details box
    });

    // Event handler: Show daily chart
    $("#showDailyChartBtn").click(() => {
        populateDayButtons(forecastData); // Populate day buttons for daily data
        $("#dayButtons").show(); // Show day buttons
        $("#intervalButtons").hide(); // Hide interval buttons
        $("#forecastChart").hide(); // Initially hide chart
        setActiveButton("showDailyChartBtn", "chartFilterButtons"); // Highlight daily chart button
        resetChildButtons("intervalButtons"); // Reset interval buttons
        detailsBox.hide(); // Hide details box
    });
});

let forecastData = []; // Store the fetched weather data

// Function: Fetch weather data from the OpenWeatherMap API
function fetchWeatherData() {
    const city = $("#cityInput").val().trim(); // Get the city name from input
    if (!city) {
        alert("Please enter a city name."); // Validation check
        return;
    }

    // AJAX request to fetch data
    $.ajax({
        url: `${baseUrl}?q=${city}&appid=${apiKey}&units=metric`, // API URL
        method: "GET",
        success: (response) => {
            // Filter data to include specific intervals
            forecastData = response.list.filter((data) => {
                const time = new Date(data.dt_txt).getHours();
                return time === 0 || time % 3 === 0; // Include every 3-hour interval
            }).slice(0, 40); // Limit to 40 entries (5 days)
            
            updateTable(forecastData); // Update table with the data
            updateChart(forecastData, '5-day'); // Update chart with 5-day data
            $("#forecastTable").show(); // Show table by default
            $("#forecastChart").hide(); // Hide chart by default
            $("#displayButtons").show(); // Show view toggle buttons
            $("#chartFilterButtons").hide(); // Hide chart filters initially
        },
        error: (error) => {
            alert("Unable to fetch weather data. Please check the city name."); // Handle errors
            $("#forecastTable").hide(); // Hide table
            $("#forecastChart").hide(); // Hide chart
            $("#displayButtons").hide(); // Hide toggle buttons
            $("#chartFilterButtons").hide(); // Hide chart filters
            console.error(error); // Log error for debugging
        },
    });
}

// Function: Populate the forecast table
function updateTable(forecastData) {
    const tbody = $("#forecastTable tbody");
    tbody.empty(); // Clear previous rows

    let currentDay = ''; // Track current day to alternate row colors
    let rowClass = 'table-green'; // Initial row color

    forecastData.forEach((data) => {
        const [date, time] = data.dt_txt.split(" "); // Split datetime
        const temperature = data.main.temp.toFixed(1); // Round temperature
        const description = data.weather[0].description; // Weather description

        // Alternate row color if the day changes
        if (date !== currentDay) {
            currentDay = date;
            rowClass = rowClass === 'table-green' ? 'table-grey' : 'table-green';
        }

        // Add a row to the table
        tbody.append(`
            <tr class="${rowClass}">
                <td>${date} ${time}</td>
                <td>${temperature}</td>
                <td>${description}</td>
            </tr>
        `);
    });

    $("#forecastTable").show(); // Show the table
}

// Function: Update the chart with the provided forecast data
function updateChart(forecastData, view, selectedDay = null) {
    const ctx = document.getElementById("forecastChart").getContext("2d");

    let labels, temperatures, tooltipData;

    if (view === '5-day') {
        // Generate labels and data for a 5-day view
        labels = forecastData.map((data) => {
            const date = new Date(data.dt_txt);
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const day = date.toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' });
            return `${time} ${day}`;
        });
        temperatures = forecastData.map((data) => data.main.temp.toFixed(1));
        tooltipData = forecastData.map((data) => data.dt_txt); // Full datetime for tooltips
    } else if (view === 'daily' && selectedDay) {
        // Generate labels and data for a single day
        const dailyData = forecastData.filter((data) => data.dt_txt.startsWith(selectedDay));
        labels = dailyData.map((data) => new Date(data.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
        temperatures = dailyData.map((data) => data.main.temp.toFixed(1));
        tooltipData = dailyData.map((data) => data.dt_txt); // Full datetime for tooltips
    }

    if (window.weatherChart) {
        window.weatherChart.destroy(); // Clear the previous chart
    }

    // Create a new chart
    window.weatherChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Temperature (°C)",
                    data: temperatures,
                    borderColor: "blue",
                    borderWidth: 2,
                    fill: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        color: 'black',
                        callback: function (value, index) {
                            return labels[index]; // Display labels on the x-axis
                        },
                    },
                    title: {
                        display: true,
                        text: 'Time and Date',
                        color: 'black',
                    },
                },
                y: {
                    ticks: {
                        color: 'black',
                    },
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        color: 'black',
                    },
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function (tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            return tooltipData[index]; // Show full datetime in tooltip
                        },
                    },
                },
                legend: {
                    labels: {
                        color: 'black',
                    },
                },
                zoom: {
                    pan: { enabled: true, mode: 'x' }, // Enable panning on the x-axis
                    zoom: { enabled: true, mode: 'x' }, // Enable zooming on the x-axis
                },
            },
        },
    });

    $("#forecastChart").show(); // Show the chart
}
