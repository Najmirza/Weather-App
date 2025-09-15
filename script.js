
const API_KEY ="1f9653ccfcb3fc5993f6a76bafb197e5";

// DOM Elements
const searchInput = document.getElementById("search-input");
const suggestionsBox = document.getElementById("suggestions");
const locationNameEl = document.getElementById("location-name");
const mapTitleEl = document.getElementById("map-title");
const tempEl = document.getElementById("temp");
const conditionEl = document.getElementById("condition");
const weatherIconEl = document.getElementById("weather-icon");
const feelsLikeEl = document.getElementById("feels-like");
const highTempEl = document.getElementById("high-temp");
const lowTempEl = document.getElementById("low-temp");
const tempChangeEl = document.getElementById("temp-change");
const qpfEl = document.getElementById("qpf");
const thunderProbEl = document.getElementById("thunder-prob");
const rainProbEl = document.getElementById("rain-prob");
const windChillEl = document.getElementById("wind-chill");
const heatIndexEl = document.getElementById("heat-index");
const visibilityEl = document.getElementById("visibility");
const cloudEl = document.getElementById("cloud");
const windSpeedEl = document.getElementById("wind-speed");
const humidityEl = document.getElementById("humidity");
const uvEl = document.getElementById("uv");
const pressureEl = document.getElementById("pressure");

let map, marker;

/* ---------- FETCH FUNCTIONS ---------- */
async function fetchSuggestions(query) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Suggestions fetch failed");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function fetchWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather fetch failed");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

// 


/* ---------- UI UPDATE FUNCTIONS ---------- */
function updateWeatherUI(weather) {
  if (!weather || weather.cod !== 200) {
    locationNameEl.textContent = "Location Not Found";
    mapTitleEl.textContent = "Map";
    return;
  }
  const fullLocation = `${weather.name}, ${weather.sys.country}`;
  locationNameEl.textContent = fullLocation;
  mapTitleEl.textContent = fullLocation;

  const newLoc = { lat: weather.coord.lat, lng: weather.coord.lon };
  if (map && marker) {
    map.setCenter(newLoc);
    marker.setPosition(newLoc);
    marker.setTitle(fullLocation);
  }

  tempEl.textContent = `${Math.round(weather.main.temp)}°C`;
  conditionEl.textContent = weather.weather[0].description;
  weatherIconEl.src = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;

  feelsLikeEl.textContent = `${Math.round(weather.main.feels_like)}°`;
  highTempEl.textContent = `${Math.round(weather.main.temp_max)}°`;
  lowTempEl.textContent = `${Math.round(weather.main.temp_min)}°`;
  humidityEl.textContent = `${weather.main.humidity}%`;
  visibilityEl.textContent = `${(weather.visibility / 1000).toFixed(1)} km`;
  pressureEl.textContent = `${weather.main.pressure} hPa`;
  cloudEl.textContent = `${weather.clouds.all}%`;
  windSpeedEl.textContent = `${Math.round(weather.wind.speed * 3.6)} km/h`;
  windChillEl.textContent = `${Math.round(weather.main.temp)}°`;
  heatIndexEl.textContent = `${Math.round(weather.main.temp)}°`;
  uvEl.textContent = "--";
}

function updateQPF(forecast) {
  if (!forecast?.hourly) {
    qpfEl.textContent = "--mm";
    return;
  }
  const totalRain = forecast.hourly
    .slice(0, 24)
    .reduce((sum, h) => sum + (h.rain ? h.rain["1h"] || 0 : 0), 0);
  qpfEl.textContent = `${totalRain.toFixed(1)} mm`;
}

function updateProbabilities(forecast) {
  if (!forecast?.hourly?.length) {
    rainProbEl.textContent = "--%";
    thunderProbEl.textContent = "--%";
    return;
  }
  const next24 = forecast.hourly.slice(0, 24);

  // Average rain probability
  const rainValues = next24.map(h => h.pop ?? 0);
  const avgRain = (rainValues.reduce((a, b) => a + b, 0) / rainValues.length) * 100;

  // Thunderstorm probability
  const thunderValues = next24.map(h =>
    h.weather.some(w => w.main.toLowerCase().includes("thunderstorm")) ? h.pop ?? 0 : 0
  );
  const avgThunder = thunderValues.length
    ? (thunderValues.reduce((a, b) => a + b, 0) / thunderValues.length) * 100
    : 0;

  rainProbEl.textContent = `${avgRain.toFixed(0)}%`;
  thunderProbEl.textContent = `${avgThunder.toFixed(0)}%`;
}

function updateTempChange(forecast) {
  if (!forecast?.hourly || forecast.hourly.length < 24) {
    tempChangeEl.textContent = "--°";
    return;
  }
  const now = forecast.hourly[0].temp;
  const next24 = forecast.hourly[23].temp;
  const change = next24 - now;
  tempChangeEl.textContent = `${change > 0 ? "+" : ""}${change.toFixed(1)}°`;
}

/* ---------- LOCATION HANDLER ---------- */
async function handleLocation(lat, lon) {
  // First: current weather
  const weather = await fetchWeather(lat, lon);
  if (weather) updateWeatherUI(weather);

  // Second: forecast for probabilities and QPF
  const forecast = await fetchForecast(lat, lon); // Uses /onecall
  if (forecast) {
    updateQPF(forecast);
    updateProbabilities(forecast);
    updateTempChange(forecast);
  } else {
    qpfEl.textContent = "--mm";
    rainProbEl.textContent = "--%";
    thunderProbEl.textContent = "--%";
  }
}


/* ---------- GOOGLE MAP INITIALIZATION ---------- */
window.initMap = function () {
  const fallback = { lat: 28.6139, lng: 77.2090 }; // fallback Delhi
  map = new google.maps.Map(document.getElementById("map"), {
    center: fallback,
    zoom: 10,
    disableDefaultUI: true,
  });
  marker = new google.maps.Marker({ position: fallback, map, title: "Delhi, India" });

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      pos => handleLocation(pos.coords.latitude, pos.coords.longitude),
      () => handleLocation(fallback.lat, fallback.lng),
      { timeout: 8000 }
    );
  } else {
    handleLocation(fallback.lat, fallback.lng);
  }
};

/* ---------- SEARCH INPUT & SUGGESTIONS ---------- */
searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim();
  if (query.length < 2) {
    suggestionsBox.classList.add("hidden");
    return;
  }
  const cities = await fetchSuggestions(query);
  suggestionsBox.innerHTML = "";
  if (cities.length) {
    cities.forEach(city => {
      const li = document.createElement("li");
      li.textContent = `${city.name}, ${city.country}`;
      li.className = "px-4 py-2 hover:bg-blue-100 cursor-pointer";
      li.addEventListener("click", async () => {
        searchInput.value = li.textContent;
        suggestionsBox.classList.add("hidden");
        await handleLocation(city.lat, city.lon);
      });
      suggestionsBox.appendChild(li);
    });
    suggestionsBox.classList.remove("hidden");
  } else {
    suggestionsBox.classList.add("hidden");
  }
});

document.addEventListener("click", e => {
  if (!suggestionsBox.contains(e.target) && e.target !== searchInput) {
    suggestionsBox.classList.add("hidden");
  }
});
