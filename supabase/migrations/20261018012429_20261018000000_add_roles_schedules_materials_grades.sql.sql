/*
# Add role-based access + schedules, materials, grades

## Overview
Introduces role-based access control (student vs admin) on the existing
`profiles` table and adds three new tables that power the Student Dashboard
and Admin Panel: `schedules` (study sessions), `materials` (modules/archive),
and `grades` (admin-entered tryout scores that feed the student's rapor chart).

## 1. Modified Tables
- `profiles`
  - Adds `role` column (text, NOT NULL, default 'student').
  - Allowed values: 'student' (default for new signups) and 'admin'.
  - Existing rows backfilled to 'student'.

## 2. New Tables
- `schedules` — bimbingan/kelas sesi belajar yang akan datang.
  - `id` uuid PK
  - `title` text NOT NULL — judul sesi
  - `topic` text NOT NULL — topik/materi sesi
  - `session_date` date NOT NULL — tanggal sesi
  - `start_time` time NOT NULL — jam mulai
  - `end_time` time — jam selesai (opsional)
  - `location` text — lokasi atau link (opsional)
  - `notes` text — catatan tambahan (opsional)
  - `created_by` uuid NOT NULL DEFAULT auth.uid() — admin pembuat
  - `created_at` timestamptz DEFAULT now()
- `materials` — modul/materi belajar & pembahasan soal (arsip).
  - `id` uuid PK
  - `title` text NOT NULL
  - `category` text NOT NULL — kategori materi
  - `description` text — ringkasan singkat (opsional)
  - `content` text — kontus tertulis materi (opsional)
  - `link` text — link eksternal (opsional)
  - `created_by` uuid NOT NULL DEFAULT auth.uid()
  - `created_at` timestamptz DEFAULT now()
- `grades` — nilai tryout yang diinput admin untuk siswa, memperbarui grafik rapor.
  - `id` uuid PK
  - `user_id` uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE — siswa
  - `title` text NOT NULL — nama tryout/penilaian
  - `score` integer NOT NULL — nilai (0-1000)
  - `graded_at` date NOT NULL DEFAULT CURRENT_DATE — tanggal penilaian
  - `notes` text — catatan (opsional)
  - `created_by` uuid NOT NULL DEFAULT auth.uid() — admin penginput
  - `created_at` timestamptz DEFAULT now()

## 3. Security (RLS)
- `profiles`: existing owner-scoped policies kept. New UPDATE policy restricts
  the `role` column so students CANNOT change their own role. Role changes go
  through the SECURITY DEFINER functions only.
- `schedules`, `materials`, `grades`: RLS enabled.
  - Admins (profiles.role = 'admin') get full CRUD via a helper `is_admin()`.
  - Students get SELECT only on schedules/materials (so they can see them in
    their dashboard) and SELECT only on their own grades.
  - Inserts/updates/deletes require `is_admin()`.

## 4. Helper Functions
- `public.is_admin()` — returns boolean; checks the caller's profile.role.
- `public.claim_first_admin()` — SECURITY DEFINER. If no admin exists yet,
  promotes the calling authenticated user to admin. Bootstraps the first admin.
- `public.set_user_role(target_id uuid, new_role text)` — SECURITY DEFINER.
  Only callable by an existing admin. Promotes/demotes a user. Rejects unknown
  roles.

## 5. Notes
- New signups remain 'student' automatically via the column default.
- Admins manage everything through the panel; students only see their own
  dashboard data plus shared schedules/materials.
*/

-- 1. Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';
UPDATE profiles SET role = 'student' WHERE role IS NULL OR role NOT IN ('student', 'admin');

-- 2. is_admin helper (INVOKER, uses caller's auth.uid)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. claim_first_admin — bootstrap the very first admin
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  SELECT count(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  IF admin_count = 0 THEN
    UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
  ELSE
    RAISE EXCEPTION 'An admin already exists. Ask an existing admin to promote you.';
  END IF;
END;
$$;

-- 4. set_user_role — admin-only promotion/demotion
CREATE OR REPLACE FUNCTION public.set_user_role(target_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new_role NOT IN ('student', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Use "student" or "admin".';
  END IF;
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change user roles.';
  END IF;
  UPDATE public.profiles SET role = new_role WHERE id = target_id;
END;
$$;

-- Revoke default EXECUTE from anon on these functions; keep authenticated
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO authenticated;

-- 5. profiles: tighten UPDATE so role is not client-editable. Recreate policies
--    so students can still edit their own name/school/email but NOT role.
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND (role = (SELECT role FROM profiles WHERE id = auth.uid()) OR public.is_admin())
);

-- 6. schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  topic text NOT NULL,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  location text,
  notes text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_schedules" ON schedules;
CREATE POLICY "select_schedules"
ON schedules FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_schedules_admin" ON schedules;
CREATE POLICY "insert_schedules_admin"
ON schedules FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_schedules_admin" ON schedules;
CREATE POLICY "update_schedules_admin"
ON schedules FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_schedules_admin" ON schedules;
CREATE POLICY "delete_schedules_admin"
ON schedules FOR DELETE
TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS schedules_session_date_idx ON schedules(session_date);

-- 7. materials table
CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  description text,
  content text,
  link text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_materials" ON materials;
CREATE POLICY "select_materials"
ON materials FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_materials_admin" ON materials;
CREATE POLICY "insert_materials_admin"
ON materials FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_materials_admin" ON materials;
CREATE POLICY "update_materials_admin"
ON materials FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_materials_admin" ON materials;
CREATE POLICY "delete_materials_admin"
ON materials FOR DELETE
TO authenticated USING (public.is_admin());

-- 8. grades table
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 1000),
  graded_at date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_grades" ON grades;
CREATE POLICY "select_grades"
ON grades FOR SELECT
TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_grades_admin" ON grades;
CREATE POLICY "insert_grades_admin"
ON grades FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_grades_admin" ON grades;
CREATE POLICY "update_grades_admin"
ON grades FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_grades_admin" ON grades;
CREATE POLICY "delete_grades_admin"
ON grades FOR DELETE
TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS grades_user_id_idx ON grades(user_id);
CREATE INDEX IF NOT EXISTS grades_graded_at_idx ON grades(graded_at);

-- 9. Grant table privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON materials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON grades TO authenticated;
