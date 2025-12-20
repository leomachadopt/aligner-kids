CREATE TABLE IF NOT EXISTS "story_options" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"type" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(20) NOT NULL,
	"color" varchar(50) NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);



