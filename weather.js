const apiKey = 'f4f5083996d37b0f6c01a5068acdc831'; // Your API key
const baseUrl = 'https://api.openweathermap.org/data/2.5/forecast';

function setActiveButton(buttonId, parentGroupId) {
    // Make the selected button blue and reset siblings to default
    $(`#${parentGroupId} .btn`).removeClass("btn-primary").addClass("btn-secondary");
    $(`#${buttonId}`).removeClass("btn-secondary").addClass("btn-primary");
}

function resetChildButtons(parentGroupId) {
    // Reset buttons in the lower group
    $(`#${parentGroupId} .btn`).removeClass("btn-primary").addClass("btn-secondary");
}

$(document).ready(function () {
    const detailsBox = $("#weatherDetails");

    $("#getForecastBtn").click(() => {
        fetchWeatherData();
        setActiveButton("getForecastBtn", "input-group");
        resetChildButtons("displayButtons");
    });

    $("#showTableBtn").click(() => {
        $("#forecastTable").show();
        $("#forecastChart").hide();
        $("#chartFilterButtons").hide();
        setActiveButton("showTableBtn", "displayButtons");
        resetChildButtons("chartFilterButtons");
        $("#intervalButtons").hide();
        detailsBox.hide();
    });

    $("#showChartBtn").click(() => {
        $("#forecastTable").hide();
        $("#forecastChart").hide();
        $("#chartFilterButtons").show();
        $("#dayButtons").hide();
        $("#intervalButtons").hide();
        setActiveButton("showChartBtn", "displayButtons");
        resetChildButtons("chartFilterButtons");
    });

    $("#show5DayChartBtn").click(() => {
        updateChart(forecastData, '5-day');
        $("#dayButtons").hide();
        $("#intervalButtons").hide();
        $("#forecastChart").show(); // Show the chart after updating it
        setActiveButton("show5DayChartBtn", "chartFilterButtons");
        resetChildButtons("dayButtons");
        detailsBox.hide();
    });

    $("#showDailyChartBtn").click(() => {
        populateDayButtons(forecastData);
        $("#dayButtons").show();
        $("#intervalButtons").hide();
        $("#forecastChart").hide();
        setActiveButton("showDailyChartBtn", "chartFilterButtons");
        resetChildButtons("intervalButtons");
        detailsBox.hide();
    });
});

let forecastData = [];

function fetchWeatherData() {
    const city = $("#cityInput").val().trim();
    if (!city) {
        alert("Please enter a city name.");
        return;
    }

    $.ajax({
        url: `${baseUrl}?q=${city}&appid=${apiKey}&units=metric`,
        method: "GET",
        success: (response) => {
            forecastData = response.list.filter((data) => {
                const time = new Date(data.dt_txt).getHours();
                return time === 0 || time === 3 || time === 6 || time === 9 || time === 12 || time === 15 || time === 18 || time === 21;
            }).slice(0, 40); // Get 5 days (8 intervals per day)
            updateTable(forecastData);
            updateChart(forecastData, '5-day');
            $("#forecastTable").show();
            $("#forecastChart").hide();
            $("#displayButtons").show();
            $("#chartFilterButtons").hide();
        },
        error: (error) => {
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
    const tbody = $("#forecastTable tbody");
    tbody.empty(); // Clear previous rows

    let currentDay = '';
    let rowClass = 'table-green';

    forecastData.forEach((data) => {
        const dateTime = data.dt_txt.split(" ");
        const date = dateTime[0];
        const time = dateTime[1];
        const temperature = data.main.temp.toFixed(1);
        const description = data.weather[0].description;

        if (date !== currentDay) {
            currentDay = date;
            rowClass = rowClass === 'table-green' ? 'table-grey' : 'table-green'; // Alternate row colors
        }

        tbody.append(`
            <tr class="${rowClass}">
                <td>${date}</td>
                <td>${time}</td>
                <td>${temperature}</td>
                <td>${description}</td>
            </tr>
        `);
    });

    $("#forecastTable").show();
}

function updateChart(forecastData, view, selectedDay = null) {
    const ctx = document.getElementById("forecastChart").getContext("2d");

    let labels, temperatures, tooltipData;

    if (view === '5-day') {
        labels = forecastData.map((data) => {
            const date = new Date(data.dt_txt);
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const day = date.toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' });
            return `${time} ${day}`;
        }); // Use formatted time and date for labels
        temperatures = forecastData.map((data) => data.main.temp.toFixed(1));
        tooltipData = forecastData.map((data) => data.dt_txt); // Full datetime for tooltips
    } else if (view === 'daily' && selectedDay) {
        const dailyData = forecastData.filter((data) => data.dt_txt.startsWith(selectedDay));
        labels = dailyData.map((data) => {
            const time = new Date(data.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            return time;
        }); // Use formatted time for labels
        temperatures = dailyData.map((data) => data.main.temp.toFixed(1));
        tooltipData = dailyData.map((data) => data.dt_txt); // Full datetime for tooltips
    }

    if (window.weatherChart) {
        window.weatherChart.destroy();
    }

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
                        color: 'black', // Set the color of the x-axis labels to black
                        callback: function(value, index, values) {
                            return labels[index];
                        },
                    },
                    type: 'category',
                    display: true,
                    title: {
                        display: true,
                        text: 'Time and Date',
                        color: 'black' // Set the color of the x-axis title to black
                    }
                },
                y: {
                    ticks: {
                        color: 'black', // Set the color of the y-axis labels to black
                    },
                    display: true,
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        color: 'black' // Set the color of the y-axis title to black
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems, data) {
                            const index = tooltipItems[0].dataIndex;
                            return tooltipData[index]; // Show full datetime in tooltip
                        },
                    },
                },
                legend: {
                    labels: {
                        color: 'black' // Set the color of the legend labels to black
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    zoom: {
                        enabled: true,
                        mode: 'x',
                    },
                },
            },
        },
    });

    $("#forecastChart").show();
}

function populateDayButtons(forecastData) {
    const uniqueDays = [...new Set(forecastData.map((data) => data.dt_txt.split(" ")[0]))];
    const dayButtons = $("#dayButtons");
    dayButtons.empty();
    uniqueDays.forEach((day, index) => {
        dayButtons.append(`<button class="btn btn-secondary day-btn" id="day-${day}" data-day="${day}">${day}</button>`);
        if (index === 0) {
            setActiveButton(`day-${day}`, "dayButtons");
        }
    });

    $(".day-btn").click(function () {
        const selectedDay = $(this).data("day");
        updateChart(forecastData, 'daily', selectedDay);
        populateIntervalButtons(forecastData, selectedDay);
        $("#intervalButtons").show();
        $("#forecastChart").show();
        setActiveButton($(this).attr("id"), "dayButtons");
        resetChildButtons("intervalButtons");
    });

    // Automatically select and display the first day's data
    if (uniqueDays.length > 0) {
        const firstDay = uniqueDays[0];
        updateChart(forecastData, 'daily', firstDay);
        populateIntervalButtons(forecastData, firstDay);
        $("#intervalButtons").show();
    }
}

function populateIntervalButtons(forecastData, selectedDay) {
    const dailyData = forecastData.filter((data) => data.dt_txt.startsWith(selectedDay));
    const intervalButtons = $("#intervalButtons");
    intervalButtons.empty();
    dailyData.forEach((data) => {
        const time = new Date(data.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const icon = data.weather[0].icon;
        intervalButtons.append(`
            <button class="btn btn-secondary time-btn" id="time-${data.dt_txt}" data-time="${data.dt_txt}">
                <img src="http://openweathermap.org/img/wn/${icon}.png" alt="${data.weather[0].description}"> ${time}
            </button>
        `);
    });

    // Automatically select and display the first interval's data
    if (dailyData.length > 0) {
        const firstInterval = dailyData[0];
        displayWeatherDetails(firstInterval);
        setActiveButton(`time-${firstInterval.dt_txt}`, "intervalButtons");
    }

    $(".time-btn").click(function () {
        const selectedTime = $(this).data("time");
        const selectedData = forecastData.find((data) => data.dt_txt === selectedTime);
        displayWeatherDetails(selectedData);
        setActiveButton($(this).attr("id"), "intervalButtons");
    });
}

function displayWeatherDetails(data) {
    const detailsBox = $("#weatherDetails");
    detailsBox.html(`
        <p><strong>Date:</strong> ${data.dt_txt.split(" ")[0]}</p>
        <p><strong>Time:</strong> ${new Date(data.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
        <p><strong>Temperature:</strong> ${data.main.temp.toFixed(1)} °C</p>
        <p><strong>Weather Description:</strong> ${data.weather[0].description}</p>
    `);
    detailsBox.show();
}