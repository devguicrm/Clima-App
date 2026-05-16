const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const locationBtn = document.getElementById('locationBtn');
const themeToggle = document.getElementById('themeToggle');
const statusCard = document.getElementById('statusCard');
const weatherHero = document.getElementById('weatherHero');
const contentGrid = document.getElementById('contentGrid');

const cityName = document.getElementById('cityName');
const countryBadge = document.getElementById('countryBadge');
const dateText = document.getElementById('dateText');
const weatherIcon = document.getElementById('weatherIcon');
const currentTemp = document.getElementById('currentTemp');
const weatherDescription = document.getElementById('weatherDescription');
const feelsText = document.getElementById('feelsText');
const humidityValue = document.getElementById('humidityValue');
const windValue = document.getElementById('windValue');
const rainValue = document.getElementById('rainValue');
const uvValue = document.getElementById('uvValue');
const forecastList = document.getElementById('forecastList');
const hourlyList = document.getElementById('hourlyList');

const weatherMap = {
  0: { label: 'Céu limpo', icon: '☀️' },
  1: { label: 'Predominantemente limpo', icon: '🌤️' },
  2: { label: 'Parcialmente nublado', icon: '⛅' },
  3: { label: 'Nublado', icon: '☁️' },
  45: { label: 'Neblina', icon: '🌫️' },
  48: { label: 'Neblina com geada', icon: '🌫️' },
  51: { label: 'Garoa fraca', icon: '🌦️' },
  53: { label: 'Garoa moderada', icon: '🌦️' },
  55: { label: 'Garoa intensa', icon: '🌧️' },
  61: { label: 'Chuva fraca', icon: '🌧️' },
  63: { label: 'Chuva moderada', icon: '🌧️' },
  65: { label: 'Chuva forte', icon: '⛈️' },
  80: { label: 'Pancadas de chuva', icon: '🌦️' },
  81: { label: 'Pancadas moderadas', icon: '🌧️' },
  82: { label: 'Pancadas fortes', icon: '⛈️' },
  95: { label: 'Tempestade', icon: '⛈️' },
  96: { label: 'Tempestade com granizo', icon: '⛈️' },
  99: { label: 'Tempestade intensa', icon: '⛈️' }
};

const savedTheme = localStorage.getItem('climanow-theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark');
  themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
}

function setStatus(message, isError = false) {
  statusCard.classList.remove('hidden');
  statusCard.classList.toggle('error', isError);
  statusCard.innerHTML = isError
    ? `<i class="fa-solid fa-triangle-exclamation"></i><span>${message}</span>`
    : `<i class="fa-solid fa-spinner fa-spin"></i><span>${message}</span>`;
}

function showWeather() {
  statusCard.classList.add('hidden');
  weatherHero.classList.remove('hidden');
  contentGrid.classList.remove('hidden');
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
}

function formatToday() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function getWeatherInfo(code) {
  return weatherMap[code] || { label: 'Condição variável', icon: '🌡️' };
}

async function getCoordinatesByCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Erro ao buscar cidade.');
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('Cidade não encontrada. Tente outro nome.');
  }

  const result = data.results[0];

  return {
    name: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone
  };
}

async function getWeather(location) {
  const params = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: 'auto',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum'
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Erro ao buscar previsão do tempo.');
  }

  return response.json();
}

function renderCurrent(location, data) {
  const current = data.current;
  const info = getWeatherInfo(current.weather_code);

  cityName.textContent = location.name;
  countryBadge.textContent = location.country || 'Localização';
  dateText.textContent = formatToday();
  weatherIcon.textContent = info.icon;
  currentTemp.textContent = `${Math.round(current.temperature_2m)}°`;
  weatherDescription.textContent = info.label;
  feelsText.textContent = `Sensação térmica ${Math.round(current.apparent_temperature)}°C`;
  humidityValue.textContent = `${current.relative_humidity_2m}%`;
  windValue.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  rainValue.textContent = `${current.precipitation ?? 0} mm`;
  uvValue.textContent = Math.round(data.daily.uv_index_max[0]);
}

function renderForecast(data) {
  forecastList.innerHTML = data.daily.time.map((day, index) => {
    const info = getWeatherInfo(data.daily.weather_code[index]);
    const max = Math.round(data.daily.temperature_2m_max[index]);
    const min = Math.round(data.daily.temperature_2m_min[index]);

    return `
      <div class="forecast-day">
        <div>
          <span class="day-icon">${info.icon}</span>
          <div>
            <strong>${index === 0 ? 'Hoje' : formatDate(day)}</strong>
            <span>${info.label}</span>
          </div>
        </div>
        <span class="max">${max}°</span>
        <span class="min">${min}°</span>
      </div>
    `;
  }).join('');
}

function renderHourly(data) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const todayHours = data.hourly.time
    .map((time, index) => ({
      time,
      temp: data.hourly.temperature_2m[index],
      code: data.hourly.weather_code[index]
    }))
    .filter(item => item.time.startsWith(today))
    .filter((_, index) => index % 3 === 0)
    .slice(0, 8);

  hourlyList.innerHTML = todayHours.map(item => {
    const hour = item.time.split('T')[1].slice(0, 5);
    const info = getWeatherInfo(item.code);

    return `
      <div class="hour-card">
        <span>${hour}</span>
        <div class="hour-icon">${info.icon}</div>
        <strong>${Math.round(item.temp)}°</strong>
      </div>
    `;
  }).join('');
}

async function loadCity(city) {
  try {
    setStatus(`Buscando clima para ${city}...`);
    const location = await getCoordinatesByCity(city);
    const data = await getWeather(location);

    renderCurrent(location, data);
    renderForecast(data);
    renderHourly(data);
    showWeather();
  } catch (error) {
    setStatus(error.message || 'Não foi possível carregar a previsão.', true);
  }
}

async function loadByCoordinates(latitude, longitude) {
  try {
    setStatus('Buscando clima pela sua localização...');

    const location = {
      name: 'Minha localização',
      country: 'Atual',
      latitude,
      longitude
    };

    const data = await getWeather(location);
    renderCurrent(location, data);
    renderForecast(data);
    renderHourly(data);
    showWeather();
  } catch (error) {
    setStatus(error.message || 'Não foi possível usar sua localização.', true);
  }
}

searchForm.addEventListener('submit', event => {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (city) {
    loadCity(city);
  }
});

locationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('Seu navegador não suporta geolocalização.', true);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      loadByCoordinates(position.coords.latitude, position.coords.longitude);
    },
    () => {
      setStatus('Permissão de localização negada. Pesquise por cidade.', true);
    }
  );
});

document.querySelectorAll('[data-city]').forEach(button => {
  button.addEventListener('click', () => {
    cityInput.value = button.dataset.city;
    loadCity(button.dataset.city);
  });
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  themeToggle.innerHTML = isDark
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
  localStorage.setItem('climanow-theme', isDark ? 'dark' : 'light');
});

loadCity('Paranaguá');
