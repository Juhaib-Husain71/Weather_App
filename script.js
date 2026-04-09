const $ = sel => document.querySelector(sel);   //Helpers
const $$ = sel => Array.from(document.querySelectorAll(sel));   //and convert returned node list to array

function formatDate(isoString) {
  const d = new Date(isoString);
  const opts = { weekday: 'short', month: 'long', day: 'numeric' };
  return d.toLocaleDateString(undefined, opts);
}

function weatherCodeToText(code) {
  const map = {             //small mapping for common WMO weather codes.
    0: 'Clear',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    80: 'Rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return map[code] || 'Unknown';
}

// ----- DOM elements ------
const input = $('.search input');
const searchBtn = $('.search .search-icon');

const cityEl = $('.city');
const dateEl = $('.date p');
const tempNumEl = $('.num-msg1');
const tempDescEl = $('.num-msg2');

const slideEls = $$('.hero-sec2 .slide'); // [ rainfall, wind, humidity ]
const footerBoxes = $$('.footer-slide .box');

// ------ Geocoding + Weather fetch -------
async function geocodeCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.results || json.results.length === 0) throw new Error('Location not found');
  return json.results[0]; // has name, latitude, longitude, country
}

async function fetchWeather(lat, lon) {
  // we request:
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
              `&current_weather=true` +
              `&hourly=temperature_2m,relativehumidity_2m,precipitation,weather_code` +
              `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max,daylight_duration` +
              `&past_days=1&timezone=auto` +
              `&temperature_unit=celsius&windspeed_unit=kmh`;
  const res = await fetch(url);
  
  return await res.json();
}

// ----- UI update ----
function updateMainUI(location, weather) {
  // location: geocoding result
  // weather: open-meteo response
  const { name, country } = location;
  const cw = weather.current_weather;
  const timezone = weather.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  // City & Country
  cityEl.innerHTML = `<p>${country || ''},</p><p>${name}</p>`;

  // Date (use current_weather.time)
  dateEl.textContent = formatDate(cw.time);

  // Temperature & Description
  tempNumEl.textContent = Math.round(cw.temperature);
  const wText = weatherCodeToText(cw.weathercode);
  tempDescEl.textContent = wText;

  // Image accourding to weather
  loadWeatherImage(cw.weathercode);

  // console.log(weather.hourly.us_aqi);

  // Humidity: find index in hourly.time
  const times = weather.hourly.time;
  const idx = times.indexOf(cw.time);
  let humidity = null;
  let precipitationHour = null;
  if (idx !== -1) {
    humidity = weather.hourly.relativehumidity_2m[idx];
    precipitationHour = weather.hourly.precipitation[idx];
  } else {
    // fallback: use first hourly value
    humidity = weather.hourly.relativehumidity_2m[0];
    precipitationHour = weather.hourly.precipitation[0];
  }

  // Rainfall: daily precipitation_sum for today (daily arrays align with daily.time)
  let rainfallToday = 0;
  if (weather.daily && weather.daily.precipitation_sum && weather.daily.precipitation_sum.length) {
    // daily.time includes dates, find today's index
    const todayISO = cw.time.split('T')[0];
    const dailyIndex = weather.daily.time.findIndex(t => t === todayISO);
    if (dailyIndex !== -1) rainfallToday = weather.daily.precipitation_sum[dailyIndex];
    else rainfallToday = weather.daily.precipitation_sum[0];
  }

  // Wind speed from current weather (units: km/h because we requested)
  const windSpeed = cw.windspeed;

  // Update the three slides: RainFall, Wind, Humidity
  // Assumes the order of slideEls is rainfall, wind, humidity (as in your HTML)
  if (slideEls[0]) slideEls[0].querySelector('.s-msg2').textContent = `${rainfallToday ?? 0} mm`;
  if (slideEls[1]) slideEls[1].querySelector('.s-msg2').textContent = `${Math.round(windSpeed)} km/h`;
  if (slideEls[2]) slideEls[2].querySelector('.s-msg2').textContent = `${humidity ?? 'N/A'}%`;

  // Footer boxes: fill first 7 boxes with next 7 daily max temps and short label
  localStorage.setItem("weatherData", JSON.stringify(weather));


// print hourly hours weather
// console.log(weather.hourly.weather_code);
let temps = weather.hourly.temperature_2m;
let codeHW = weather.hourly.weather_code;
//console.log(codeHW);

let now = new Date();   // current time

// find index of current hour
let currentIndex = times.findIndex(t => {
  let apiTime = new Date(t);
  return apiTime.getHours() === now.getHours() &&
         apiTime.getDate() === now.getDate();
});

// get current + next 10 hours
let nextHours = times.slice(currentIndex, currentIndex + 11);
let nextTemps = temps.slice(currentIndex, currentIndex + 11);

// footer-slide box elements
let boxP1 = document.querySelectorAll(".fs-p1");
let boxP2 = document.querySelectorAll(".fs-p2");
let boxImgs = document.querySelectorAll(".fs-img");

nextHours.forEach((t, i) => {
  let date = new Date(t);

  let hour = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  //console.log(hour, nextTemps[i]);
  boxP1[i].textContent = hour;
  boxP2[i].innerHTML = `<p>${nextTemps[i]}<sup>o</sup></p>`;
  checkCode(codeHW[i], boxImgs[i]);
  
});

}


// Search flow
async function doSearch(cityName) {
  try {
    tempNumEl.textContent = '...';      //temprature
    tempDescEl.textContent = 'Loading...';    //weather type

    const loc = await geocodeCity(cityName);
    const weather = await fetchWeather(loc.latitude, loc.longitude);
    updateMainUI(loc, weather);
  } catch (err) {
    console.error(err);
    tempNumEl.textContent = '--';
    tempDescEl.textContent = 'Not found';
    cityEl.innerHTML = `<p>Not found</p><p>${input.value}</p>`;
  }
}

// Event listeners for search-button and input (starting point).
searchBtn.addEventListener('click', () => {
  const q = input.value.trim();
  if (!q) return;
  doSearch(q);
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const q = input.value.trim();
    if (!q) return;
    doSearch(q);
  }
});


//on load, show weather for default city.
window.addEventListener('load', () => {
  const defaultCity = input.value.trim() || 'Shahjahanpur';
  input.value = defaultCity;
  doSearch(defaultCity);
});


// Load weather image and body background color(gradient) accourding to weather.
function loadWeatherImage(code){
  let WIcon = document.querySelector("#weatherIcon");
  let BodyCol = document.querySelector("body");

    if (code === 0) {
      WIcon.src = "images/sun.png";
      BodyCol.style.background = "linear-gradient(to right, #fff6d5, #ffe9a7)";

    }else if (code === 1 || code === 2) {
      WIcon.src = "images/partly-cloud.png";
      BodyCol.style.background = "linear-gradient(to right, #dbeafe, #f0f9ff)";

    }else if (code === 3) {
      WIcon.src = "images/clouds.png";
      BodyCol.style.background = "linear-gradient(to right, #e3edf7, #f5f7fa)";

    }else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      WIcon.src = "images/rainy.png";
      BodyCol.style.background = "linear-gradient(to right, #e0e7ff, #f3f4ff)";

    }else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
      WIcon.src = "images/snowy.png";
      BodyCol.style.background = "linear-gradient(to right, #f1f5f9, #e0f2fe)";

    }else if (code >= 95) {
      WIcon.src = "images/thunder.png";
      BodyCol.style.background = "linear-gradient(to right, #eef1f5, #dbe4ee)";

    }
}

function checkCode(code, sImg){
  if (code === 0) {
    sImg.src = "images/sun.png";

  }else if (code === 1 || code === 2) {
    sImg.src = "images/partly-cloud.png";

  }else if (code === 3) {
    sImg.src = "images/clouds.png";

  }else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    sImg.src = "images/rainy.png";

  }else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    sImg.src = "images/snowy.png";

  }else if (code >= 95) {
    sImg.src = "images/thunder.png";
  }
}
