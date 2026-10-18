/*
# Tryout access codes (per-package token protection)

## Overview
Adds per-package access codes that students must enter before starting a
tryout. Codes are stored server-side and verified through a SECURITY DEFINER
function so students never read the codes directly.

## 1. New Tables
- `tryout_access_codes`
  - `package_id` integer PRIMARY KEY — matches the localStorage TryoutPackage.id
  - `package_name` text NOT NULL DEFAULT '' — denormalized for admin display
  - `access_code` text NOT NULL — the token (case-sensitive)
  - `updated_by` uuid DEFAULT auth.uid() — admin who last changed it
  - `updated_at` timestamptz DEFAULT now()
  - UNIQUE not needed (PK covers it)

## 2. Security (RLS)
- RLS enabled.
- Admins (profiles.role = 'admin' via is_admin()) get full CRUD.
- Students/authenticated cannot SELECT the table directly — they verify via
  the `verify_tryout_code` RPC, which returns boolean only.

## 3. Helper Functions
- `public.verify_tryout_code(p_package_id integer, p_code text)` —
  SECURITY DEFINER. Returns true if the code matches, false otherwise.
  Also returns true if no code exists for that package (open tryout),
  so packages without a code remain freely accessible.

## 4. Notes
- Codes are case-sensitive. Trim whitespace on both client and server.
- A package without a row in this table is treated as open (no code required).
*/

CREATE TABLE IF NOT EXISTS tryout_access_codes (
  package_id integer PRIMARY KEY,
  package_name text NOT NULL DEFAULT '',
  access_code text NOT NULL,
  updated_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tryout_access_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_access_codes_admin" ON tryout_access_codes;
CREATE POLICY "select_access_codes_admin"
ON tryout_access_codes FOR SELECT
TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_access_codes_admin" ON tryout_access_codes;
CREATE POLICY "insert_access_codes_admin"
ON tryout_access_codes FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_access_codes_admin" ON tryout_access_codes;
CREATE POLICY "update_access_codes_admin"
ON tryout_access_codes FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_access_codes_admin" ON tryout_access_codes;
CREATE POLICY "delete_access_codes_admin"
ON tryout_access_codes FOR DELETE
TO authenticated USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON tryout_access_codes TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_tryout_code(p_package_id integer, p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored text;
BEGIN
  SELECT access_code INTO stored FROM public.tryout_access_codes WHERE package_id = p_package_id;
  -- No row = open tryout, no code required
  IF stored IS NULL THEN
    RETURN true;
  END IF;
  RETURN btrim(stored) = btrim(p_code);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_tryout_code(integer, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_tryout_code(integer, text) TO authenticated;
