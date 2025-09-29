-- PostgreSQL UUID Extension Fix
-- This file ensures UUID extension is enabled and fixes any UUID-related issues
-- Run this BEFORE running the main project management migration

-- ============================================================================
-- STEP 1: Enable UUID extension (required for gen_random_uuid())
-- ============================================================================

-- Enable the uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alternative: Enable pgcrypto extension (also provides gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 2: Verify UUID functions are available
-- ============================================================================

-- Test UUID generation (this should work after enabling extensions)
DO $$
BEGIN
    -- Test gen_random_uuid function
    PERFORM gen_random_uuid();
    RAISE NOTICE 'UUID generation is working correctly';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'UUID generation failed. Please ensure uuid-ossp or pgcrypto extension is installed.';
END $$;

-- ============================================================================
-- STEP 3: Drop existing tables if they have UUID issues (optional - uncomment if needed)
-- ============================================================================

-- Uncomment these lines if you need to completely recreate the tables
-- DROP TABLE IF EXISTS project_risks CASCADE;
-- DROP TABLE IF EXISTS project_status_reports CASCADE;
-- DROP TABLE IF EXISTS project_stakeholders CASCADE;
-- DROP TABLE IF EXISTS project_documents CASCADE;
-- DROP TABLE IF EXISTS project_charters CASCADE;
-- DROP TABLE IF EXISTS business_cases CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;

-- ============================================================================
-- CONFIRMATION MESSAGE
-- ============================================================================

SELECT 'PostgreSQL UUID extensions enabled successfully!' AS status,
       'You can now run the main project management migration.' AS next_step;