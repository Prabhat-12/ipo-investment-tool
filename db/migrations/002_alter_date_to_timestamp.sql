-- Migration: Alter date columns to support twice-daily subscription and GMP updates
-- Paste and run this SQL in your Supabase SQL Editor

-- 1. Alter subscriptions table column type
ALTER TABLE subscriptions ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE;

-- 2. Alter gmp_history table column type
ALTER TABLE gmp_history ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE;
