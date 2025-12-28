-- 1) Add columns to support parent daily check-in (no hours tracking required)
ALTER TABLE aligner_wear_daily
  ADD COLUMN IF NOT EXISTS source varchar(30) DEFAULT 'session' NOT NULL;
ALTER TABLE aligner_wear_daily
  ADD COLUMN IF NOT EXISTS reported_by_user_id varchar(255);

-- 2) Update milestone templates to be automatic via streak / progress
UPDATE mission_templates
SET completion_criteria = 'days_streak',
    requires_manual_validation = false,
    can_auto_activate = true,
    updated_at = now()
WHERE name IN ('Primeira Semana', 'Primeiro Mês');

UPDATE mission_templates
SET completion_criteria = 'percentage',
    requires_manual_validation = false,
    can_auto_activate = true,
    updated_at = now()
WHERE name = 'Meio do Caminho';

UPDATE mission_templates
SET completion_criteria = 'aligner_change_day',
    requires_manual_validation = false,
    can_auto_activate = true,
    updated_at = now()
WHERE name = 'Troca Pontual';

-- 3) Ensure these "once" missions exist exactly once per patient (keep completed, otherwise keep oldest)
WITH tmpl AS (
  SELECT id, name FROM mission_templates WHERE name IN ('Primeira Semana', 'Primeiro Mês', 'Meio do Caminho')
),
ranked AS (
  SELECT
    pm.*,
    row_number() OVER (
      PARTITION BY pm.patient_id, pm.mission_template_id
      ORDER BY (CASE WHEN pm.status = 'completed' THEN 0 ELSE 1 END), pm.created_at
    ) AS rn
  FROM patient_missions pm
  JOIN tmpl t ON t.id = pm.mission_template_id
)
DELETE FROM patient_missions pm
USING ranked r
WHERE pm.id = r.id AND r.rn > 1;

-- 4) Create missing "once" missions for all patients with active treatments
WITH active_patients AS (
  SELECT DISTINCT patient_id
  FROM treatments
  WHERE overall_status = 'active'
),
templates AS (
  SELECT id, target_value, base_points
  FROM mission_templates
  WHERE name IN ('Primeira Semana', 'Primeiro Mês', 'Meio do Caminho')
)
INSERT INTO patient_missions (
  id, patient_id, mission_template_id, status, progress, target_value,
  trigger, trigger_aligner_number, trigger_days_offset, auto_activated,
  expires_at, points_earned, custom_points, started_at, created_at, updated_at
)
SELECT
  'mission-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6),
  ap.patient_id,
  t.id,
  'available',
  0,
  COALESCE(t.target_value, 1),
  'on_treatment_start',
  NULL,
  NULL,
  true,
  NULL,
  0,
  t.base_points,
  now(),
  now(),
  now()
FROM active_patients ap
CROSS JOIN templates t
WHERE NOT EXISTS (
  SELECT 1 FROM patient_missions pm
  WHERE pm.patient_id = ap.patient_id AND pm.mission_template_id = t.id
);


