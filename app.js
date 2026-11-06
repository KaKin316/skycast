/**
 * Skycast — a tiny weather app with location search.
 * Powered by Open-Meteo (https://open-meteo.com/): free, no API key.
 */

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// Some embedded browsers (such as this app's built-in browser) only allow
// localhost and block external sites. When served from localhost, route
// requests through the local proxy: `node server.js`.
// Desktop browsers — including pages opened as file:// — can reach
// Open-Meteo directly (it answers CORS *), so they skip the proxy and the
// server is not needed.
function usesLocalProxy() {
  return /^https?:$/.test(location.protocol) &&
    ["localhost", "127.0.0.1", "0.0.0.0"].includes(location.hostname);
}
const GEOCODE_ENDPOINT = usesLocalProxy() ? "/proxy/geocoding" : GEOCODE_URL;
const FORECAST_ENDPOINT = usesLocalProxy() ? "/proxy/forecast" : FORECAST_URL;

// WMO weather interpretation codes → { icon, description }
const WEATHER_CODES = {
  0: { icon: "☀️", desc: "Clear sky", skyDay: "sky-clear-day", skyNight: "sky-clear-night" },
  1: { icon: "🌤️", desc: "Mainly clear", skyDay: "sky-partly-day", skyNight: "sky-partly-night" },
  2: { icon: "⛅", desc: "Partly cloudy", skyDay: "sky-partly-day", skyNight: "sky-partly-night" },
  3: { icon: "☁️", desc: "Overcast", skyDay: "sky-cloudy", skyNight: "sky-cloudy" },
  45: { icon: "🌫️", desc: "Fog", skyDay: "sky-fog", skyNight: "sky-fog" },
  48: { icon: "🌫️", desc: "Rime fog", skyDay: "sky-fog", skyNight: "sky-fog" },
  51: { icon: "🌦️", desc: "Light drizzle", skyDay: "sky-rain", skyNight: "sky-rain" },
  53: { icon: "🌦️", desc: "Drizzle", skyDay: "sky-rain", skyNight: "sky-rain" },
  55: { icon: "🌧️", desc: "Heavy drizzle", skyDay: "sky-rain", skyNight: "sky-rain" },
  56: { icon: "🌧️", desc: "Freezing drizzle", skyDay: "sky-rain", skyNight: "sky-rain" },
  57: { icon: "🌧️", desc: "Freezing drizzle", skyDay: "sky-rain", skyNight: "sky-rain" },
  61: { icon: "🌧️", desc: "Light rain", skyDay: "sky-rain", skyNight: "sky-rain" },
  63: { icon: "🌧️", desc: "Rain", skyDay: "sky-rain", skyNight: "sky-rain" },
  65: { icon: "🌧️", desc: "Heavy rain", skyDay: "sky-rain", skyNight: "sky-rain" },
  66: { icon: "🌧️", desc: "Freezing rain", skyDay: "sky-rain", skyNight: "sky-rain" },
  67: { icon: "🌧️", desc: "Freezing rain", skyDay: "sky-rain", skyNight: "sky-rain" },
  71: { icon: "🌨️", desc: "Light snow", skyDay: "sky-snow", skyNight: "sky-snow" },
  73: { icon: "🌨️", desc: "Snow", skyDay: "sky-snow", skyNight: "sky-snow" },
  75: { icon: "❄️", desc: "Heavy snow", skyDay: "sky-snow", skyNight: "sky-snow" },
  77: { icon: "❄️", desc: "Snow grains", skyDay: "sky-snow", skyNight: "sky-snow" },
  80: { icon: "🌦️", desc: "Light showers", skyDay: "sky-rain", skyNight: "sky-rain" },
  81: { icon: "🌧️", desc: "Showers", skyDay: "sky-rain", skyNight: "sky-rain" },
  82: { icon: "⛈️", desc: "Heavy showers", skyDay: "sky-thunder", skyNight: "sky-thunder" },
  85: { icon: "🌨️", desc: "Snow showers", skyDay: "sky-snow", skyNight: "sky-snow" },
  86: { icon: "❄️", desc: "Snow showers", skyDay: "sky-snow", skyNight: "sky-snow" },
  95: { icon: "⛈️", desc: "Thunderstorm", skyDay: "sky-thunder", skyNight: "sky-thunder" },
  96: { icon: "⛈️", desc: "Thunderstorm, hail", skyDay: "sky-thunder", skyNight: "sky-thunder" },
  99: { icon: "⛈️", desc: "Thunderstorm, heavy hail", skyDay: "sky-thunder", skyNight: "sky-thunder" },
};

const SUGGESTED_CITIES = ["Taipei", "Tokyo", "New York", "London", "Sydney", "Paris"];

const state = {
  unit: "c", // "c" | "f"
  lang: detectLang(), // supported code from I18N (see i18n.js)
  location: null, // { name, admin1, country, latitude, longitude, timezone }
  lastData: null, // last forecast payload, kept for re-rendering on language change
};

const $ = (sel) => document.querySelector(sel);

const views = {
  empty: $("#empty-state"),
  loading: $("#loading"),
  error: $("#error-state"),
  weather: $("#weather-view"),
};

function showView(name) {
  for (const [key, el] of Object.entries(views)) {
    el.hidden = key !== name;
  }
}

// ---------- i18n ----------

function loadPref(key) {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  } catch (e) {
    return null;
  }
}

function savePref(key, value) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  } catch (e) {
    /* storage unavailable (e.g. private mode) — ignore */
  }
}

function detectLang() {
  const saved = loadPref("skycast-lang");
  if (saved && I18N[saved]) return saved;
  const tags = navigator.languages || (navigator.language ? [navigator.language] : []);
  for (const tag of tags) {
    const tl = String(tag).toLowerCase();
    for (const code of Object.keys(I18N)) {
      const cl = code.toLowerCase();
      if (tl === cl || tl.startsWith(cl + "-") || cl.startsWith(tl + "-")) return code;
    }
  }
  return "en";
}

function t(key) {
  const dict = I18N[state.lang] || I18N.en;
  return dict.t[key] != null ? dict.t[key] : I18N.en.t[key];
}

function fmt(template, vars = {}) {
  return String(template).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

function wmoDesc(code) {
  const dict = I18N[state.lang] || I18N.en;
  if (dict.wmo[code] != null) return dict.wmo[code];
  return I18N.en.wmo[code] != null ? I18N.en.wmo[code] : "Unknown";
}

const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function weekdayName(date, index) {
  if (index === 0) return t("today");
  try {
    if (typeof Intl !== "undefined") {
      return new Intl.DateTimeFormat((I18N[state.lang] || I18N.en).locale, { weekday: "short" }).format(date);
    }
  } catch (e) {
    /* fall through to English names */
  }
  return DAY_NAMES_EN[date.getDay()];
}

function applyStaticStrings() {
  document.documentElement.lang = (I18N[state.lang] || I18N.en).locale;
  $("#brand-sub").textContent = t("brandSub");
  input.placeholder = t("searchPlaceholder");
  $("#search-btn").textContent = t("search");
  $("#locate-btn").title = t("locateTitle");
  $("#loading-text").textContent = t("loading");
  $("#empty-title").textContent = t("emptyTitle");
  $("#empty-body").textContent = t("emptyBody");
  $("#error-title").textContent = t("errorTitle");
  $("#lbl-feels").textContent = t("feelsLike");
  $("#lbl-humidity").textContent = t("humidity");
  $("#lbl-wind").textContent = t("wind");
  $("#lbl-pressure").textContent = t("pressure");
  $("#forecast-title").textContent = t("forecast");
  $("#footer").innerHTML = t("footer");
  $("#proxy-banner").innerHTML = t("proxyBanner");
}

function buildLangSelect() {
  const sel = $("#lang-select");
  sel.innerHTML = "";
  Object.keys(I18N).forEach((code) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = I18N[code].name;
    sel.appendChild(opt);
  });
  sel.value = state.lang;
  sel.addEventListener("change", () => setLang(sel.value));
}

function setLang(code) {
  if (!I18N[code]) return;
  state.lang = code;
  savePref("skycast-lang", code);
  applyI18n();
}

function applyI18n() {
  applyStaticStrings();
  const sel = $("#lang-select");
  if (sel && sel.value !== state.lang) sel.value = state.lang;
  if (state.lastData && state.location) {
    renderWeather(state.location, state.lastData);
  }
}

function weatherInfo(code, isDay = true) {
  const info = WEATHER_CODES[code];
  if (!info) {
    return { icon: "🌡️", desc: "Unknown", skyDay: "sky-cloudy", skyNight: "sky-cloudy" };
  }
  return {
    icon: isDay ? info.icon : (code === 0 ? "🌙" : code === 1 ? "🌙" : info.icon),
    desc: wmoDesc(code),
    skyDay: info.skyDay,
    skyNight: info.skyNight,
  };
}

function setSky(code, isDay = true) {
  const info = WEATHER_CODES[code];
  const cls = info ? (isDay ? info.skyDay : info.skyNight) : "sky-cloudy";
  document.body.className = cls;
}

// Values come back already in the requested unit, so we only label — no client-side conversion.
function fmtTemp(value, unit = "°C") {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value)}°${unit.replace("°", "")}`;
}

function fmtWind(value, unit = "km/h") {
  if (value == null || Number.isNaN(value)) return "—";
  // Open-Meteo labels mph as "mp/h" in current_units; normalize the display.
  if (unit === "mp/h") unit = "mph";
  return `${Math.round(value)} ${unit}`;
}

// ---------- Search / geocoding ----------

async function searchLocations(query) {
  const url = `${GEOCODE_ENDPOINT}?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = await res.json();
  return data.results || [];
}

async function loadWeather(location) {
  state.location = location;
  showView("loading");

  const params = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day,pressure_msl,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "8",
  });
  if (state.unit === "f") {
    params.set("temperature_unit", "fahrenheit");
    params.set("wind_speed_unit", "mph");
  }

  const res = await fetch(`${FORECAST_ENDPOINT}?${params}`);
  if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);
  const data = await res.json();
  if (data.error) {
    throw new Error(`Weather service error: ${data.reason || "unknown error"}`);
  }
  renderWeather(location, data);
}

// ---------- Rendering ----------

function renderWeather(location, data) {
  state.lastData = data;
  const c = data.current || {};
  const isDay = !!c.is_day;

  $("#place-name").textContent = location.name;
  $("#place-admin").textContent = [location.admin1, location.country].filter(Boolean).join(", ");
  const zone = data.timezone || "";
  $("#observed-at").textContent = c.time
    ? fmt(t("observedAt"), { time: c.time, zone: zone }).replace(/[·]\s*$/, "").trim()
    : "";

  const info = weatherInfo(c.weather_code, isDay);
  setSky(c.weather_code, isDay);

  const u = data.current_units || {};
  const tempUnit = u.temperature_2m || "°C";
  const windUnit = u.wind_speed_10m || "km/h";

  $("#current-icon").textContent = info.icon;
  $("#current-temp").textContent = fmtTemp(c.temperature_2m, tempUnit);
  $("#current-desc").textContent = info.desc;
  $("#detail-feels").textContent = fmtTemp(c.apparent_temperature, tempUnit);
  $("#detail-humidity").textContent = c.relative_humidity_2m != null ? `${c.relative_humidity_2m}%` : "—";
  $("#detail-wind").textContent = fmtWind(c.wind_speed_10m, windUnit);
  $("#detail-pressure").textContent = c.pressure_msl != null ? `${Math.round(c.pressure_msl)} hPa` : "—";

  renderForecast(data.daily, u);

  const label = [location.name, location.admin1, location.country].filter(Boolean).join(", ");
  document.title = fmt(t("title"), { temp: fmtTemp(c.temperature_2m, tempUnit), icon: info.icon, place: label });
  showView("weather");
}

function renderForecast(daily, u = {}) {
  const list = $("#forecast-list");
  list.innerHTML = "";
  if (!daily || !daily.time) return;
  const tempUnit = u.temperature_2m || "°C";

  daily.time.slice(0, 7).forEach((dateStr, i) => {
    const d = new Date(`${dateStr}T12:00:00`);
    const dayLabel = weekdayName(d, i);

    const code = daily.weather_code[i];
    const desc = wmoDesc(code).replace(/"/g, "&quot;");
    const info = WEATHER_CODES[code] || { icon: "🌡️" };
    const maxT = daily.temperature_2m_max[i];
    const minT = daily.temperature_2m_min[i];
    const rain = daily.precipitation_probability_max?.[i];

    const li = document.createElement("li");
    li.className = "forecast-item";
    li.innerHTML = `
      <div class="f-day">${dayLabel}</div>
      <div class="f-icon" title="${desc}">${info.icon}</div>
      <div class="f-desc">${desc}</div>
      <div class="f-temps">${fmtTemp(maxT, tempUnit)} <span class="f-low">${fmtTemp(minT, tempUnit)}</span></div>
      ${rain != null ? `<div class="f-rain">💧 ${rain}%</div>` : ""}
    `;
    list.appendChild(li);
  });
}

// ---------- Suggestion dropdown ----------

const input = $("#location-input");
const suggestionsEl = $("#suggestions");
let suggestionList = [];
let highlightedIndex = -1;

function renderSuggestions(results) {
  suggestionList = results;
  highlightedIndex = -1;
  if (!results.length) {
    suggestionsEl.innerHTML = `<div class="suggestion"><span class="s-admin">${t("noResults")}</span></div>`;
    suggestionsEl.hidden = false;
    return;
  }
  suggestionsEl.innerHTML = results
    .map(
      (r, i) => `
      <div class="suggestion" data-index="${i}">
        <span><span class="s-name">${escapeHtml(r.name)}</span><br/>
        <span class="s-admin">${escapeHtml([r.admin1, r.country].filter(Boolean).join(", "))}</span></span>
        <span class="s-admin">${r.latitude.toFixed(2)}°, ${r.longitude.toFixed(2)}°</span>
      </div>`
    )
    .join("");
  suggestionsEl.hidden = false;
}

function hideSuggestions() {
  suggestionsEl.hidden = true;
  suggestionList = [];
  highlightedIndex = -1;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

let searchDebounce = null;
input.addEventListener("input", () => {
  const q = input.value.trim();
  clearTimeout(searchDebounce);
  if (q.length < 2) {
    hideSuggestions();
    return;
  }
  searchDebounce = setTimeout(async () => {
    try {
      renderSuggestions(await searchLocations(q));
    } catch {
      hideSuggestions();
    }
  }, 250);
});

suggestionsEl.addEventListener("mousedown", (e) => {
  const item = e.target.closest(".suggestion[data-index]");
  if (!item) return;
  const loc = suggestionList[Number(item.dataset.index)];
  if (loc) {
    input.value = loc.name;
    hideSuggestions();
    loadWeather(geocodeToLocation(loc));
  }
});

input.addEventListener("keydown", (e) => {
  if (suggestionsEl.hidden) return;
  const items = [...suggestionsEl.querySelectorAll(".suggestion[data-index]")];
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    highlightedIndex =
      e.key === "ArrowDown"
        ? Math.min(highlightedIndex + 1, items.length - 1)
        : Math.max(highlightedIndex - 1, 0);
    items.forEach((el, i) => el.classList.toggle("highlighted", i === highlightedIndex));
  } else if (e.key === "Enter") {
    if (highlightedIndex >= 0 && suggestionList[highlightedIndex]) {
      const loc = suggestionList[highlightedIndex];
      input.value = loc.name;
      hideSuggestions();
      loadWeather(geocodeToLocation(loc));
    }
  } else if (e.key === "Escape") {
    hideSuggestions();
  }
});

document.addEventListener("click", (e) => {
  if (!$("#search-box").contains(e.target) && !suggestionsEl.contains(e.target)) {
    hideSuggestions();
  }
});

function geocodeToLocation(r) {
  return {
    name: r.name,
    admin1: r.admin1 || "",
    country: r.country || "",
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
  };
}

// ---------- Search button ----------

$("#search-btn").addEventListener("click", async () => {
  const q = input.value.trim();
  if (!q) return;
  try {
    const results = await searchLocations(q);
    if (!results.length) {
      showError(fmt(t("geocodeNoMatch"), { q: q }));
      return;
    }
    input.value = results[0].name;
    hideSuggestions();
    await loadWeather(geocodeToLocation(results[0]));
  } catch (err) {
    showError(err.message);
  }
});

// ---------- Geolocate ----------

$("#locate-btn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError(t("geoUnsupported"));
    return;
  }
  if (geoUnavailable) {
    // Geolocation was already unavailable/denied — steer the user to search.
    showView("empty");
    return;
  }
  showView("loading");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      input.value = "My location";
      try {
        await loadWeather({
          name: "My location",
          admin1: "",
          country: "",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch (err) {
        geoUnavailable = true;
        showError(err.message);
      }
    },
    () => {
      // Embedded browsers often cannot resolve geolocation. Fall back to the
      // searchable empty state instead of a dead-end error.
      geoUnavailable = true;
      showView("empty");
    },
    { timeout: 10000 }
  );
});

// ---------- Unit toggle ----------

document.querySelectorAll(".unit-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.unit = btn.dataset.unit;
    document.querySelectorAll(".unit-btn").forEach((b) =>
      b.classList.toggle("active", b === btn)
    );
    if (state.location) {
      // Re-fetch so units come back directly from the API.
      loadWeather(state.location);
    }
  });
});

// ---------- Misc ----------

let geoUnavailable = false;

function showError(message) {
  $("#error-message").textContent = message;
  showView("error");
}

// Suggested city chips
const chipRow = $("#suggested-cities");
SUGGESTED_CITIES.forEach((name) => {
  const chip = document.createElement("span");
  chip.className = "chip";
  chip.textContent = name;
  chip.addEventListener("click", async () => {
    try {
      const results = await searchLocations(name);
      if (results.length) {
        input.value = name;
        await loadWeather(geocodeToLocation(results[0]));
      }
    } catch (err) {
      showError(err.message);
    }
  });
  chipRow.appendChild(chip);
});

// ---------- Local proxy status ----------
// If the local proxy (node server.js) is not reachable, external weather
// data can't be fetched in this browser — say so clearly.
const proxyBanner = $("#proxy-banner");
let proxyCheckTimer = null;
function checkProxy() {
  fetch("/status", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
    .then((j) => {
      if (j && j.ok) {
        proxyBanner.hidden = true;
        if (proxyCheckTimer) clearInterval(proxyCheckTimer);
      } else throw new Error("bad status");
    })
    .catch(() => {
      proxyBanner.hidden = false;
    });
}
if (usesLocalProxy()) {
  checkProxy();
  proxyCheckTimer = setInterval(checkProxy, 8000);
}

// ---------- Language startup ----------
buildLangSelect();
applyI18n();

// On first load, try the user's browser location silently.
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        await loadWeather({
          name: "My location",
          admin1: "",
          country: "",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch {
        /* stay on empty state */
      }
    },
    () => {
      // Silent first-load attempt: if geolocation is unavailable (common in
      // embedded browsers), quietly fall back to the searchable empty state.
      geoUnavailable = true;
      showView("empty");
    },
    { timeout: 5000 }
  );
}
