-- Migration: Make date fields nullable for dynamic date system
-- This allows treatments and aligners to be created without fixed dates
-- Dates will be set when treatment/aligner is actually started

-- Make treatment dates nullable
ALTER TABLE treatments
  ALTER COLUMN start_date DROP NOT NULL;

-- Make aligner dates nullable
ALTER TABLE aligners
  ALTER COLUMN start_date DROP NOT NULL,
  ALTER COLUMN end_date DROP NOT NULL;

-- Make treatment_phases dates nullable (already nullable but ensuring consistency)
-- No changes needed for treatment_phases as dates are already nullable
