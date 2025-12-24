CREATE TABLE IF NOT EXISTS "clinic_story_options" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"clinic_id" varchar(255) NOT NULL,
	"template_id" varchar(100) NOT NULL,
	"created_by_user_id" varchar(255) NOT NULL,
	"name" varchar(255),
	"icon" varchar(20),
	"color" varchar(50),
	"description" text,
	"image_url" text,
	"is_active" boolean,
	"sort_order" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);





