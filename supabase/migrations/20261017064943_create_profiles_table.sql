/*
# Create Profiles Table & Auto-Create Trigger

## Overview
Creates a `profiles` table that stores the student's full name and school
alongside their Supabase auth account, plus a trigger that auto-creates a
profile row whenever a new auth user signs up.

## 1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users on delete cascade)
  - `email` (text, not null)
  - `full_name` (text, not null) — nama lengkap siswa
  - `school` (text, not null) — asal sekolah siswa
  - `created_at` (timestamptz, default now())

## 2. Security (RLS)
- RLS enabled on `profiles`.
- SELECT/INSERT/UPDATE/DELETE: authenticated users can only access their own
  profile row (id = auth.uid()).

## 3. Trigger
- `handle_new_user` function (SECURITY DEFINER) + trigger on auth.users:
  when a new auth user is created, automatically inserts a corresponding row
  into `profiles` using metadata (full_name, school) from the sign-up payload.

## 4. Notes
- The frontend sends `full_name` and `school` in `supabase.auth.signUp({ options: { data } })`.
- The trigger reads `raw_user_meta_data->>'full_name'` and `->>'school'`.
- Idempotent: safe to re-run.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  school text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, school)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'school', '')
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
