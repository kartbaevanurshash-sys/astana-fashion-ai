# Astana Fashion AI

A full-stack HTML dashboard for fashion demand forecasting in Astana with a SQLite database, Express API, and weather-based scenario simulator.

## Features
- Forecast dashboard with weather insights
- Analytics and demand curves
- Product catalog with inventory matrix
- Simulator for temperature/wind/precip scenarios
- CSV export
- SQLite-backed data model

## Run locally

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

## Database

The project uses SQLite with schema in `database/schema.sql` and seed data in `database/seed.sql`.

## API

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/analytics`
- `GET /api/catalog`
- `GET /api/simulator`
- `GET /api/export/csv`

## Notes

This version is designed for local development and demo use, with full backend and database integration while keeping the front-end simple and easy to customize.
