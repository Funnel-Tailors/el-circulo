-- Insert Brecha mode settings into app_settings
INSERT INTO app_settings (key, value) VALUES 
  ('brecha_mode', '"evergreen"'),
  ('brecha_opens_at', 'null'),
  ('brecha_closes_at', 'null')
ON CONFLICT (key) DO NOTHING;