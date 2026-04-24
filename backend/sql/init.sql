CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  car_model TEXT NOT NULL,
  car_year INT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drive_logs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_distance NUMERIC(10,2) NOT NULL,
  avg_fuel_economy NUMERIC(10,2) NOT NULL,
  memo TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS segment_analysis (
  id SERIAL PRIMARY KEY,
  log_id INT NOT NULL REFERENCES drive_logs(id) ON DELETE CASCADE,
  segment_no INT NOT NULL,
  latitude NUMERIC(10,6) NOT NULL,
  longitude NUMERIC(10,6) NOT NULL,
  speed NUMERIC(10,2) NOT NULL,
  fuel_economy NUMERIC(10,2) NOT NULL,
  raw_features JSONB NOT NULL,
  ai_diagnosis_result TEXT,
  contribution JSONB
);

CREATE TABLE IF NOT EXISTS model_metrics (
  id SERIAL PRIMARY KEY,
  log_id INT NOT NULL UNIQUE REFERENCES drive_logs(id) ON DELETE CASCADE,
  rmse NUMERIC(10,4) NOT NULL,
  predicted_avg_fuel_economy NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
