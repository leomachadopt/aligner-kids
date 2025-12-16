CREATE TABLE "aligners" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"treatment_id" varchar(255),
	"phase_id" varchar(255),
	"aligner_number" integer NOT NULL,
	"aligner_number_in_phase" integer,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"actual_end_date" varchar(10),
	"status" varchar(50) DEFAULT 'upcoming' NOT NULL,
	"usage_hours" integer DEFAULT 0,
	"target_hours_per_day" integer DEFAULT 22,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinics" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"country" varchar(2) DEFAULT 'BR' NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"website" varchar(255),
	"address_city" varchar(255),
	"address_state" varchar(100),
	"primary_color" varchar(7) DEFAULT '#3B82F6',
	"timezone" varchar(100) DEFAULT 'America/Sao_Paulo',
	"gamification_config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"subscription_tier" varchar(50) DEFAULT 'basic',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clinics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"sender_id" varchar(255) NOT NULL,
	"receiver_id" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_program_templates" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"program_id" varchar(255) NOT NULL,
	"mission_template_id" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	"aligner_interval" integer DEFAULT 1 NOT NULL,
	"trigger" varchar(100),
	"trigger_aligner_number" integer,
	"trigger_days_offset" integer,
	"custom_points" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_programs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"clinic_id" varchar(255),
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_templates" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"frequency" varchar(50) NOT NULL,
	"completion_criteria" varchar(100) NOT NULL,
	"target_value" integer,
	"base_points" integer NOT NULL,
	"bonus_points" integer DEFAULT 0,
	"icon_emoji" varchar(10),
	"color" varchar(7),
	"aligner_interval" integer DEFAULT 1 NOT NULL,
	"is_active_by_default" boolean DEFAULT true,
	"requires_manual_validation" boolean DEFAULT false,
	"can_auto_activate" boolean DEFAULT true,
	"scheduled_start_date" varchar(10),
	"scheduled_end_date" varchar(10),
	"repetition_type" varchar(50),
	"repeat_on" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_missions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"mission_template_id" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"progress" integer DEFAULT 0,
	"target_value" integer NOT NULL,
	"trigger" varchar(100),
	"trigger_aligner_number" integer,
	"trigger_days_offset" integer,
	"auto_activated" boolean DEFAULT false,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"points_earned" integer DEFAULT 0,
	"custom_points" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_points" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"total_points" integer DEFAULT 0,
	"current_level" integer DEFAULT 1,
	"badges" jsonb DEFAULT '[]'::jsonb,
	"streak" integer DEFAULT 0,
	"last_activity_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patient_points_patient_id_unique" UNIQUE("patient_id")
);
--> statement-breakpoint
CREATE TABLE "progress_photos" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"treatment_id" varchar(255) NOT NULL,
	"phase_id" varchar(255),
	"aligner_number" integer,
	"photo_type" varchar(50) NOT NULL,
	"photo_url" text NOT NULL,
	"thumbnail_url" text,
	"file_name" varchar(255),
	"file_size" integer,
	"mime_type" varchar(100),
	"captured_at" timestamp NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"clinician_notes" text,
	"has_issues" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"treatment_id" varchar(255),
	"prompt_id" varchar(255),
	"preferences_snapshot" jsonb,
	"story_title" varchar(500),
	"total_chapters" integer DEFAULT 1,
	"current_chapter" integer DEFAULT 1,
	"title" varchar(500),
	"content" text,
	"word_count" integer,
	"estimated_reading_time" integer,
	"model_used" varchar(100),
	"tokens_used" integer,
	"generation_time_ms" integer,
	"liked" boolean DEFAULT false,
	"read_count" integer DEFAULT 0,
	"last_read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_chapters" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"story_id" varchar(255) NOT NULL,
	"treatment_id" varchar(255),
	"chapter_number" integer NOT NULL,
	"required_aligner_number" integer DEFAULT 1 NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"word_count" integer,
	"is_unlocked" boolean DEFAULT false NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"audio_url" varchar(500),
	"audio_generated" boolean DEFAULT false,
	"audio_duration_seconds" integer,
	"read_count" integer DEFAULT 0,
	"last_read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_preferences" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"treatment_id" varchar(255),
	"age_group" integer NOT NULL,
	"environment" varchar(100) NOT NULL,
	"main_character" varchar(100) NOT NULL,
	"main_character_name" varchar(255),
	"sidekick" varchar(100),
	"theme" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_prompts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"system_prompt" text NOT NULL,
	"user_prompt_template" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treatment_phases" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"treatment_id" varchar(255) NOT NULL,
	"phase_number" integer NOT NULL,
	"phase_name" varchar(255) NOT NULL,
	"description" text,
	"start_aligner_number" integer NOT NULL,
	"end_aligner_number" integer NOT NULL,
	"total_aligners" integer NOT NULL,
	"current_aligner_number" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"start_date" varchar(10),
	"expected_end_date" varchar(10),
	"actual_end_date" varchar(10),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treatments" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"name" varchar(255),
	"overall_status" varchar(50) DEFAULT 'active' NOT NULL,
	"total_phases_planned" integer DEFAULT 1 NOT NULL,
	"current_phase_number" integer DEFAULT 1 NOT NULL,
	"total_aligners_overall" integer DEFAULT 20 NOT NULL,
	"current_aligner_overall" integer DEFAULT 1 NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"expected_end_date" varchar(10),
	"current_aligner_number" integer DEFAULT 1,
	"total_aligners" integer,
	"status" varchar(50) DEFAULT 'active',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(50) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"cpf" varchar(20),
	"birth_date" varchar(10),
	"phone" varchar(50),
	"preferred_language" varchar(10) DEFAULT 'pt-BR',
	"guardian_name" varchar(255),
	"guardian_cpf" varchar(20),
	"guardian_phone" varchar(50),
	"cro" varchar(50),
	"clinic_name" varchar(255),
	"clinic_id" varchar(255),
	"profile_photo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
