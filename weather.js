const apiKey = 'f4f5083996d37b0f6c01a5068acdc831'; // Your API key
const baseUrl = 'https://api.openweathermap.org/data/2.5/forecast';

function setActiveButton(buttonId, parentGroupId) {
    // Set the selected button as active (blue) and reset siblings to inactive (default gray)
    $(`#${parentGroupId} .btn`).removeClass("btn-primary").addClass("btn-secondary");
    $(`#${buttonId}`).removeClass("btn-secondary").addClass("btn-primary");
}

function resetChildButtons(parentGroupId) {
    // Reset all child buttons in the specified parent group to inactive (default gray)
    $(`#${parentGroupId} .btn`).removeClass("btn-primary").addClass("btn-secondary");
}

$(document).ready(function () {
    const detailsBox = $("#weatherDetails"); // Reference to the details display box

    // Button click handlers
    $("#getForecastBtn").click(() => {
        fetchWeatherData(); // Fetch weather data when this button is clicked
        setActiveButton("getForecastBtn", "input-group"); // Set this button as active
        resetChildButtons("displayButtons"); // Reset display button states
    });

    $("#showTableBtn").click(() => {
        // Show the forecast table, hide chart and other elements
        $("#forecastTable").show();
        $("#forecastChart").hide();
        $("#chartFilterButtons").hide();
        setActiveButton("showTableBtn", "displayButtons"); // Set this button as active
        resetChildButtons("chartFilterButtons"); // Reset chart filter buttons
        $("#intervalButtons").hide();
        detailsBox.hide();
    });

    $("#showChartBtn").click(() => {
        // Show chart-related elements, hide table and unnecessary elements
        $("#forecastTable").hide();
        $("#forecastChart").hide();
        $("#chartFilterButtons").show();
        $("#dayButtons").hide();
        $("#intervalButtons").hide();
        setActiveButton("showChartBtn", "displayButtons"); // Set this button as active
        resetChildButtons("chartFilterButtons"); // Reset chart filter buttons
    });

    $("#show5DayChartBtn").click(() => {
        // Show 5-day chart view
        updateChart(forecastData, '5-day');
        $("#dayButtons").hide();
        $("#intervalButtons").hide();
        $("#forecastChart").show(); // Display the chart
        setActiveButton("show5DayChartBtn", "chartFilterButtons"); // Set this button as active
        resetChildButtons("dayButtons"); // Reset day buttons
        detailsBox.hide();
    });

    $("#showDailyChartBtn").click(() => {
        // Show daily chart view with day buttons for selection
        populateDayButtons(forecastData);
        $("#dayButtons").show();
        $("#intervalButtons").hide();
        $("#forecastChart").hide();
        setActiveButton("showDailyChartBtn", "chartFilterButtons"); // Set this button as active
        resetChildButtons("intervalButtons"); // Reset interval buttons
        detailsBox.hide();
    });
});

let forecastData = []; // To store fetched weather forecast data

function fetchWeatherData() {
    const city = $("#cityInput").val().trim(); // Get user input for city name
    if (!city) {
        alert("Please enter a city name."); // Alert if city name is empty
        return;
    }

    // Make an API request to fetch weather data
    $.ajax({
        url: `${baseUrl}?q=${city}&appid=${apiKey}&units=metric`,
        method: "GET",
        success: (response) => {
            // Filter data to include only specific times and limit to 5 days
            forecastData = response.list.filter((data) => {
                const time = new Date(data.dt_txt).getHours();
                return time === 0 || time === 3 || time === 6 || time === 9 || time === 12 || time === 15 || time === 18 || time === 21;
            }).slice(0, 40);

            // Update table and chart with the fetched data
            updateTable(forecastData);
            updateChart(forecastData, '5-day');
            $("#forecastTable").show();
            $("#forecastChart").hide();
            $("#displayButtons").show();
            $("#chartFilterButtons").hide();
        },
        error: (error) => {
            // Handle errors such as invalid city name or network issues
            alert("Unable to fetch weather data. Please check the city name.");
            $("#forecastTable").hide();
            $("#forecastChart").hide();
            $("#displayButtons").hide();
            $("#chartFilterButtons").hide();
            console.error(error);
        },
    });
}

function updateTable(forecastData) {
    const tbody = $("#forecastTable tbody"); // Reference to table body
    tbody.empty(); // Clear existing rows

    let currentDay = ''; // To track the current day for alternating row colors
    let rowClass = 'table-green';

    forecastData.forEach((data) => {
        // Extract date, time, temperature, and description from data
        const dateTime = data.dt_txt.split(" ");
        const date = dateTime[0];
        const time = dateTime[1];
        const temperature = data.main.temp.toFixed(1);
        const description = data.weather[0].description;

        // Alternate row colors based on the date
        if (date !== currentDay) {
            currentDay = date;
            rowClass = rowClass === 'table-green' ? 'table-grey' : 'table-green';
        }

        // Append row to the table
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

function updateChart(forecastData, view, selectedDay = null) {
    const ctx = document.getElementById("forecastChart").getContext("2d"); // Get chart context

    let labels, temperatures, tooltipData;

    if (view === '5-day') {
        // Generate labels and data for 5-day view
        labels = forecastData.map((data) => {
            const date = new Date(data.dt_txt);
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const day = date.toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' });
            return `${time} ${day}`;
        });
        temperatures = forecastData.map((data) => data.main.temp.toFixed(1));
        tooltipData = forecastData.map((data) => data.dt_txt);
    } else if (view === 'daily' && selectedDay) {
        // Generate labels and data for selected daily view
        const dailyData = forecastData.filter((data) => data.dt_txt.startsWith(selectedDay));
        labels = dailyData.map((data) => {
            const time = new Date(data.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            return time;
        });
        temperatures = dailyData.map((data) => data.main.temp.toFixed(1));
        tooltipData = dailyData.map((data) => data.dt_txt);
    }

    if (window.weatherChart) {
        window.weatherChart.destroy(); // Destroy the previous chart instance
    }

    // Create a new chart instance
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
                        color: 'black', // Style x-axis labels
                        callback: function(value, index, values) {
                            return labels[index];
                        },
                    },
                    type: 'category',
                    display: true,
                    title: {
                        display: true,
                        text: 'Time and Date',
                        color: 'black' // Style x-axis title
                    }
                },
                y: {
                    ticks: {
                        color: 'black', // Style y-axis labels
                    },
                    display: true,
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        color: 'black' // Style y-axis title
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems, data) {
                            const index = tooltipItems[0].dataIndex;
                            return tooltipData[index]; // Display full datetime in tooltip
                        },
                    },
                },
                legend: {
                    labels: {
                        color: 'black' // Style legend labels
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x', // Enable panning horizontally
                    },
                    zoom: {
                        enabled: true,
                        mode: 'x', // Enable zooming horizontally
                    },
                },
            },
        },
    });

    $("#forecastChart").show(); // Show the chart
}

function populateDayButtons(forecastData) {
    const uniqueDays = [...new Set(forecastData.map((data) => data.dt_txt.split(" ")[0]))]; // Get unique dates
    const dayButtons = $("#dayButtons"); // Reference to day buttons container
    dayButtons.empty(); // Clear existing buttons

    uniqueDays.forEach((day, index) => {
        // Add a button for each unique day
        dayButtons.append(`<button class="btn btn-secondary day-btn" id="day-${day}" data-day="${day}">${day}</button>`);
        if (index === 0) {
            setActiveButton(`day-${day}`, "dayButtons"); // Set the first button as active
        }
    });

    $(".day-btn").click(function () {
        // Handle day button click
        const selectedDay = $(this).data("day");
        updateChart(forecastData, 'daily', selectedDay); // Update chart for selected day
        populateIntervalButtons(forecastData, selectedDay); // Populate interval buttons
        $("#intervalButtons").show();
        $("#forecastChart").show();
        setActiveButton($(this).attr("id"), "dayButtons"); // Set clicked button as active
        resetChildButtons("intervalButtons");
    });

    // Automatically select and display data for the first day
    if (uniqueDays.length > 0) {
        const firstDay = uniqueDays[0];
        updateChart(forecastData, 'daily', firstDay);
        populateIntervalButtons(forecastData, firstDay);
        $("#intervalButtons").show();
    }
}

function populateIntervalButtons(forecastData, selectedDay) {
    const dailyData = forecastData.filter((data) => data.dt_txt.startsWith(selectedDay)); // Get data for the selected day
    const intervalButtons = $("#intervalButtons"); // Reference to interval buttons container
    intervalButtons.empty(); // Clear existing buttons

    dailyData.forEach((data) => {
        // Add a button for each interval in the selected day
        const time = new Date(data.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const icon = data.weather[0].icon;
        intervalButtons.append(`
            <button class="btn btn-secondary time-btn" id="time-${data.dt_txt}" data-time="${data.dt_txt}">
                <img src="http://openweathermap.org/img/wn/${icon}.png" alt="${data.weather[0].description}"> ${time}
            </button>
        `);
    });

    // Automatically select and display details for the first interval
    if (dailyData.length > 0) {
        const firstInterval = dailyData[0];
        displayWeatherDetails(firstInterval); // Show details for the first interval
        setActiveButton(`time-${firstInterval.dt_txt}`, "intervalButtons"); // Set the first interval as active
    }

    $(".time-btn").click(function () {
        // Handle interval button click
        const selectedTime = $(this).data("time");
        const selectedData = forecastData.find((data) => data.dt_txt === selectedTime);
        displayWeatherDetails(selectedData); // Show details for the selected interval
        setActiveButton($(this).attr("id"), "intervalButtons"); // Set clicked button as active
    });
}

function displayWeatherDetails(data) {
    const detailsBox = $("#weatherDetails"); // Reference to the details display box
    // Populate and display weather details
    detailsBox.html(`
        <p><strong>Date:</strong> ${data.dt_txt.split(" ")[0]}</p>
        <p><strong>Time:</strong> ${new Date(data.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
        <p><strong>Temperature:</strong> ${data.main.temp.toFixed(1)} °C</p>
        <p><strong>Weather Description:</strong> ${data.weather[0].description}</p>
    `);
    detailsBox.show(); // Show the details box
}
