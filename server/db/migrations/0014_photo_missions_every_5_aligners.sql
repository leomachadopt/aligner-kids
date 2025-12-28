-- Set photo mission templates to every 5 aligners (global behavior)
UPDATE mission_templates
SET aligner_interval = 5,
    updated_at = now()
WHERE category = 'photos';

-- For existing patients, remove pending photo missions that are not on the 1,6,11,... schedule.
-- Keep completed missions for history/audit.
DELETE FROM patient_missions pm
USING mission_templates mt
WHERE pm.mission_template_id = mt.id
  AND mt.category = 'photos'
  AND pm.trigger_aligner_number IS NOT NULL
  AND pm.status IN ('available', 'in_progress')
  AND ((pm.trigger_aligner_number - 1) % 5) <> 0;


