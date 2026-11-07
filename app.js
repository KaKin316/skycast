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

// UI language -> Open-Meteo geocoding `language` code.
// Verified: all 8 are supported, and results (name, admin1, country) come
// back localized in that language (e.g. Paris -> 巴黎 / パリ / 파리).
const GEOCODE_LANG = {
  en: "en", "zh-TW": "zh-TW", "zh-CN": "zh", ja: "ja", ko: "ko", es: "es", fr: "fr", de: "de",
};

// The geocoding API picks the pool of name variants from `language` and
// matches CJK/Hangul queries by exact name (e.g. the zh-TW pool has 臺北市
// but not 台北; the en pool has "Taipei" but no CJK). Coverage differs per
// city (巴黎 exists in the zh pool but not zh-TW; 東京 in ja is 東京都), so
// when a query returns nothing we retry across pools and spelling variants.
const CJK_RE = /[\u2E80-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/;
const CJK_POOLS = ["zh", "zh-TW", "ja", "ko"];

// Curated aliases for CJK "shadow" names, where the pools make the bare name
// resolve to the wrong (minor) place while the major city is stored under a
// suffixed or re-spelled name. Verified against the API:
//   纽约/紐約  -> only tiny 纽约s exist (Kentucky…); NYC is 紐約市 (zh/zh-TW pools)
//   伦敦       -> the zh pool has only Canada/USA; UK London is 倫敦 (zh-TW pool)
// Tried alongside the query in round 1; an alias hit beats the bare hit.
// Add more here when a new shadow case is found.
const CJK_ALIASES = {
  纽约: ["紐約市"], 紐約: ["紐約市"], // NYC is stored as 紐約市 (bare 纽约 = tiny towns)
  东京: ["東京"], // the zh pool's 东京 are Jiangsu/Zhejiang villages; Tokyo is 東京
  伦敦: ["倫敦"], // the zh pool's 伦敦 are Canada/USA only; UK London is 倫敦
  台北: ["臺北市", "台北市"], // the pools store Taipei with the 市 suffix
  首尔: ["首爾"], // the zh-TW pool spells Seoul 首爾
};

// Common simplified<->traditional pairs that occur in place names (major world
// cities included: 纽约, 旧金山, 伦敦, 洛杉矶, 多伦多, 温哥华, 里约, 圣保罗, 开罗…).
// Used only to build fallback *queries* — display always uses the API's own names.
const S2T = {
  台: "臺", 东: "東", 国: "國", 华: "華", 门: "門", 马: "馬", 龙: "龍", 凤: "鳳",
  汉: "漢", 刘: "劉", 陈: "陳", 杨: "楊", 黄: "黃", 张: "張", 郑: "鄭", 卫: "衛",
  陆: "陸", 苏: "蘇", 辽: "遼", 宁: "寧", 长: "長", 庆: "慶", 岛: "島", 阳: "陽",
  滨: "濱", 尔: "爾", 广: "廣", 湾: "灣", 县: "縣", 区: "區", 镇: "鎮", 乡: "鄉",
  庄: "莊", 园: "園", 庙: "廟", 观: "觀", 宫: "宮", 楼: "樓", 阁: "閣", 场: "場",
  热: "熱", 风: "風", 温: "溫", 岭: "嶺", 屿: "嶼", 峡: "峽", 闽: "閩", 粤: "粵",
  鲁: "魯", 赣: "贛", 琼: "瓊", 陕: "陝", 贵: "貴", 云: "雲", 纽: "紐",
  约: "約", 旧: "舊", 维: "維", 顿: "頓", 图: "圖", 伦: "倫", 奥: "奧",
  兰: "蘭", 罗: "羅", 圣: "聖", 卢: "盧", 关: "關", 开: "開", 连: "連",
  厦: "廈", 无: "無", 济: "濟", 银: "銀", 乌: "烏", 萨: "薩", 亚: "亞",
  矶: "磯", 彻: "徹",
};
const T2S = Object.fromEntries(Object.entries(S2T).map(([k, v]) => [v, k]));

function cjkMap(str, map) {
  let out = "";
  for (const ch of str) out += Object.prototype.hasOwnProperty.call(map, ch) ? map[ch] : ch;
  return out;
}

async function geocodeOnce(language, name) {
  const url = `${GEOCODE_ENDPOINT}?name=${encodeURIComponent(name)}&count=6&language=${language}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = await res.json();
  return data.results || [];
}

async function searchLocations(query) {
  const pool = GEOCODE_LANG[state.lang] || "en";
  const isCJK = CJK_RE.test(query);

  // CJK input can only ever match CJK pools (exact match required); Latin
  // input matches the selected pool plus the (most complete) English pool.
  const pools = isCJK
    ? [...new Set([...(CJK_POOLS.includes(pool) ? [pool] : []), ...CJK_POOLS])]
    : [...new Set([pool, "en"])];

  // Round 1 — the query as typed, against every relevant pool IN PARALLEL
  // (one round-trip, so the common case is never slower than before), plus
  // the curated alias queries for known shadow names.
  const aliasNames = isCJK ? [...new Set([...(CJK_ALIASES[query] || []), query])] : [query];
  const round1 = pools.flatMap((p) => aliasNames.map((q) => [p, q]));
  const results1 = await Promise.all(
    round1.map(([p, q]) => geocodeOnce(p, q).catch(() => []))
  );
  // Among hitting queries: a curated alias wins (it points at the major
  // city), then the most specific (longest) query; ties keep pool order.
  let found = [];
  let bestKey = -1;
  results1.forEach((r, i) => {
    if (!r.length) return;
    const q = round1[i][1];
    const key = (q !== query ? 1000 : 0) + q.length;
    if (key > bestKey) {
      bestKey = key;
      found = r;
    }
  });

  if (!found.length && isCJK) {
    // Round 2 — CJK pools are exact-match with per-city quirks
    // (台北 -> 臺北市, 東京 -> 東京都, 서울 -> 서울특별시, 巴黎 missing
    // from the zh-TW pool but present in zh). Re-spell simplified<->
    // traditional and try administrative suffixes, in parallel, capped.
    const respell = [...new Set([query, cjkMap(query, S2T), cjkMap(query, T2S)])];
    // Hangul vs kanji get different administrative-suffix ladders, most
    // promising first (서울 -> 서울특별시, 台北 -> 臺北市/台北市, 東京 -> 東京都).
    const hangul = /[\uAC00-\uD7AF]/.test(query);
    const SUFFIXES = hangul ? ["특별시", "시", "도", "省"] : ["市", "都", "省", "県", "县"];
    const variants = [...new Set([
      ...respell.filter((v) => v !== query),
      ...respell.flatMap((q) => SUFFIXES.map((s) => q + s)),
    ])];
    // Pool-major (the selected pool is first in `pools`): the user's language
    // tries every spelling variant before other pools, so the cap covers the
    // selected pool fully plus the next pools — needed because the right pool
    // for a city varies (首尔 only in zh-TW, 紐約市 in zh/zh-TW).
    const attempts = pools.flatMap((p) => variants.map((v) => [p, v])).slice(0, 24);
    const results = await Promise.all(
      attempts.map(([p, v]) => geocodeOnce(p, v).catch(() => []))
    );
    // A bare re-spelling can hit a tiny place that shadows the big one
    // (纽约 -> 紐約 in Kentucky, while 紐約市 is New York City), so among the
    // hitting attempts prefer the most specific (longest) query; ties keep
    // pool/variant order. One failing leg degrades to "no results" instead
    // of sinking the whole round.
    let best = -1;
    let bestLen = -1;
    results.forEach((r, i) => {
      if (r.length && attempts[i][1].length > bestLen) {
        best = i;
        bestLen = attempts[i][1].length;
      }
    });
    found = best >= 0 ? results[best] : [];
  }

  return found || [];
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

// ---------- PWA: register the service worker (offline app shell) ----------
// Skips file:// and non-localhost http, where SW registration is unsupported.
if ("serviceWorker" in navigator &&
    (location.protocol === "https:" ||
     ["localhost", "127.0.0.1", "0.0.0.0"].includes(location.hostname))) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* SW unavailable — the app works without it (online only) */
    });
  });
}
