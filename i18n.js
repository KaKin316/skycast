/**
 * Skycast i18n dictionaries.
 *
 * Each entry:
 *   name    — menu label, written in the language itself
 *   locale  — BCP-47 tag (used for Intl weekday names + <html lang>)
 *   t       — UI strings ({placeholders} are substituted by app.js)
 *   wmo     — localized weather descriptions per WMO code
 */
const I18N = {
  "en": {
    name: "English",
    locale: "en",
    t: {
      brandSub: "live weather",
      searchPlaceholder: "Search a city… e.g. Tokyo, Paris, Taipei",
      search: "Search",
      locateTitle: "Use my location",
      emptyTitle: "Where should we look?",
      emptyBody: "Type a city above, or try one of these:",
      errorTitle: "Something went wrong",
      noResults: "No matches found",
      loading: "Fetching the latest forecast…",
      feelsLike: "Feels like",
      humidity: "Humidity",
      wind: "Wind",
      pressure: "Pressure",
      forecast: "7-day forecast",
      today: "Today",
      observedAt: "Local time {time} · {zone}",
      title: "{temp} {icon} {place} — Skycast",
      footer: 'Data by <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> · No API key needed',
      proxyBanner: '⚠️ Local proxy not reachable. In this browser, start it from the project folder with <code>node server.js</code> (or <code>./start.sh</code>), then reload this page.',
      geoUnsupported: "Geolocation is not supported by this browser.",
      geocodeNoMatch: 'No location found for “{q}”. Try another city name.'
    },
    wmo: {
      0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
      45: "Fog", 48: "Rime fog",
      51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 56: "Freezing drizzle", 57: "Freezing drizzle",
      61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Freezing rain", 67: "Freezing rain",
      71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
      80: "Light showers", 81: "Showers", 82: "Heavy showers", 85: "Snow showers", 86: "Snow showers",
      95: "Thunderstorm", 96: "Thunderstorm, hail", 99: "Thunderstorm, heavy hail"
    }
  },

  "zh-TW": {
    name: "繁體中文",
    locale: "zh-TW",
    t: {
      brandSub: "即時天氣",
      searchPlaceholder: "搜尋城市… 例如東京、巴黎、台北",
      search: "搜尋",
      locateTitle: "使用我的位置",
      emptyTitle: "要看哪裡的天氣？",
      emptyBody: "在上方輸入城市，或點選以下建議：",
      errorTitle: "出錯囉",
      noResults: "找不到符合的結果",
      loading: "正在取得最新預報…",
      feelsLike: "體感溫度",
      humidity: "濕度",
      wind: "風速",
      pressure: "氣壓",
      forecast: "7 天預報",
      today: "今天",
      observedAt: "當地時間 {time} · {zone}",
      title: "{temp} {icon} {place} — Skycast",
      footer: '資料來自 <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> · 免 API key',
      proxyBanner: '⚠️ 找不到本地代理。請在專案資料夾執行 <code>node server.js</code>（或 <code>./start.sh</code>），再重新整理頁面。',
      geoUnsupported: "此瀏覽器不支援定位功能。",
      geocodeNoMatch: "找不到「{q}」，請嘗試其他城市。"
    },
    wmo: {
      0: "晴朗", 1: "大致晴朗", 2: "局部多雲", 3: "陰天",
      45: "霧", 48: "凍霧",
      51: "小毛毛雨", 53: "毛毛雨", 55: "大毛毛雨", 56: "凍毛毛雨", 57: "凍毛毛雨",
      61: "小雨", 63: "雨", 65: "大雨", 66: "凍雨", 67: "凍雨",
      71: "小雪", 73: "雪", 75: "大雪", 77: "雪粒",
      80: "小陣雨", 81: "陣雨", 82: "大陣雨", 85: "陣雪", 86: "陣雪",
      95: "雷暴", 96: "雷暴伴冰雹", 99: "雷暴伴大冰雹"
    }
  },

  "zh-CN": {
    name: "简体中文",
    locale: "zh-CN",
    t: {
      brandSub: "实时天气",
      searchPlaceholder: "搜索城市… 例如东京、巴黎、台北",
      search: "搜索",
      locateTitle: "使用我的位置",
      emptyTitle: "要看哪里？",
      emptyBody: "在上方输入城市，或点击以下建议：",
      errorTitle: "出错了",
      noResults: "找不到匹配的结果",
      loading: "正在获取最新预报…",
      feelsLike: "体感温度",
      humidity: "湿度",
      wind: "风速",
      pressure: "气压",
      forecast: "7 天预报",
      today: "今天",
      observedAt: "当地时间 {time} · {zone}",
      title: "{temp} {icon} {place} — Skycast",
      footer: '数据来自 <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> · 无需 API key',
      proxyBanner: '⚠️ 找不到本地代理。请在项目文件夹运行 <code>node server.js</code>（或 <code>./start.sh</code>），然后刷新页面。',
      geoUnsupported: "此浏览器不支持定位。",
      geocodeNoMatch: "找不到“{q}”，请尝试其他城市。"
    },
    wmo: {
      0: "晴朗", 1: "大致晴朗", 2: "局部多云", 3: "阴",
      45: "雾", 48: "冻雾",
      51: "小毛毛雨", 53: "毛毛雨", 55: "大毛毛雨", 56: "冻毛毛雨", 57: "冻毛毛雨",
      61: "小雨", 63: "雨", 65: "大雨", 66: "冻雨", 67: "冻雨",
      71: "小雪", 73: "雪", 75: "大雪", 77: "雪粒",
      80: "小阵雨", 81: "阵雨", 82: "大阵雨", 85: "阵雪", 86: "阵雪",
      95: "雷暴", 96: "雷暴伴冰雹", 99: "雷暴伴大冰雹"
    }
  },

  "ja": {
    name: "日本語",
    locale: "ja",
    t: {
      brandSub: "ライブ天気",
      searchPlaceholder: "都市を検索… 例: 東京、パリ、台北",
      search: "検索",
      locateTitle: "自分の位置を使う",
      emptyTitle: "どこを見ますか？",
      emptyBody: "上で都市名を入力するか、候補から選んでください：",
      errorTitle: "問題が発生しました",
      noResults: "一致する結果がありません",
      loading: "最新の予報を取得中…",
      feelsLike: "体感気温",
      humidity: "湿度",
      wind: "風速",
      pressure: "気圧",
      forecast: "7日間予報",
      today: "今日",
      observedAt: "現地時間 {time} · {zone}",
      title: "{temp} {icon} {place} — Skycast",
      footer: 'データ提供: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> · API キー不要',
      proxyBanner: '⚠️ ローカルプロキシに接続できません。プロジェクトフォルダで <code>node server.js</code>（または <code>./start.sh</code>）を実行してから、ページを再読み込みしてください。',
      geoUnsupported: "このブラウザは位置情報に対応していません。",
      geocodeNoMatch: "「{q}」は見つかりませんでした。他の都市名を試してください。"
    },
    wmo: {
      0: "快晴", 1: "晴れ", 2: "晴れ時々曇り", 3: "曇り",
      45: "霧", 48: "放射霧",
      51: "弱い霧雨", 53: "霧雨", 55: "強い霧雨", 56: "凍る霧雨", 57: "凍る霧雨",
      61: "小雨", 63: "雨", 65: "大雨", 66: "凍雨", 67: "凍雨",
      71: "小雪", 73: "雪", 75: "大雪", 77: "雪粒",
      80: "弱い雨", 81: "雨", 82: "強い雨", 85: "雪", 86: "雪",
      95: "雷雨", 96: "雷雨・雹", 99: "雷雨・強い雹"
    }
  },

  "ko": {
    name: "한국어",
    locale: "ko",
    t: {
      brandSub: "실시간 날씨",
      searchPlaceholder: "도시 검색… 예: 도쿄, 파리, 타이베이",
      search: "검색",
      locateTitle: "내 위치 사용",
      emptyTitle: "어디를 볼까요?",
      emptyBody: "위에서 도시를 입력하거나 아래에서 선택하세요:",
      errorTitle: "문제가 발생했습니다",
      noResults: "일치하는 결과가 없습니다",
      loading: "최신 예보 가져오는 중…",
      feelsLike: "체감 온도",
      humidity: "습도",
      wind: "풍속",
      pressure: "기압",
      forecast: "7일 예보",
      today: "오늘",
      observedAt: "현지 시간 {time} · {zone}",
      title: "{temp} {icon} {place} — Skycast",
      footer: '데이터 제공: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> · API 키 불필요',
      proxyBanner: '⚠️ 로컬 프록시를 찾을 수 없습니다. 프로젝트 폴더에서 <code>node server.js</code>(또는 <code>./start.sh</code>)를 실행한 뒤 페이지를 새로고침하세요.',
      geoUnsupported: "이 브라우저는 위치 추적을 지원하지 않습니다.",
      geocodeNoMatch: "“{q}”을(를) 찾을 수 없습니다. 다른 도시 이름을 입력해 보세요."
    },
    wmo: {
      0: "맑음", 1: "대체로 맑음", 2: "가끔 구름 많음", 3: "흐림",
      45: "안개", 48: "서리 안개",
      51: "약한 비", 53: "가랑비", 55: "강한 비", 56: "서리비", 57: "서리비",
      61: "약한 비", 63: "비", 65: "강한 비", 66: "서리비", 67: "서리비",
      71: "약한 눈", 73: "눈", 75: "강한 눈", 77: "눈싸락",
      80: "약한 소나기", 81: "소나기", 82: "강한 소나기", 85: "약한 눈", 86: "눈",
      95: "천둥·번개", 96: "천둥·번개/우박", 99: "천둥·번개/강한 우박"
    }
  },

  "es": {
    name: "Español",
    locale: "es",
    t: {
      brandSub: "tiempo en vivo",
      searchPlaceholder: "Busca una ciudad… p. ej. Tokio, París, Taipéi",
      search: "Buscar",
      locateTitle: "Usar mi ubicación",
      emptyTitle: "¿Dónde miramos?",
      emptyBody: "Escribe una ciudad arriba o prueba con estas:",
      errorTitle: "Algo salió mal",
      noResults: "No se encontraron coincidencias",
      loading: "Obteniendo el pronóstico…",
      feelsLike: "Sensación térmica",
      humidity: "Humedad",
      wind: "Viento",
      pressure: "Presión",
      forecast: "Pronóstico de 7 días",
      today: "Hoy",
      observedAt: "Hora local {time} · {zone}",
      title: "{temp} {icon} {place} — Skycast",
      footer: 'Datos de <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> · sin API key',
      proxyBanner: '⚠️ No se alcanza el proxy local. Inícialo desde la carpeta del proyecto con <code>node server.js</code> (o <code>./start.sh</code>) y recarga la página.',
      geoUnsupported: "Este navegador no soporta la ubicación.",
      geocodeNoMatch: "No se encontró “{q}”. Prueba con otro nombre de ciudad."
    },
    wmo: {
      0: "Despejado", 1: "Mayormente despejado", 2: "Parcialmente nublado", 3: "Nublado",
      45: "Niebla", 48: "Niebla de escarcha",
      51: "Llovizna ligera", 53: "Llovizna", 55: "Llovizna intensa", 56: "Llovizna congelante", 57: "Llovizna congelante",
      61: "Lluvia ligera", 63: "Lluvia", 65: "Lluvia intensa", 66: "Lluvia congelante", 67: "Lluvia congelante",
      71: "Nieve ligera", 73: "Nieve", 75: "Nieve intensa", 77: "Granos de nieve",
      80: "Chubascos ligeros", 81: "Chubascos", 82: "Chubascos fuertes", 85: "Nevadas ligeras", 86: "Nevadas",
      95: "Tormenta", 96: "Tormenta con granizo", 99: "Tormenta con granizo fuerte"
    }
  },

  "fr": {
    name: "Français",
    locale: "fr",
    t: {
      brandSub: "météo en direct",
      searchPlaceholder: "Rechercher une ville… ex. Tokyo, Paris, Taipei",
      search: "Rechercher",
      locateTitle: "Utiliser ma position",
      emptyTitle: "Où regardons-nous ?",
      emptyBody: "Tapez une ville ci-dessus ou essayez celles-ci :",
      errorTitle: "Oups, un problème est survenu",
      noResults: "Aucun résultat trouvé",
      loading: "Récupération de la prévision…",
      feelsLike: "Ressenti",
      humidity: "Humidité",
      wind: "Vent",
      pressure: "Pression",
      forecast: "Prévisions sur 7 jours",
      today: "Aujourd'hui",
      observedAt: "Heure locale {time} · {zone}",
      title: "{temp} {icon} {place} — Skycast",
      footer: 'Données par <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> · sans clé API',
      proxyBanner: "⚠️ Proxy local inaccessible. Lancez-le depuis le dossier du projet avec <code>node server.js</code> (ou <code>./start.sh</code>), puis rechargez la page.",
      geoUnsupported: "La géolocalisation n'est pas prise en charge par ce navigateur.",
      geocodeNoMatch: "« {q} » introuvable. Essayez un autre nom de ville."
    },
    wmo: {
      0: "Ciel dégagé", 1: "Plutôt dégagé", 2: "Partiellement nuageux", 3: "Couvert",
      45: "Brouillard", 48: "Brouillard givrant",
      51: "Bruine légère", 53: "Bruine", 55: "Bruine forte", 56: "Bruine verglaçante", 57: "Bruine verglaçante",
      61: "Pluie légère", 63: "Pluie", 65: "Pluie forte", 66: "Pluie verglaçante", 67: "Pluie verglaçante",
      71: "Neige légère", 73: "Neige", 75: "Neige forte", 77: "Grains de neige",
      80: "Averses légères", 81: "Averses", 82: "Fortes averses", 85: "Averses de neige", 86: "Averses de neige",
      95: "Orage", 96: "Orage avec grêle", 99: "Orage avec forte grêle"
    }
  },

  "de": {
    name: "Deutsch",
    locale: "de",
    t: {
      brandSub: "Live-Wetter",
      searchPlaceholder: "Stadt suchen… z. B. Tokio, Paris, Taipeh",
      search: "Suchen",
      locateTitle: "Meinen Standort verwenden",
      emptyTitle: "Wohin sollen wir schauen?",
      emptyBody: "Gib oben eine Stadt ein oder probier diese aus:",
      errorTitle: "Etwas ist schiefgelaufen",
      noResults: "Keine Treffer gefunden",
      loading: "Aktuelle Vorhersage wird geladen…",
      feelsLike: "Gefühlt",
      humidity: "Luftfeuchte",
      wind: "Wind",
      pressure: "Luftdruck",
      forecast: "7-Tage-Vorhersage",
      today: "Heute",
      observedAt: "Ortszeit {time} · {zone}",
      title: "{temp} {icon} {place} — Skycast",
      footer: 'Daten von <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> · ohne API-Key',
      proxyBanner: "⚠️ Lokaler Proxy nicht erreichbar. Starte ihn im Projektordner mit <code>node server.js</code> (oder <code>./start.sh</code>) und lade die Seite neu.",
      geoUnsupported: "Dieser Browser unterstützt keine Geolokalisierung.",
      geocodeNoMatch: "„{q}“ nicht gefunden. Versuche einen anderen Stadtnamen."
    },
    wmo: {
      0: "Klar", 1: "Überwiegend klar", 2: "Teils bewölkt", 3: "Bewölkt",
      45: "Nebel", 48: "Reifnebel",
      51: "Leichter Nieselregen", 53: "Nieselregen", 55: "Starker Nieselregen", 56: "Gefrierender Nieselregen", 57: "Gefrierender Nieselregen",
      61: "Leichter Regen", 63: "Regen", 65: "Starker Regen", 66: "Gefrierender Regen", 67: "Gefrierender Regen",
      71: "Leichter Schneefall", 73: "Schnee", 75: "Starker Schneefall", 77: "Schneekörner",
      80: "Leichte Schauer", 81: "Schauer", 82: "Starke Schauer", 85: "Leichte Schneeschauer", 86: "Schneeschauer",
      95: "Gewitter", 96: "Gewitter mit Hagel", 99: "Gewitter mit starkem Hagel"
    }
  }
};
