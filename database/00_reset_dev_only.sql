-- ============================================================================
-- File: database/00_reset_dev_only.sql
-- Description: DANGEROUS / DEVELOPMENT-ONLY RESET SCRIPT
-- WARNING: Executing this script drops all tables, types, and data!
-- DO NOT RUN IN PRODUCTION OR AGAINST POPULATED EVALUATION DATABASES.
-- ============================================================================

\echo 'WARNING: Dropping all Car Recommendation DBMS database tables and types...'

-- Clean up existing tables (in reverse dependency order)
DROP TABLE IF EXISTS user_search_requests CASCADE;
DROP TABLE IF EXISTS variant_features CASCADE;
DROP TABLE IF EXISTS features CASCADE;
DROP TABLE IF EXISTS customer_searches CASCADE;
DROP TABLE IF EXISTS car_variants CASCADE;
DROP TABLE IF EXISTS car_models CASCADE;
DROP TABLE IF EXISTS manufacturers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Clean up custom ENUM types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS body_type CASCADE;
DROP TYPE IF EXISTS launch_status CASCADE;
DROP TYPE IF EXISTS fuel_enum CASCADE;
DROP TYPE IF EXISTS trans_enum CASCADE;

\echo 'Reset complete. Database is clean. Run 01_schema.sql to initialize.'
