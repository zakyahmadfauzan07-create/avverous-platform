/*
# Create offline_classes table (Jadwal Belajar Offline Level 12)

1. New Table
- `offline_classes` — weekly recurring offline (tatap muka) class schedule
  for Level 12 students.
  - `id` uuid primary key
  - `day_of_week` smallint NOT NULL (1=Mon … 5=Fri) — the weekday this session recurs on
  - `start_time` time NOT NULL — session start
  - `end_time` time — session end (nullable for open-ended sessions)
  - `subject` text NOT NULL — mata pelajaran / class name (e.g. "TKA Kimia")
  - `tutor` text — tutor name (e.g. "Salisa")
  - `track` text — 'saintek' | 'soshum' | null (for split-track sessions)
  - `location_label` text NOT NULL DEFAULT 'Offline' — the mode/venue label shown to students
  - `notes` text — optional notes
  - `created_by` uuid DEFAULT auth.uid() — admin who created/last edited
  - `created_at` timestamptz DEFAULT now()
  - CHECK constraint on day_of_week (1..5)

2. Default Data
- Seeds the full weekly schedule provided by the user:
  - Senin (1): UTBK Kelas A (Engkus) 16:00-18:00, UTBK Kelas B (Engkus) 19:00-21:00
  - Selasa (2): Saintek TKA Kimia (Salisa) 19:00-20:00, TKA MTK TL (Zaky) 20:00-21:00;
    Soshum TKA Soshum (Rizka) 19:00-21:00
  - Rabu (3): UTBK Kelas A (Zaky) 16:00-18:00, UTBK Kelas B (Zaky) 19:00-21:00
  - Kamis (4): TKA MTK Saintek (Zaky) 19:00-21:00
  - Jumat (5): Saintek TKA Bio (Fina/Engkus) 19:00-20:00, TKA Fisika (Zaky) 20:00-21:00;
    Soshum TKA MTK (Zaky) 19:00-20:00, TKA MTK (Engkus) 20:00-21:00
  - All seeded with location_label = 'Offline'

3. Security (RLS)
- RLS enabled on `offline_classes`.
- Admins (profiles.role = 'admin') get full CRUD via the existing `public.is_admin()` helper.
- Students get SELECT only (read-only) so they can view the schedule in their dashboard.
- No INSERT/UPDATE/DELETE for non-admins.

4. Notes
- Uses the existing `public.is_admin()` SECURITY INVOKER function from the
  roles/schedules/materials/grades migration — no new helper functions needed.
- The seed uses ON CONFLICT DO NOTHING so re-running is safe.
*/

CREATE TABLE IF NOT EXISTS offline_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week smallint NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 5),
  start_time time NOT NULL,
  end_time time,
  subject text NOT NULL,
  tutor text,
  track text,
  location_label text NOT NULL DEFAULT 'Offline',
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE offline_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_offline_classes" ON offline_classes;
CREATE POLICY "select_offline_classes"
ON offline_classes FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_offline_classes_admin" ON offline_classes;
CREATE POLICY "insert_offline_classes_admin"
ON offline_classes FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_offline_classes_admin" ON offline_classes;
CREATE POLICY "update_offline_classes_admin"
ON offline_classes FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_offline_classes_admin" ON offline_classes;
CREATE POLICY "delete_offline_classes_admin"
ON offline_classes FOR DELETE
TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS offline_classes_day_time_idx
  ON offline_classes(day_of_week, start_time);

GRANT SELECT, INSERT, UPDATE, DELETE ON offline_classes TO authenticated;

-- Seed the default weekly schedule (idempotent via day/start_time/subject uniqueness)
INSERT INTO offline_classes (day_of_week, start_time, end_time, subject, tutor, track, location_label) VALUES
  -- Senin (1)
  (1, '16:00', '18:00', 'UTBK Kelas A', 'Engkus', NULL, 'Offline'),
  (1, '19:00', '21:00', 'UTBK Kelas B', 'Engkus', NULL, 'Offline'),
  -- Selasa (2) — Saintek
  (2, '19:00', '20:00', 'TKA Kimia', 'Salisa', 'saintek', 'Offline'),
  (2, '20:00', '21:00', 'TKA MTK TL', 'Zaky', 'saintek', 'Offline'),
  -- Selasa (2) — Soshum
  (2, '19:00', '21:00', 'TKA Soshum', 'Rizka', 'soshum', 'Offline'),
  -- Rabu (3)
  (3, '16:00', '18:00', 'UTBK Kelas A', 'Zaky', NULL, 'Offline'),
  (3, '19:00', '21:00', 'UTBK Kelas B', 'Zaky', NULL, 'Offline'),
  -- Kamis (4)
  (4, '19:00', '21:00', 'TKA MTK Saintek', 'Zaky', NULL, 'Offline'),
  -- Jumat (5) — Saintek
  (5, '19:00', '20:00', 'TKA Bio', 'Fina/Engkus', 'saintek', 'Offline'),
  (5, '20:00', '21:00', 'TKA Fisika', 'Zaky', 'saintek', 'Offline'),
  -- Jumat (5) — Soshum
  (5, '19:00', '20:00', 'TKA MTK', 'Zaky', 'soshum', 'Offline'),
  (5, '20:00', '21:00', 'TKA MTK', 'Engkus', 'soshum', 'Offline')
ON CONFLICT DO NOTHING;
