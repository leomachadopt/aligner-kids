ALTER TABLE "patient_points" ADD COLUMN IF NOT EXISTS "coins" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_points" ADD COLUMN IF NOT EXISTS "xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_points" ADD COLUMN IF NOT EXISTS "level" integer DEFAULT 1 NOT NULL;