// API Configuration
const API_KEY = ''; // Add API Key
const BASE_URL = 'http://api.weatherapi.com/v1/current.json';

// Application State
let currentWeatherData = null;
let searchHistory = [];
let isCelsius = true;

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherContainer = document.getElementById('weatherContainer');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const historyBtn = document.getElementById('historyBtn');
const historyDropdown = document.getElementById('historyDropdown');
const historyList = document.getElementById('historyList');
const toggleUnitBtn = document.getElementById('toggleUnitBtn');
const unitText = document.getElementById('unitText');

// Weather data elements
const cityName = document.getElementById('cityName');
const country = document.getElementById('country');
const currentDate = document.getElementById('currentDate');
const currentTime = document.getElementById('currentTime');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feelsLike');
const weatherIcon = document.getElementById('weatherIcon');
const weatherCondition = document.getElementById('weatherCondition');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const visibility = document.getElementById('visibility');
const pressure = document.getElementById('pressure');
const aqiValue = document.getElementById('aqiValue');
const aqiLabel = document.getElementById('aqiLabel');
const errorMessage = document.getElementById('errorMessage');

// Color of quality message
function getAQIColorClass(epaIndex) {
    switch (epaIndex) {
        case 1: return 'bg-green-200 border-green-200'; // Good
        case 2: return 'bg-yellow-200 border-yellow-200'; // Moderate
        case 3: return 'bg-orange-200 border-orange-200'; // Unhealthy for Sensitive Groups
        case 4: return 'bg-red-200 border-red-200'; // Unhealthy
        case 5: return 'bg-purple-200 border-purple-200'; // Very Unhealthy
        case 6: return 'bg-pink-200 border-pink-200'; // Hazardous
        default: return 'bg-gray-200 border-gray-200'; // Unknown
    }
}

// Event Listeners
searchBtn.addEventListener('click', () => getWeather());
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') getWeather();
});
historyBtn.addEventListener('click', toggleHistoryDropdown);
toggleUnitBtn.addEventListener('click', toggleTemperatureUnit);

// Main function to get weather data
async function getWeather(city = null) {
    const query = city || cityInput.value.trim();
    if (!query) return;
    showLoading();
    hideError();
    try {
        const response = await fetch(`${BASE_URL}?key=${API_KEY}&q=${encodeURIComponent(query)}&aqi=yes`);
        if (!response.ok) throw new Error('City not found');
        const data = await response.json();
        currentWeatherData = data;
        displayWeather(data);
        addToSearchHistory(data.location.name);
        hideLoading();
    } catch (err) {
        showError('City not found. Please try again.');
        hideLoading();
    }
}

// Display weather data in the UI
function displayWeather(data) {
    hideError();
    cityName.textContent = data.location.name;
    country.textContent = data.location.country;
    currentDate.textContent = data.location.localtime.split(' ')[0];
    currentTime.textContent = data.location.localtime.split(' ')[1];
    updateTemperature(data.current);
    weatherIcon.src = data.current.condition.icon;
    weatherCondition.textContent = data.current.condition.text;
    humidity.textContent = data.current.humidity + '%';
    windSpeed.textContent = data.current.wind_kph + ' km/h';
    visibility.textContent = data.current.vis_km + ' km';
    pressure.textContent = data.current.pressure_mb + ' mb';
    if (data.current.air_quality && data.current.air_quality['us-epa-index']) {
        const epaIndex = data.current.air_quality['us-epa-index']; // <-- FIXED
        aqiValue.textContent = epaIndex;
        aqiLabel.textContent = getAQILabel(epaIndex);
        airQualitySection.className = "air-quality rounded-2xl p-6 transition-colors duration-500 " + getAQIColorClass(epaIndex);
    } else {
        aqiValue.textContent = '--';
        aqiLabel.textContent = '--';
        airQualitySection.className = "air-quality bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100";
    }
}

// Update temperature display with unit conversion
function updateTemperature(current) {
    if (isCelsius) {
        temperature.textContent = `${current.temp_c}°C`;
        feelsLike.textContent = `Feels like ${current.feelslike_c}°C`;
        unitText.textContent = '°C';
    } else {
        temperature.textContent = `${current.temp_f}°F`;
        feelsLike.textContent = `Feels like ${current.feelslike_f}°F`;
        unitText.textContent = '°F';
    }
}

// Get air quality label based on EPA index
function getAQILabel(epaIndex) {
    switch (epaIndex) {
        case 1: return 'Good';
        case 2: return 'Moderate';
        case 3: return 'Unhealthy for Sensitive Groups';
        case 4: return 'Unhealthy';
        case 5: return 'Very Unhealthy';
        case 6: return 'Hazardous';
        default: return 'Unknown';
    }
}

// Add city to search history
function addToSearchHistory(city) {
    if (!searchHistory.includes(city)) {
        searchHistory.unshift(city);
        if (searchHistory.length > 10) searchHistory.pop();
        updateHistoryDropdown();
    }
}

// Update history dropdown display
function updateHistoryDropdown() {
    if (searchHistory.length === 0) {
        historyList.innerHTML = '<div class="px-4 py-5 text-center text-gray-500 text-sm italic">No recent searches</div>';
        return;
    }

    historyList.innerHTML = searchHistory.map(city => `
        <div class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-100 hover:bg-gray-50 border-b border-gray-100"
             onclick="selectFromHistory('${city.replace(/'/g, "\\'")}')">
            <i class="fas fa-map-marker-alt text-blue-500 text-sm"></i>
            <span class="flex-1 text-sm text-gray-800">${city}</span>
            <button class="text-red-500 bg-transparent border-none cursor-pointer p-1 rounded transition-colors duration-200 hover:bg-red-50"
                    onclick="removeFromHistory('${city.replace(/'/g, "\\'")}', event)">
                <i class="fas fa-times text-xs"></i>
            </button>
        </div>
    `).join('');
}

// Remove city from history
function removeFromHistory(city, event) {
    event.stopPropagation();
    searchHistory = searchHistory.filter(c => c !== city);
    updateHistoryDropdown();
}

// Show/hide history dropdown
function toggleHistoryDropdown() {
    if (historyDropdown.classList.contains('opacity-0')) {
        showHistoryDropdown();
    } else {
        hideHistoryDropdown();
    }
}
function showHistoryDropdown() {
    historyDropdown.classList.remove('opacity-0', 'invisible');
    historyDropdown.classList.add('opacity-100', 'visible');
}
function hideHistoryDropdown() {
    historyDropdown.classList.add('opacity-0', 'invisible');
    historyDropdown.classList.remove('opacity-100', 'visible');
}
document.addEventListener('click', (e) => {
    if (!historyDropdown.contains(e.target) && e.target !== historyBtn) {
        hideHistoryDropdown();
    }
});

// Toggle temperature unit
function toggleTemperatureUnit() {
    isCelsius = !isCelsius;
    if (currentWeatherData) updateTemperature(currentWeatherData.current);
}

// UI Helper Functions
function showLoading() { loading.classList.remove('hidden'); }
function hideLoading() { loading.classList.add('hidden'); }
function showError(message) {
    errorMessage.textContent = message;
    error.classList.remove('hidden');
}
function hideError() { error.classList.add('hidden'); }

// To hide error message
const closeErrorBtn = document.getElementById('closeErrorBtn');
closeErrorBtn.addEventListener('click', () => {
    hideError();
});

// Inline onclick handlers
window.selectFromHistory = function (city) {
    getWeather(city);
    hideHistoryDropdown();
};

window.removeFromHistory = function (city, event) {
    event.stopPropagation();
    searchHistory = searchHistory.filter(c => c !== city);
    updateHistoryDropdown();
};

// Optionally, load last searched city on page load
window.addEventListener('DOMContentLoaded', () => {
    if (searchHistory.length > 0) {
        getWeather(searchHistory[0]);
    } else {
        getWeather('Bangalore, India');
        addToSearchHistory('Bangalore, India');
    }
});