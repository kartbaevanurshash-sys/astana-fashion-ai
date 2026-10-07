const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const rootDir = __dirname;
const dataDir = path.join(rootDir, 'data');
const dbPath = path.join(dataDir, 'astana_fashion.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(rootDir, 'public')));

fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(dbPath);

db.exec(fs.readFileSync(path.join(rootDir, 'database', 'schema.sql'), 'utf8'));

const productsCount = db.prepare('SELECT COUNT(*) AS count FROM products').get();
if (!productsCount.count) {
  const seedSql = fs.readFileSync(path.join(rootDir, 'database', 'seed.sql'), 'utf8');
  db.exec(seedSql);
}

function formatWeatherLabel(temp, wind, humidity) {
  if (temp <= -20) return 'Аяз';
  if (temp <= 0) return 'Суық';
  return 'Жылы';
}

function calculateScenario(temp, wind, precip) {
  let outerwearBoost = Math.max(10, Math.min(150, Math.abs(temp) * 2 + wind * 1.5));
  let footwearBoost = Math.max(5, Math.min(100, Math.abs(temp) * 1.2 + wind));
  let thermoBoost = temp < 0 ? Math.max(20, Math.min(180, Math.abs(temp) * 3.5)) : 10;
  let accessoriesBoost = Math.max(5, Math.min(80, wind * 2 + (temp < 0 ? 15 : 0)));

  if (precip === 'blizzard') {
    outerwearBoost += 25;
    thermoBoost += 30;
  } else if (precip === 'snow') {
    footwearBoost += 20;
  }

  let tempFactor = Math.min(75, Math.max(30, 50 + Math.abs(temp) * 0.8));
  let windFactor = Math.min(40, Math.max(15, wind * 1.5));
  let precipFactor = 100 - tempFactor - windFactor;

  return {
    outerwearBoost: Math.round(outerwearBoost),
    footwearBoost: Math.round(footwearBoost),
    thermoBoost: Math.round(thermoBoost),
    accessoriesBoost: Math.round(accessoriesBoost),
    tempFactor: Math.round(tempFactor),
    windFactor: Math.round(windFactor),
    precipFactor: Math.round(precipFactor),
    label: formatWeatherLabel(temp, wind, 75),
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Astana Fashion AI API is running' });
});

app.get('/api/dashboard', (req, res) => {
  const weather = db.prepare(`
    SELECT temp, wind_speed, humidity, weather_label
    FROM weather_snapshots
    ORDER BY snapshot_date DESC
    LIMIT 1
  `).get();

  const topProduct = db.prepare(`
    SELECT p.name, p.category, i.stock_quantity AS stock, p.trend_score
    FROM products p
    JOIN inventory i ON i.product_id = p.id
    ORDER BY p.trend_score DESC
    LIMIT 1
  `).get();

  const forecast = db.prepare(`
    SELECT day_name, demand_index, temp_c
    FROM demand_forecasts
    ORDER BY forecast_date ASC
    LIMIT 7
  `).all();

  const metrics = {
    productRisk: db.prepare('SELECT COUNT(*) AS count FROM inventory WHERE stock_quantity < 80').get().count,
    trendGrowth: 28,
    weeklySales: 125,
  };

  res.json({
    weather: weather || { temp: -15, wind_speed: 8, humidity: 75, weather_label: 'Аяз' },
    topProduct: topProduct || { name: 'Астана Пуховигі', category: 'outerwear', stock: 120, trend_score: 89 },
    forecast,
    metrics,
    aiAdvice: `"Жел күшейді. Жылы курткаға сұраныс +35% артты."`
  });
});

app.get('/api/analytics', (req, res) => {
  const season = req.query.season || 'autumn';
  const tf = req.query.timeframe || '1m';

  const comparison = {
    labels: ['14 Қыр', '17 Қыр', '20 Қыр', '23 Қыр', '26 Қыр', '29 Қыр'],
    actual: [90, 110, 80, 120, 60, 90],
    forecast: [55, 35, 70, 50, 85, 130],
    temperature: [10, 12, 8, 5, 2, -5],
  };

  if (tf === '7d') {
    comparison.labels = ['17 Қыр', '18 Қыр', '19 Қыр', '20 Қыр', '21 Қыр', '22 Қыр', '23 Қыр'];
    comparison.actual = [80, 90, 85, 100, 115, 105, 120];
    comparison.forecast = [75, 88, 92, 98, 110, 112, 118];
  } else if (tf === '3m') {
    comparison.labels = ['Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша'];
    comparison.actual = [200, 310, 450, 620, 800];
    comparison.forecast = [210, 290, 470, 600, 830];
  }

  res.json({
    season,
    timeframe: tf,
    comparison,
    categoryBreakdown: {
      labels: ['Сыртқы киім', 'Аяқ киім', 'Аксессуарлар', 'Термобелье'],
      values: [45, 25, 15, 15]
    },
    weatherImpact: {
      labels: ['Температура', 'Жел', 'Жауын'],
      values: [60, 25, 15]
    }
  });
});

app.get('/api/catalog', (req, res) => {
  const products = db.prepare(`
    SELECT p.id, p.name, p.category, p.short_name, p.trend_score, p.demand_level,
           i.stock_quantity, i.reorder_status
    FROM products p
    JOIN inventory i ON i.product_id = p.id
    ORDER BY p.id ASC
  `).all();

  res.json({ products });
});

app.get('/api/simulator', (req, res) => {
  const temp = Number(req.query.temp || -25);
  const wind = Number(req.query.wind || 12);
  const precip = req.query.precip || 'blizzard';

  const data = calculateScenario(temp, wind, precip);

  res.json({
    temp,
    wind,
    precip,
    values: {
      outerwear: data.outerwearBoost,
      footwear: data.footwearBoost,
      thermo: data.thermoBoost,
      accessories: data.accessoriesBoost
    },
    factors: {
      temp: data.tempFactor,
      wind: data.windFactor,
      precip: data.precipFactor
    },
    label: data.label,
    advice: `"Сценарий белсенді: Температура ${temp}°C, Жел ${wind} м/с. Термобелье сұранысы +${data.thermoBoost}% артты."`
  });
});

app.get('/api/export/csv', (req, res) => {
  const products = db.prepare(`
    SELECT p.name, i.stock_quantity, p.demand_level, p.trend_score
    FROM products p
    JOIN inventory i ON i.product_id = p.id
  `).all();

  const rows = [
    ['Тауар Аты', 'Қор', 'Сұраныс Деңгейі', 'ML Өзгерісі']
  ];

  products.forEach((product) => {
    rows.push([product.name, product.stock_quantity, product.demand_level, `+${product.trend_score}%`]);
  });

  const csv = rows.map((row) => row.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="astana_fashion_ai_matrix.csv"');
  res.send(csv);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Astana Fashion AI server running on http://localhost:${PORT}`);
});
