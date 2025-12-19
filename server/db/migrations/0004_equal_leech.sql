CREATE TABLE IF NOT EXISTS "clinic_store_items" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"clinic_id" varchar(255) NOT NULL,
	"source_type" varchar(20) NOT NULL,
	"source_template_id" varchar(255),
	"created_by_user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"category" varchar(100) NOT NULL,
	"price_coins" integer NOT NULL,
	"required_level" integer DEFAULT 1 NOT NULL,
	"image_url" varchar(500),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parent_store_items" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"clinic_id" varchar(255) NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"created_by_user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"type" varchar(20) DEFAULT 'real' NOT NULL,
	"category" varchar(100) DEFAULT 'voucher' NOT NULL,
	"price_coins" integer NOT NULL,
	"required_level" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patient_reward_programs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"program_id" varchar(255) NOT NULL,
	"assigned_by_user_id" varchar(255),
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reward_program_items" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"program_id" varchar(255) NOT NULL,
	"clinic_store_item_id" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reward_programs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"clinic_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"age_min" integer,
	"age_max" integer,
	"created_by_user_id" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_item_templates" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"category" varchar(100) NOT NULL,
	"default_price_coins" integer NOT NULL,
	"default_required_level" integer DEFAULT 1 NOT NULL,
	"default_image_url" varchar(500),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
