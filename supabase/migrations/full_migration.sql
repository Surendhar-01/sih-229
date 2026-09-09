-- ==============================================================================
-- E-WASTE MANAGEMENT PLATFORM - FULL UNIFIED SETUP SCRIPT
-- Execute this file in your Supabase SQL Editor to initialize the database
-- ==============================================================================

\ir 01_core_schema.sql
\ir 02_auth_and_roles_triggers.sql
\ir 03_storage_buckets_and_policies.sql
\ir 04_row_level_security.sql
\ir 05_seed_data.sql
