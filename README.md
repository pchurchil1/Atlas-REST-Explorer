# Atlas REST Explorer

![Static Site](https://img.shields.io/badge/app-static_site-1f6b57)
![REST APIs](https://img.shields.io/badge/APIs-3_public_REST_sources-3b7fa6)
![No Build Step](https://img.shields.io/badge/setup-no_build_step-d75f42)

Atlas REST Explorer is a polished browser app built to demonstrate practical REST API integration. It combines country metadata, capital weather, and population indicators into one interactive dashboard with visible request telemetry.

## GitHub Description

Interactive REST API dashboard that chains country, weather, and population endpoints with caching, filtering, fallback data, and a live request log.

## Overview

The app starts by loading a country collection from REST Countries. Selecting a country fetches a detailed country resource, then uses that response to make two follow-up requests:

- Capital coordinates are passed into Open-Meteo for current weather.
- The country code is passed into the World Bank API for recent population data.

The interface intentionally exposes the API layer. Every request is logged with its method, endpoint label, HTTP status, response time, and cache hits so reviewers can see the REST behavior without opening DevTools.

## Features

- Searchable and region-filtered country collection.
- Country detail view with capital, region, population, currency, language, and flag data.
- Chained API requests derived from selected resource fields.
- Current capital weather from Open-Meteo.
- Five-year population trend from the World Bank API.
- In-memory response cache with visible cache-hit logging.
- Graceful fallback data if the country collection request fails.
- Responsive, accessible static UI with no build step.

## APIs Used

| Source | Endpoint Pattern | Purpose |
| --- | --- | --- |
| REST Countries | `GET /v3.1/all?fields=...` | Loads the browsable country collection. |
| REST Countries | `GET /v3.1/alpha/{code}?fields=...` | Fetches detail for the selected country. |
| Open-Meteo | `GET /v1/forecast?latitude={lat}&longitude={lng}&current=...` | Fetches current weather for the capital city. |
| World Bank | `GET /v2/country/{code}/indicator/SP.POP.TOTL?format=json&date=2019:2023` | Fetches recent population indicators. |

## REST Concepts Demonstrated

- Resource-oriented endpoints using collection and detail URLs.
- Path parameters for country codes.
- Query parameters built with `URLSearchParams`.
- Field selection to limit response payload size.
- Chained requests where one response provides parameters for the next request.
- Parallel follow-up requests with `Promise.allSettled`.
- HTTP status and latency reporting.
- Client-side caching for repeated resource reads.
- Error handling and fallback state for public API failures.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Public REST APIs

No framework, bundler, package manager, or API key is required.

## Getting Started

Clone the repository and serve the project directory with any static file server.

```bash
python3 -m http.server 4173
```

Open the app:

```text
http://localhost:4173
```

You can also open `index.html` directly in a browser, though serving locally is closer to production behavior.

## Project Structure

```text
.
|-- app.js       # REST client, state, caching, rendering, and interactions
|-- index.html   # Accessible application markup
|-- LICENSE      # MIT license
|-- styles.css   # Responsive visual design
`-- README.md    # Project documentation
```

## How The Data Flow Works

1. `loadCountries()` requests the country collection from REST Countries.
2. `applyFilters()` keeps search and region filtering client-side for fast interaction.
3. `selectCountry(code)` fetches a detailed country resource by ISO alpha-3 code.
4. `loadWeather(country)` reads capital coordinates and requests current weather.
5. `loadPopulation(country)` reads the ISO alpha-2 code and requests World Bank indicators.
6. `requestJson()` centralizes fetch behavior, error handling, cache reads, cache writes, latency measurement, and request logging.

## Reliability Notes

Public APIs can change, rate limit, or briefly fail. The app accounts for this in a few ways:

- REST Countries requests use explicit `fields` lists to keep payloads small and comply with field limits.
- Failed collection loads fall back to a built-in sample dataset.
- Follow-up API calls use `Promise.allSettled` so one failed insight does not block the rest of the selected country view.
- Repeated requests are served from an in-memory cache and marked as cache hits in the UI.

## Portfolio Talking Points

This project is useful for demonstrating:

- Designing a small API client around real public services.
- Building a UI that makes asynchronous network behavior observable.
- Handling partial failure without collapsing the full experience.
- Coordinating multiple REST resources into one coherent product flow.
- Writing framework-free JavaScript with clear separation between state, data access, and rendering.

## Future Improvements

- Add URL routing so selected countries can be deep-linked.
- Persist the request cache with `sessionStorage`.
- Add unit tests around `requestJson`, filtering, and data formatting.
- Add skeleton loading states for detail panels.
- Add a deployment workflow for GitHub Pages.

## License

MIT
