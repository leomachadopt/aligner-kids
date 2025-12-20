-- Phase adherence target (percent) - used for aligner quests
ALTER TABLE "treatment_phases"
  ADD COLUMN IF NOT EXISTS "adherence_target_percent" integer DEFAULT 80 NOT NULL;

-- Wear sessions (pause/resume)
CREATE TABLE IF NOT EXISTS "aligner_wear_sessions" (
  "id" varchar(255) PRIMARY KEY NOT NULL,
  "patient_id" varchar(255) NOT NULL,
  "aligner_id" varchar(255) NOT NULL,
  "treatment_id" varchar(255),
  "phase_id" varchar(255),
  "state" varchar(20) NOT NULL,
  "started_at" timestamp NOT NULL,
  "ended_at" timestamp,
  "created_by_user_id" varchar(255) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "aligner_wear_daily" (
  "id" varchar(255) PRIMARY KEY NOT NULL,
  "patient_id" varchar(255) NOT NULL,
  "aligner_id" varchar(255) NOT NULL,
  "date" varchar(10) NOT NULL,
  "wear_minutes" integer DEFAULT 0 NOT NULL,
  "target_minutes" integer DEFAULT 0 NOT NULL,
  "target_percent" integer DEFAULT 80 NOT NULL,
  "is_day_ok" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Aligner quests
CREATE TABLE IF NOT EXISTS "aligner_quests" (
  "id" varchar(255) PRIMARY KEY NOT NULL,
  "patient_id" varchar(255) NOT NULL,
  "aligner_id" varchar(255) NOT NULL,
  "treatment_id" varchar(255),
  "phase_id" varchar(255),
  "status" varchar(20) DEFAULT 'active' NOT NULL,
  "target_percent" integer DEFAULT 80 NOT NULL,
  "target_minutes_per_day" integer DEFAULT 1320 NOT NULL,
  "adherence_percent_final" integer,
  "photo_set_done" boolean DEFAULT false NOT NULL,
  "lessons_target" integer DEFAULT 1 NOT NULL,
  "lessons_done" integer DEFAULT 0 NOT NULL,
  "reward_coins" integer DEFAULT 200 NOT NULL,
  "reward_xp" integer DEFAULT 120 NOT NULL,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Education lessons (video + quiz JSON)
CREATE TABLE IF NOT EXISTS "education_lessons" (
  "id" varchar(255) PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "video_url" text NOT NULL,
  "phase_id" varchar(255),
  "quiz" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "pass_percent" integer DEFAULT 70 NOT NULL,
  "reward_coins" integer DEFAULT 30 NOT NULL,
  "reward_xp" integer DEFAULT 20 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "patient_lesson_progress" (
  "id" varchar(255) PRIMARY KEY NOT NULL,
  "patient_id" varchar(255) NOT NULL,
  "lesson_id" varchar(255) NOT NULL,
  "status" varchar(20) DEFAULT 'not_started' NOT NULL,
  "score_percent" integer,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_attempt_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);


