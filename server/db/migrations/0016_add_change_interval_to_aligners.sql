ALTER TABLE aligners
  ADD COLUMN IF NOT EXISTS change_interval integer DEFAULT 14;


