DO $$
BEGIN
  -- 1) Disable avatar items/templates (soft)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_items') THEN
    UPDATE store_items SET is_active = false WHERE category = 'avatar';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_item_templates') THEN
    UPDATE store_item_templates SET is_active = false WHERE category = 'avatar';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinic_store_items') THEN
    UPDATE clinic_store_items SET is_active = false WHERE category = 'avatar';
  END IF;

  -- 2) Remove equipped cosmetics (avatar slot) and any inventory entries tied to avatar rewards.
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_cosmetics') THEN
    DELETE FROM patient_cosmetics WHERE slot = 'avatar';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_inventory') THEN
    -- legacy store_items avatar
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_items') THEN
      DELETE FROM patient_inventory
      WHERE item_id IN (SELECT id FROM store_items WHERE category = 'avatar');
    END IF;

    -- v2 clinic items avatar (synthetic id: clinic:<clinic_store_items.id>)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinic_store_items') THEN
      DELETE FROM patient_inventory
      WHERE item_id LIKE 'clinic:%'
        AND split_part(item_id, ':', 2) IN (SELECT id FROM clinic_store_items WHERE category = 'avatar');
    END IF;
  END IF;
END $$;






