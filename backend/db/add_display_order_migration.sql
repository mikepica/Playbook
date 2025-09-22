-- Migration script to add display_order column to existing sops table
-- Run this against your existing database if you already have SOPs stored

BEGIN;

-- Add the display_order column
ALTER TABLE sops ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Set initial display_order values based on creation date (oldest = 1, newest = highest number)
WITH ordered_sops AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_order
    FROM sops
)
UPDATE sops
SET display_order = ordered_sops.new_order
FROM ordered_sops
WHERE sops.id = ordered_sops.id;

COMMIT;