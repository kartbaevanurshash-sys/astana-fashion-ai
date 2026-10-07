INSERT INTO products (name, short_name, category, demand_level, trend_score)
VALUES
  ('Астана Парка', 'астана парка', 'outerwear', 'ЖОҒАРЫ', 35),
  ('Етік (Termo)', 'етiк termo', 'footwear', 'ОРТАША', 12),
  ('Ветровка (Легкая)', 'ветровка', 'outerwear', 'ТӨМЕН', -40),
  ('Шарф (Бөрік)', 'шарф бөрік', 'thermo', 'ОРТАША', 20),
  ('Термобелье Комплект', 'термо комплект', 'thermo', 'ЖОҒАРЫ', 42),
  ('Ақ киім', 'ақ киім', 'outerwear', 'ЖОҒАРЫ', 31);

INSERT INTO inventory (product_id, stock_quantity, reorder_status)
VALUES
  (1, 120, 'REORDER'),
  (2, 85, 'STABLE'),
  (3, 310, 'OVERSTOCK'),
  (4, 50, 'REORDER'),
  (5, 140, 'REORDER'),
  (6, 90, 'STABLE');

INSERT INTO weather_snapshots (snapshot_date, temp, wind_speed, humidity, weather_label)
VALUES
  ('2026-09-23', -15, 8, 75, 'Аяз'),
  ('2026-09-22', -18, 10, 71, 'Аяз'),
  ('2026-09-21', -10, 7, 69, 'Суық'),
  ('2026-09-20', -5, 6, 64, 'Суық'),
  ('2026-09-19', -12, 9, 72, 'Аяз'),
  ('2026-09-18', -24, 12, 77, 'Аяз'),
  ('2026-09-17', -20, 11, 80, 'Аяз');

INSERT INTO demand_forecasts (forecast_date, day_name, demand_index, temp_c, trend_summary)
VALUES
  ('2026-09-24', 'Дүй', 20, 10, 'Бастапқы'),
  ('2026-09-25', 'Сей', 70, 11, 'Жоғарлау'),
  ('2026-09-26', 'Сәр', 65, 5, 'Стабильді'),
  ('2026-09-27', 'Бей', 115, 7, 'Жоғары'),
  ('2026-09-28', 'Жұм', 110, 12, 'Әлсіз арттыру'),
  ('2026-09-29', 'Сен', 125, 10, 'Пик'),
  ('2026-09-30', 'Жек', 25, 11, 'Төмен');

INSERT INTO sales_records (product_id, sale_date, quantity, revenue)
VALUES
  (1, '2026-09-20', 30, 9600),
  (1, '2026-09-21', 36, 11520),
  (2, '2026-09-20', 20, 4200),
  (3, '2026-09-22', 28, 6800),
  (4, '2026-09-21', 15, 3000),
  (5, '2026-09-23', 24, 6200),
  (6, '2026-09-22', 18, 5100);
