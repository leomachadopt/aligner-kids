-- Migration: Add translations table for multi-language support
-- This enables dynamic content (missions, rewards, education, etc) to be translated

CREATE TABLE IF NOT EXISTS "translations" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"language" varchar(10) NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "translations_unique_key" UNIQUE("entity_type", "entity_id", "field_name", "language")
);

--> statement-breakpoint
-- If the table already existed without the UNIQUE constraint (older DBs), ensure a matching unique index exists.
-- This is required for the ON CONFLICT clause below to work.
CREATE UNIQUE INDEX IF NOT EXISTS "translations_unique_key_idx"
	ON "translations" ("entity_type", "entity_id", "field_name", "language");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_translations_lookup"
	ON "translations" ("entity_type", "entity_id", "language");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_translations_entity"
	ON "translations" ("entity_type", "entity_id");
--> statement-breakpoint

-- Populate initial translations for existing mission templates
-- These translations match the i18n structure we already created

-- Mission: Uso Diário Perfeito (Daily Perfect Usage)
INSERT INTO "translations" ("id", "entity_type", "entity_id", "field_name", "language", "value") VALUES
-- Portuguese (Portugal)
('trans_mission_daily_perfect_name_pt_pt', 'mission_template', 'daily-22h-usage', 'name', 'pt-PT', 'Uso Diário Perfeito'),
('trans_mission_daily_perfect_desc_pt_pt', 'mission_template', 'daily-22h-usage', 'description', 'pt-PT', 'Usa o alinhador por 22 horas ou mais hoje'),
-- English (US)
('trans_mission_daily_perfect_name_en_us', 'mission_template', 'daily-22h-usage', 'name', 'en-US', 'Daily Perfect Usage'),
('trans_mission_daily_perfect_desc_en_us', 'mission_template', 'daily-22h-usage', 'description', 'en-US', 'Wear your aligner for 22 hours or more today'),
-- Spanish (Spain)
('trans_mission_daily_perfect_name_es_es', 'mission_template', 'daily-22h-usage', 'name', 'es-ES', 'Uso Diario Perfecto'),
('trans_mission_daily_perfect_desc_es_es', 'mission_template', 'daily-22h-usage', 'description', 'es-ES', 'Usa el alineador por 22 horas o más hoy')
ON CONFLICT ("entity_type", "entity_id", "field_name", "language") DO NOTHING;

-- Mission: Semana Completa (Complete Week)
INSERT INTO "translations" ("id", "entity_type", "entity_id", "field_name", "language", "value") VALUES
-- Portuguese (Portugal)
('trans_mission_week_complete_name_pt_pt', 'mission_template', 'week-7-days', 'name', 'pt-PT', 'Semana Completa'),
('trans_mission_week_complete_desc_pt_pt', 'mission_template', 'week-7-days', 'description', 'pt-PT', 'Usa o alinhador por 22h+ durante 7 dias consecutivos'),
-- English (US)
('trans_mission_week_complete_name_en_us', 'mission_template', 'week-7-days', 'name', 'en-US', 'Complete Week'),
('trans_mission_week_complete_desc_en_us', 'mission_template', 'week-7-days', 'description', 'en-US', 'Wear your aligner for 22h+ for 7 consecutive days'),
-- Spanish (Spain)
('trans_mission_week_complete_name_es_es', 'mission_template', 'week-7-days', 'name', 'es-ES', 'Semana Completa'),
('trans_mission_week_complete_desc_es_es', 'mission_template', 'week-7-days', 'description', 'es-ES', 'Usa el alineador por 22h+ durante 7 días consecutivos')
ON CONFLICT ("entity_type", "entity_id", "field_name", "language") DO NOTHING;

-- Mission: Mês Campeão (Champion Month)
INSERT INTO "translations" ("id", "entity_type", "entity_id", "field_name", "language", "value") VALUES
-- Portuguese (Portugal)
('trans_mission_month_champion_name_pt_pt', 'mission_template', 'month-30-days', 'name', 'pt-PT', 'Mês Campeão'),
('trans_mission_month_champion_desc_pt_pt', 'mission_template', 'month-30-days', 'description', 'pt-PT', 'Completa 30 dias com 20h+ de uso do alinhador'),
-- English (US)
('trans_mission_month_champion_name_en_us', 'mission_template', 'month-30-days', 'name', 'en-US', 'Champion Month'),
('trans_mission_month_champion_desc_en_us', 'mission_template', 'month-30-days', 'description', 'en-US', 'Complete 30 days with 20h+ of aligner usage'),
-- Spanish (Spain)
('trans_mission_month_champion_name_es_es', 'mission_template', 'month-30-days', 'name', 'es-ES', 'Mes Campeón'),
('trans_mission_month_champion_desc_es_es', 'mission_template', 'month-30-days', 'description', 'es-ES', 'Completa 30 días con 20h+ de uso del alineador')
ON CONFLICT ("entity_type", "entity_id", "field_name", "language") DO NOTHING;

-- Mission: Primeira Semana (First Week Milestone)
INSERT INTO "translations" ("id", "entity_type", "entity_id", "field_name", "language", "value") VALUES
-- Portuguese (Portugal)
('trans_mission_first_week_name_pt_pt', 'mission_template', 'milestone-first-week', 'name', 'pt-PT', 'Primeira Semana'),
('trans_mission_first_week_desc_pt_pt', 'mission_template', 'milestone-first-week', 'description', 'pt-PT', 'Completa a tua primeira semana de tratamento'),
-- English (US)
('trans_mission_first_week_name_en_us', 'mission_template', 'milestone-first-week', 'name', 'en-US', 'First Week'),
('trans_mission_first_week_desc_en_us', 'mission_template', 'milestone-first-week', 'description', 'en-US', 'Complete your first week of treatment'),
-- Spanish (Spain)
('trans_mission_first_week_name_es_es', 'mission_template', 'milestone-first-week', 'name', 'es-ES', 'Primera Semana'),
('trans_mission_first_week_desc_es_es', 'mission_template', 'milestone-first-week', 'description', 'es-ES', 'Completa tu primera semana de tratamiento')
ON CONFLICT ("entity_type", "entity_id", "field_name", "language") DO NOTHING;

-- Mission: Primeiro Mês (First Month Milestone)
INSERT INTO "translations" ("id", "entity_type", "entity_id", "field_name", "language", "value") VALUES
-- Portuguese (Portugal)
('trans_mission_first_month_name_pt_pt', 'mission_template', 'milestone-first-month', 'name', 'pt-PT', 'Primeiro Mês'),
('trans_mission_first_month_desc_pt_pt', 'mission_template', 'milestone-first-month', 'description', 'pt-PT', 'Completa o teu primeiro mês de tratamento'),
-- English (US)
('trans_mission_first_month_name_en_us', 'mission_template', 'milestone-first-month', 'name', 'en-US', 'First Month'),
('trans_mission_first_month_desc_en_us', 'mission_template', 'milestone-first-month', 'description', 'en-US', 'Complete your first month of treatment'),
-- Spanish (Spain)
('trans_mission_first_month_name_es_es', 'mission_template', 'milestone-first-month', 'name', 'es-ES', 'Primer Mes'),
('trans_mission_first_month_desc_es_es', 'mission_template', 'milestone-first-month', 'description', 'es-ES', 'Completa tu primer mes de tratamiento')
ON CONFLICT ("entity_type", "entity_id", "field_name", "language") DO NOTHING;

-- Mission: Meio do Caminho (Halfway Milestone)
INSERT INTO "translations" ("id", "entity_type", "entity_id", "field_name", "language", "value") VALUES
-- Portuguese (Portugal)
('trans_mission_halfway_name_pt_pt', 'mission_template', 'milestone-halfway', 'name', 'pt-PT', 'A Meio Caminho'),
('trans_mission_halfway_desc_pt_pt', 'mission_template', 'milestone-halfway', 'description', 'pt-PT', 'Chega a metade dos teus alinhadores'),
-- English (US)
('trans_mission_halfway_name_en_us', 'mission_template', 'milestone-halfway', 'name', 'en-US', 'Halfway There'),
('trans_mission_halfway_desc_en_us', 'mission_template', 'milestone-halfway', 'description', 'en-US', 'Reach the halfway point of your aligners'),
-- Spanish (Spain)
('trans_mission_halfway_name_es_es', 'mission_template', 'milestone-halfway', 'name', 'es-ES', 'A Mitad de Camino'),
('trans_mission_halfway_desc_es_es', 'mission_template', 'milestone-halfway', 'description', 'es-ES', 'Llega a la mitad de tus alineadores')
ON CONFLICT ("entity_type", "entity_id", "field_name", "language") DO NOTHING;
