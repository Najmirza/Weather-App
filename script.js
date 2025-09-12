const API_KEY = "1f9653ccfcb3fc5993f6a76bafb197e5";
const searchInput = document.getElementById("search-input");
const suggestionsBox = document.getElementById("suggestions");
const locationNameEl = document.getElementById("location-name");
const mapTitleEl = document.getElementById("map-title");
const bgVideo = document.getElementById("bg-video");

let map, marker;

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

// ✅ Google Maps callback
window.initMap = async function () {
  const delhi = { lat: 28.6139, lng: 77.2090 };

  map = new google.maps.Map(document.getElementById("map"), {
    center: delhi,
    zoom: 10,
    disableDefaultUI: true,
  });

  marker = new google.maps.Marker({
    position: delhi,
    map: map,
    title: "Delhi, India",
  });

  mapTitleEl.textContent = "Delhi, India";

  // ✅ Fetch and display Delhi weather on page load
  const weather = await fetchWeather(delhi.lat, delhi.lng);
  if (weather) updateWeatherUI(weather);
};

// ✅ Weather fetch functions
async function fetchSuggestions(query) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch suggestions");
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
    if (!res.ok) throw new Error("Failed to fetch weather");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

// ✅ Update UI & Background video
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
  map.setCenter(newLoc);
  marker.setPosition(newLoc);
  marker.setTitle(fullLocation);

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

  // Change background video based on weather
  const condition = weather.weather[0].main.toLowerCase();
  let videoSrc = "videos/clear.mp4";
  if (condition.includes("cloud")) videoSrc = "videos/cloudy.mp4";
  else if (condition.includes("rain")) videoSrc = "videos/rain.mp4";
  else if (condition.includes("thunder")) videoSrc = "videos/thunderstorm.mp4";
  else if (condition.includes("snow")) videoSrc = "videos/snow.mp4";
  else if (condition.includes("mist") || condition.includes("fog")) videoSrc = "videos/fog.mp4";

  // const source = bgVideo.querySelector("source");
  // if (!source.src.includes(videoSrc)) {
  //   source.src = videoSrc;
  //   bgVideo.load();
  //   bgVideo.play().catch(err => console.error("Video play error:", err));
  // }
}

// ✅ Search suggestion handling
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
        const weather = await fetchWeather(city.lat, city.lon);
        updateWeatherUI(weather);
      });
      suggestionsBox.appendChild(li);
    });
    suggestionsBox.classList.remove("hidden");
  } else {
    suggestionsBox.classList.add("hidden");
  }
});

document.addEventListener("click", (e) => {
  if (!suggestionsBox.contains(e.target) && e.target !== searchInput) {
    suggestionsBox.classList.add("hidden");
  }
});
