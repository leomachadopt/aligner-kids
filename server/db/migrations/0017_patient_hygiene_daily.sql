CREATE TABLE IF NOT EXISTS patient_hygiene_daily (
  id varchar(255) PRIMARY KEY,
  patient_id varchar(255) NOT NULL,
  date varchar(10) NOT NULL,
  floss_ok boolean DEFAULT false NOT NULL,
  aligner_clean_count integer DEFAULT 0 NOT NULL,
  source varchar(30) DEFAULT 'weekly_checkin' NOT NULL,
  reported_by_user_id varchar(255),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);


