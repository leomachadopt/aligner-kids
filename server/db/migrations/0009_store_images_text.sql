DO $$
BEGIN
  -- store_item_templates.default_image_url -> text
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'store_item_templates'
      AND column_name = 'default_image_url'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE "store_item_templates"
      ALTER COLUMN "default_image_url" TYPE text;
  END IF;

  -- clinic_store_items.image_url -> text
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'clinic_store_items'
      AND column_name = 'image_url'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE "clinic_store_items"
      ALTER COLUMN "image_url" TYPE text;
  END IF;
END $$;






