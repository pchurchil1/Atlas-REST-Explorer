const API = {
  countries:
    "https://restcountries.com/v3.1/all?fields=name,cca2,cca3,capital,capitalInfo,population,region,subregion,flags,currencies",
  countryByCode: (code) =>
    `https://restcountries.com/v3.1/alpha/${encodeURIComponent(code)}?fields=name,cca2,cca3,capital,capitalInfo,region,subregion,flags,currencies,languages`,
  weather: ({ latitude, longitude }) => {
    const params = new URLSearchParams({
      latitude,
      longitude,
      current: "temperature_2m,wind_speed_10m,weather_code",
      timezone: "auto",
    });
    return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  },
  population: (countryCode) => {
    const params = new URLSearchParams({
      format: "json",
      per_page: "5",
      date: "2019:2023",
    });
    return `https://api.worldbank.org/v2/country/${encodeURIComponent(countryCode)}/indicator/SP.POP.TOTL?${params.toString()}`;
  },
};

const FALLBACK_COUNTRIES = [
  {
    name: { common: "Japan", official: "Japan" },
    cca2: "JP",
    cca3: "JPN",
    capital: ["Tokyo"],
    capitalInfo: { latlng: [35.68, 139.75] },
    population: 125836021,
    region: "Asia",
    subregion: "Eastern Asia",
    flags: { svg: "https://flagcdn.com/jp.svg", alt: "Flag of Japan" },
    currencies: { JPY: { name: "Japanese yen", symbol: "¥" } },
    languages: { jpn: "Japanese" },
  },
  {
    name: { common: "Brazil", official: "Federative Republic of Brazil" },
    cca2: "BR",
    cca3: "BRA",
    capital: ["Brasilia"],
    capitalInfo: { latlng: [-15.79, -47.88] },
    population: 212559409,
    region: "Americas",
    subregion: "South America",
    flags: { svg: "https://flagcdn.com/br.svg", alt: "Flag of Brazil" },
    currencies: { BRL: { name: "Brazilian real", symbol: "R$" } },
    languages: { por: "Portuguese" },
  },
  {
    name: { common: "Kenya", official: "Republic of Kenya" },
    cca2: "KE",
    cca3: "KEN",
    capital: ["Nairobi"],
    capitalInfo: { latlng: [-1.28, 36.82] },
    population: 53771300,
    region: "Africa",
    subregion: "Eastern Africa",
    flags: { svg: "https://flagcdn.com/ke.svg", alt: "Flag of Kenya" },
    currencies: { KES: { name: "Kenyan shilling", symbol: "Sh" } },
    languages: { eng: "English", swa: "Swahili" },
  },
  {
    name: { common: "Germany", official: "Federal Republic of Germany" },
    cca2: "DE",
    cca3: "DEU",
    capital: ["Berlin"],
    capitalInfo: { latlng: [52.52, 13.4] },
    population: 83240525,
    region: "Europe",
    subregion: "Western Europe",
    flags: { svg: "https://flagcdn.com/de.svg", alt: "Flag of Germany" },
    currencies: { EUR: { name: "Euro", symbol: "€" } },
    languages: { deu: "German" },
  },
  {
    name: { common: "New Zealand", official: "New Zealand" },
    cca2: "NZ",
    cca3: "NZL",
    capital: ["Wellington"],
    capitalInfo: { latlng: [-41.3, 174.78] },
    population: 5084300,
    region: "Oceania",
    subregion: "Australia and New Zealand",
    flags: { svg: "https://flagcdn.com/nz.svg", alt: "Flag of New Zealand" },
    currencies: { NZD: { name: "New Zealand dollar", symbol: "$" } },
    languages: { eng: "English", mri: "Maori", nzs: "New Zealand Sign Language" },
  },
];

const state = {
  countries: [],
  filteredCountries: [],
  selectedCode: "",
  region: "all",
  searchTerm: "",
  cache: new Map(),
  log: [],
};

const elements = {
  connectionDot: document.querySelector("#connectionDot"),
  connectionText: document.querySelector("#connectionText"),
  refreshButton: document.querySelector("#refreshButton"),
  searchInput: document.querySelector("#searchInput"),
  filterChips: document.querySelectorAll(".filter-chip"),
  resultCount: document.querySelector("#resultCount"),
  cacheCount: document.querySelector("#cacheCount"),
  countryList: document.querySelector("#countryList"),
  countryName: document.querySelector("#countryName"),
  countrySummary: document.querySelector("#countrySummary"),
  flagImage: document.querySelector("#flagImage"),
  capitalValue: document.querySelector("#capitalValue"),
  populationValue: document.querySelector("#populationValue"),
  regionValue: document.querySelector("#regionValue"),
  currencyValue: document.querySelector("#currencyValue"),
  weatherTemp: document.querySelector("#weatherTemp"),
  weatherCaption: document.querySelector("#weatherCaption"),
  windValue: document.querySelector("#windValue"),
  timezoneValue: document.querySelector("#timezoneValue"),
  populationBars: document.querySelector("#populationBars"),
  requestLog: document.querySelector("#requestLog"),
  clearLogButton: document.querySelector("#clearLogButton"),
  countryCardTemplate: document.querySelector("#countryCardTemplate"),
  requestTemplate: document.querySelector("#requestTemplate"),
};

async function requestJson(url, label, options = {}) {
  const cacheKey = `${label}:${url}`;
  if (state.cache.has(cacheKey) && !options.force) {
    addRequestLog({ label, url, status: "cache", elapsed: 0 });
    updateCacheCount();
    return state.cache.get(cacheKey);
  }

  const startedAt = performance.now();
  const response = await fetch(url, { signal: options.signal });
  const elapsed = Math.round(performance.now() - startedAt);
  addRequestLog({ label, url, status: response.status, elapsed });

  if (!response.ok) {
    throw new Error(`${label} failed with status ${response.status}`);
  }

  const data = await response.json();
  state.cache.set(cacheKey, data);
  updateCacheCount();
  return data;
}

function addRequestLog(entry) {
  state.log = [entry, ...state.log].slice(0, 10);
  renderRequestLog();
}

function renderRequestLog() {
  elements.requestLog.replaceChildren();

  if (!state.log.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Requests will appear here as resources load.";
    elements.requestLog.append(empty);
    return;
  }

  state.log.forEach((entry) => {
    const row = elements.requestTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector("strong").textContent = `GET ${entry.label}`;
    row.querySelector("small").textContent = entry.url;
    row.querySelector("span").textContent =
      entry.status === "cache" ? "cache hit" : `${entry.status} · ${entry.elapsed}ms`;
    elements.requestLog.append(row);
  });
}

function updateConnection(status, message) {
  elements.connectionDot.className = `status-dot ${status}`;
  elements.connectionText.textContent = message;
}

function updateCacheCount() {
  elements.cacheCount.textContent = `${state.cache.size} cached`;
}

async function loadCountries({ force = false } = {}) {
  updateConnection("", "Loading countries");

  try {
    const countries = await requestJson(API.countries, "REST Countries collection", { force });
    state.countries = countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
    updateConnection("ready", `${state.countries.length} countries loaded`);
  } catch (error) {
    console.warn(error);
    state.countries = FALLBACK_COUNTRIES;
    updateConnection("error", "Using built-in sample data");
  }

  applyFilters();
  if (!state.selectedCode && state.filteredCountries.length) {
    selectCountry(state.filteredCountries[0].cca3);
  }
}

function applyFilters() {
  const term = state.searchTerm.trim().toLowerCase();
  state.filteredCountries = state.countries.filter((country) => {
    const matchesRegion = state.region === "all" || country.region === state.region;
    const matchesTerm =
      !term ||
      country.name.common.toLowerCase().includes(term) ||
      country.name.official.toLowerCase().includes(term) ||
      country.cca3.toLowerCase().includes(term);
    return matchesRegion && matchesTerm;
  });

  elements.resultCount.textContent = `${state.filteredCountries.length} countries`;
  renderCountryList();
}

function renderCountryList() {
  elements.countryList.replaceChildren();

  if (!state.filteredCountries.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No countries match that filter.";
    elements.countryList.append(empty);
    return;
  }

  state.filteredCountries.slice(0, 80).forEach((country) => {
    const card = elements.countryCardTemplate.content.firstElementChild.cloneNode(true);
    card.dataset.code = country.cca3;
    card.classList.toggle("active", country.cca3 === state.selectedCode);
    card.querySelector("img").src = country.flags.svg || country.flags.png;
    card.querySelector("img").alt = country.flags.alt || `Flag of ${country.name.common}`;
    card.querySelector("strong").textContent = country.name.common;
    card.querySelector("small").textContent = `${country.region} · ${country.cca3}`;
    card.addEventListener("click", () => selectCountry(country.cca3));
    elements.countryList.append(card);
  });
}

async function selectCountry(code) {
  state.selectedCode = code;
  renderCountryList();
  resetInsights();

  const country = state.countries.find((item) => item.cca3 === code);
  if (!country) return;

  renderCountryOverview(country);

  try {
    const detail = await requestJson(API.countryByCode(code), "country detail");
    const mergedCountry = { ...country, ...detail };
    renderCountryOverview(mergedCountry);
    await Promise.allSettled([loadWeather(mergedCountry), loadPopulation(mergedCountry)]);
  } catch (error) {
    console.warn(error);
    await Promise.allSettled([loadWeather(country), loadPopulation(country)]);
  }
}

function renderCountryOverview(country) {
  const currency = Object.values(country.currencies || {})[0];
  const languages = Object.values(country.languages || {}).slice(0, 3).join(", ");

  elements.countryName.textContent = country.name.common;
  elements.countrySummary.textContent = [
    country.name.official,
    country.subregion || country.region,
    languages ? `Languages: ${languages}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  elements.flagImage.src = country.flags.svg || country.flags.png;
  elements.flagImage.alt = country.flags.alt || `Flag of ${country.name.common}`;
  elements.capitalValue.textContent = country.capital?.[0] || "No official capital";
  elements.populationValue.textContent = formatNumber(country.population);
  elements.regionValue.textContent = country.subregion || country.region;
  elements.currencyValue.textContent = currency
    ? `${currency.name}${currency.symbol ? ` (${currency.symbol})` : ""}`
    : "Unavailable";
}

async function loadWeather(country) {
  const [latitude, longitude] = country.capitalInfo?.latlng || [];
  if (!latitude || !longitude) {
    elements.weatherCaption.textContent = "No capital coordinates available";
    return;
  }

  const weather = await requestJson(API.weather({ latitude, longitude }), "capital weather");
  const current = weather.current;
  elements.weatherTemp.textContent = `${Math.round(current.temperature_2m)}°`;
  elements.weatherCaption.textContent = weatherCodeLabel(current.weather_code);
  elements.windValue.textContent = `Wind ${Math.round(current.wind_speed_10m)} km/h`;
  elements.timezoneValue.textContent = weather.timezone || "Timezone unavailable";
}

async function loadPopulation(country) {
  if (!country.cca2) {
    renderPopulationBars([]);
    return;
  }

  const data = await requestJson(API.population(country.cca2), "population trend");
  renderPopulationBars(data[1] || []);
}

function renderPopulationBars(rows) {
  elements.populationBars.replaceChildren();
  const cleanRows = rows
    .filter((row) => typeof row.value === "number")
    .sort((a, b) => Number(a.date) - Number(b.date));

  if (!cleanRows.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Population trend unavailable.";
    elements.populationBars.append(empty);
    return;
  }

  const max = Math.max(...cleanRows.map((row) => row.value));
  cleanRows.forEach((row) => {
    const bar = document.createElement("div");
    const fill = document.createElement("div");
    const label = document.createElement("small");
    const height = Math.max(8, Math.round((row.value / max) * 118));
    bar.className = "bar";
    fill.className = "bar-fill";
    fill.style.height = `${height}px`;
    fill.title = `${row.date}: ${formatNumber(row.value)}`;
    label.textContent = row.date;
    bar.append(fill, label);
    elements.populationBars.append(bar);
  });
}

function resetInsights() {
  elements.weatherTemp.textContent = "-";
  elements.weatherCaption.textContent = "Loading capital weather";
  elements.windValue.textContent = "Wind -";
  elements.timezoneValue.textContent = "Timezone -";
  elements.populationBars.replaceChildren();
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = "Loading World Bank trend.";
  elements.populationBars.append(empty);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function weatherCodeLabel(code) {
  const labels = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
  };
  return labels[code] || "Current conditions";
}

elements.searchInput.addEventListener("input", (event) => {
  state.searchTerm = event.target.value;
  applyFilters();
});

elements.filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    state.region = chip.dataset.region;
    elements.filterChips.forEach((item) => item.classList.toggle("active", item === chip));
    applyFilters();
  });
});

elements.refreshButton.addEventListener("click", () => {
  state.cache.clear();
  updateCacheCount();
  loadCountries({ force: true });
});

elements.clearLogButton.addEventListener("click", () => {
  state.log = [];
  renderRequestLog();
});

renderRequestLog();
loadCountries();
