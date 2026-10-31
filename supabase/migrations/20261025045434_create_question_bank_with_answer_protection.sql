/*
# Create server-side question bank with answer-key protection

## Overview
Moves the tryout question bank into the database so that correctAnswer and
explanation are NEVER sent to the student's browser during an exam. The
browser talks directly to Supabase, so column-level privileges are the only
way to guarantee the answer key stays hidden until the exam is submitted.

## Tables
- `packages`  — tryout packages (id, name, description, is_active)
- `subtests`  — subtests per package (id, package_id, name, short_name, ...)
- `questions` — questions per subtest. Holds correctAnswer + explanation,
   but those columns are revoked from the student role.

## Security model
- Everyone who is signed in (authenticated) can SELECT the non-answer columns
  of packages/subtests/questions during an exam.
- `correctAnswer` and `explanation` columns on questions are NEVER selectable
  by authenticated — they are revoked. A SECURITY DEFINER RPC
  `reveal_question_solutions(p_package_id)` returns the full questions WITH
  answers/explanations, but only for subtests the caller has already
  submitted (verified via exam_results). This is the only path that exposes
  the key, and only after submit.
- Admins (profiles.role = 'admin') get full CRUD on all three tables via
  is_admin() policies, including the answer columns.

## Seed
- Seeds the default PK/PM question set that currently lives in the bundle.
*/

-- 1. packages table
CREATE TABLE IF NOT EXISTS packages (
  id integer PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_packages" ON packages;
CREATE POLICY "select_packages"
ON packages FOR SELECT
TO authenticated
USING (is_active);

DROP POLICY IF EXISTS "insert_packages_admin" ON packages;
CREATE POLICY "insert_packages_admin"
ON packages FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_packages_admin" ON packages;
CREATE POLICY "update_packages_admin"
ON packages FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_packages_admin" ON packages;
CREATE POLICY "delete_packages_admin"
ON packages FOR DELETE
TO authenticated
USING (public.is_admin());

-- 2. subtests table
CREATE TABLE IF NOT EXISTS subtests (
  id integer PRIMARY KEY,
  package_id integer NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  name text NOT NULL,
  short_name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 5,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE subtests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_subtests" ON subtests;
CREATE POLICY "select_subtests"
ON subtests FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "insert_subtests_admin" ON subtests;
CREATE POLICY "insert_subtests_admin"
ON subtests FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_subtests_admin" ON subtests;
CREATE POLICY "update_subtests_admin"
ON subtests FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_subtests_admin" ON subtests;
CREATE POLICY "delete_subtests_admin"
ON subtests FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE INDEX IF NOT EXISTS subtests_package_id_idx ON subtests(package_id);

-- 3. questions table — holds the answer key, but protected at column level
CREATE TABLE IF NOT EXISTS questions (
  id integer PRIMARY KEY,
  subtest_id integer NOT NULL REFERENCES subtests(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'multiple_choice',
  stimulus text,
  stimulus_title text,
  image text,
  question text NOT NULL,
  options jsonb,
  correct_answer text NOT NULL,
  explanation jsonb NOT NULL DEFAULT '[]',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Everyone signed in can read the question WITHOUT the answer columns.
-- Column-level privileges are checked BEFORE row policies, so revoking
-- SELECT on correct_answer/explanation hides them even though the row
-- policy allows the row.
DROP POLICY IF EXISTS "select_questions" ON questions;
CREATE POLICY "select_questions"
ON questions FOR SELECT
TO authenticated
USING (true);

-- Admin CRUD on questions (full columns including answer key)
DROP POLICY IF EXISTS "insert_questions_admin" ON questions;
CREATE POLICY "insert_questions_admin"
ON questions FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_questions_admin" ON questions;
CREATE POLICY "update_questions_admin"
ON questions FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_questions_admin" ON questions;
CREATE POLICY "delete_questions_admin"
ON questions FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE INDEX IF NOT EXISTS questions_subtest_id_idx ON questions(subtest_id);

-- 4. Column-level protection: revoke answer columns from authenticated.
--    These are the columns students must NEVER see during an exam.
--    service_role still sees everything (bypasses RLS + column grants).
REVOKE SELECT ON questions FROM authenticated;
GRANT SELECT (
  id, subtest_id, type, stimulus, stimulus_title, image, question, options, sort_order
) ON questions TO authenticated;

GRANT INSERT, UPDATE, DELETE ON questions TO authenticated;

-- Admin writes need all columns available
GRANT INSERT (id, subtest_id, type, stimulus, stimulus_title, image, question, options, correct_answer, explanation, sort_order) ON questions TO authenticated;
GRANT UPDATE (id, subtest_id, type, stimulus, stimulus_title, image, question, options, correct_answer, explanation, sort_order) ON questions TO authenticated;

-- 5. RPC to reveal solutions AFTER the student has submitted the exam.
--    Checks that an exam_results row exists for this user+package, meaning
--    the exam was officially submitted. Only then returns full questions
--    including correctAnswer + explanation.
CREATE OR REPLACE FUNCTION public.reveal_question_solutions(p_package_id integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  submitted_count integer;
  result jsonb;
BEGIN
  -- Confirm the caller has a submitted exam result for this package.
  SELECT count(*) INTO submitted_count
  FROM exam_results
  WHERE user_id = auth.uid() AND package_id = p_package_id;

  IF submitted_count = 0 THEN
    RAISE EXCEPTION 'Solutions only available after you submit the exam.';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'subtestId', q.subtest_id,
      'type', q.type,
      'question', q.question,
      'options', q.options,
      'correctAnswer', q.correct_answer,
      'explanation', q.explanation,
      'stimulus', q.stimulus,
      'stimulusTitle', q.stimulus_title
    )
  ) INTO result
  FROM questions q
  JOIN subtests s ON s.id = q.subtest_id
  WHERE s.package_id = p_package_id;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reveal_question_solutions(integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reveal_question_solutions(integer) TO authenticated;

-- 6. Seed the default question bank (matches the bundled data so existing
--    packages keep working).
INSERT INTO packages (id, name, description, is_active) VALUES
  (1, 'Paket Tryout 1', 'Paket dasar berisi subtes Pengetahuan Kuantitatif & Penalaran Matematika.', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO packages (id, name, description, is_active) VALUES
  (2, 'Paket Tryout 2', 'Paket latihan tambahan dengan kumpulan soal setara untuk memperdalam pemahaman.', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO packages (id, name, description, is_active) VALUES
  (3, 'Paket Tryout 3', 'Paket simulasi lanjutan untuk menguji kesiapan menjelang ujian sebenarnya.', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO subtests (id, package_id, name, short_name, description, duration_minutes, sort_order) VALUES
  (1, 1, 'Pengetahuan Kuantitatif', 'PK', 'Subtes yang mengukur kemampuan pemahaman dan penerapan konsep kuantitatif dasar.', 5, 0),
  (2, 1, 'Penalaran Matematika', 'PM', 'Subtes yang mengukur kemampuan penalaran untuk menyelesaikan masalah matematis.', 7, 1)
ON CONFLICT (id) DO UPDATE SET
  package_id = EXCLUDED.package_id,
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes,
  sort_order = EXCLUDED.sort_order;

-- Seed PK questions (ids 101-105)
INSERT INTO questions (id, subtest_id, type, stimulus, stimulus_title, image, question, options, correct_answer, explanation, sort_order) VALUES
  (101, 1, 'multiple_choice', NULL, NULL, NULL,
   'Sebuah toko memberi diskon 20% untuk semua barang. Sebuah sepatu dijual seharga Rp 400.000 setelah diskon. Berapakah harga awal sepatu tersebut?',
   '["Rp 480.000","Rp 500.000","Rp 520.000","Rp 560.000","Rp 600.000"]'::jsonb,
   'B',
   '[{"label":"Identifikasi data","content":"Harga setelah diskon = Rp 400.000, diskon = 20%."},{"label":"Rumus harga awal","content":"Harga awal = Harga setelah diskon ÷ (1 − persen diskon)","formula":"H_awal = 400.000 ÷ (1 − 0,20)"},{"label":"Substitusi & hitung","content":"H_awal = 400.000 ÷ 0,80 = Rp 500.000.","formula":"H_awal = 500.000"},{"label":"Kesimpulan","content":"Jawaban benar adalah B. Rp 500.000."}]'::jsonb,
   0),
  (102, 1, 'numeric', NULL, NULL, NULL,
   'Sebuah barisan aritmetika memiliki suku pertama 4 dan beda 7. Berapakah suku ke-12 dari barisan tersebut?',
   NULL,
   '81',
   '[{"label":"Diketahui","content":"a = 4, b = 7, n = 12."},{"label":"Rumus suku ke-n","content":"Suku ke-n barisan aritmetika:","formula":"U_n = a + (n − 1) × b"},{"label":"Substitusi","content":"U_12 = 4 + (12 − 1) × 7","formula":"U_12 = 4 + 11 × 7 = 4 + 77 = 81"},{"label":"Kesimpulan","content":"Suku ke-12 adalah 81."}]'::jsonb,
   1),
  (103, 1, 'multiple_choice', NULL, NULL, NULL,
   'Jika 3x + 5 = 23, maka nilai dari 5x − 4 adalah ...',
   '["21","26","31","36","41"]'::jsonb,
   'B',
   '[{"label":"Selesaikan persamaan","content":"3x + 5 = 23 → 3x = 18 → x = 6.","formula":"x = 6"},{"label":"Substitusi ke ekspresi","content":"5x − 4 = 5(6) − 4 = 30 − 4 = 26.","formula":"5x − 4 = 26"},{"label":"Kesimpulan","content":"Jawaban benar adalah B. 26."}]'::jsonb,
   2),
  (104, 1, 'multiple_choice',
   'Sebuah kebun berbentuk persegi panjang memiliki keliling 60 meter. Lebar kebun tersebut adalah 10 meter.',
   'Soal Keliling Persegi Panjang', NULL,
   'Berapakah luas kebun tersebut (dalam m²)?',
   '["150","200","250","300","400"]'::jsonb,
   'B',
   '[{"label":"Diketahui","content":"Keliling = 60 m, lebar (l) = 10 m."},{"label":"Rumus keliling","content":"Keliling = 2 × (p + l)","formula":"60 = 2 × (p + 10)"},{"label":"Cari panjang","content":"p + 10 = 30 → p = 20 m.","formula":"p = 20"},{"label":"Hitung luas","content":"Luas = p × l = 20 × 10 = 200 m².","formula":"Luas = 200 m²"},{"label":"Kesimpulan","content":"Jawaban benar adalah B. 200 m²."}]'::jsonb,
   3),
  (105, 1, 'numeric', NULL, NULL, NULL,
   'Suatu bilangan terdiri dari dua angka. Jumlah kedua angkanya adalah 9, dan jika kedua angka ditukar posisinya, bilangannya menjadi 27 lebih besar. Berapakah bilangan aslinya?',
   NULL,
   '36',
   '[{"label":"Misalkan bilangan","content":"Bilangan asli = 10a + b, bilangan terbalik = 10b + a."},{"label":"Kondisi 1 — jumlah angka","content":"a + b = 9"},{"label":"Kondisi 2 — selisih","content":"(10b + a) − (10a + b) = 27 → 9b − 9a = 27 → b − a = 3.","formula":"b − a = 3"},{"label":"Selesaikan sistem","content":"a + b = 9 dan b − a = 3 → 2b = 12 → b = 6, a = 3.","formula":"a = 3, b = 6"},{"label":"Bilangan asli","content":"10(3) + 6 = 36.","formula":"36"}]'::jsonb,
   4)
ON CONFLICT (id) DO UPDATE SET
  subtest_id = EXCLUDED.subtest_id,
  type = EXCLUDED.type,
  stimulus = EXCLUDED.stimulus,
  stimulus_title = EXCLUDED.stimulus_title,
  image = EXCLUDED.image,
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  correct_answer = EXCLUDED.correct_answer,
  explanation = EXCLUDED.explanation,
  sort_order = EXCLUDED.sort_order;

-- Seed PM questions (ids 201-205)
INSERT INTO questions (id, subtest_id, type, stimulus, stimulus_title, image, question, options, correct_answer, explanation, sort_order) VALUES
  (201, 2, 'multiple_choice',
   'Sebuah perusahaan memproduksi mainan dengan biaya tetap Rp 2.000.000 per bulan dan biaya variabel Rp 5.000 per unit. Mainan dijual seharga Rp 15.000 per unit.',
   'Analisis Titik Impas', NULL,
   'Berapa unit mainan harus terjual agar perusahaan tepat impas (tidak rugi, tidak untung)?',
   '["100 unit","150 unit","200 unit","250 unit","300 unit"]'::jsonb,
   'C',
   '[{"label":"Diketahui","content":"Biaya tetap (FC) = Rp 2.000.000, biaya variabel per unit (VC) = Rp 5.000, harga jual (P) = Rp 15.000."},{"label":"Rumus titik impas","content":"Titik impas tercapai saat total pendapatan = total biaya.","formula":"P × Q = FC + VC × Q"},{"label":"Substitusi & selesaikan","content":"15.000Q = 2.000.000 + 5.000Q → 10.000Q = 2.000.000 → Q = 200.","formula":"Q = 200 unit"},{"label":"Kesimpulan","content":"Jawaban benar adalah C. 200 unit."}]'::jsonb,
   0),
  (202, 2, 'multiple_choice', NULL, NULL, NULL,
   'Jika 4 pekerja dapat menyelesaikan sebuah proyek dalam 12 hari, berapa hari yang dibutuhkan jika ditambah 2 pekerja lagi (total 6 pekerja) dengan kecepatan kerja yang sama?',
   '["6 hari","7 hari","8 hari","9 hari","10 hari"]'::jsonb,
   'C',
   '[{"label":"Hitung total pekerjaan","content":"Total pekerjaan = pekerja × hari = 4 × 12 = 48 pekerja-hari.","formula":"W = 4 × 12 = 48"},{"label":"Bagi dengan jumlah pekerja baru","content":"Hari = 48 ÷ 6 = 8 hari.","formula":"t = 48 ÷ 6 = 8 hari"},{"label":"Kesimpulan","content":"Jawaban benar adalah C. 8 hari."}]'::jsonb,
   1),
  (203, 2, 'numeric', NULL, NULL, NULL,
   'Sebuah dadu bersisi enam dilempar dua kali. Berapa peluang (dalam bentuk pecahan sederhana p/q) bahwa kedua lemparan menghasilkan angka yang sama? Tulis jawaban sebagai nilai p+q.',
   NULL,
   '7',
   '[{"label":"Total kemungkinan","content":"Lebih dahulu, peluang kedua dadu sama = 6/36 = 1/6."},{"label":"Tentukan p dan q","content":"p = 1, q = 6 (pecahan paling sederhana).","formula":"1/6"},{"label":"Hitung p + q","content":"p + q = 1 + 6 = 7.","formula":"7"}]'::jsonb,
   2),
  (204, 2, 'multiple_choice',
   'Sebuah bak air berbentuk silinder berisi air setinggi 60 cm. Kemudian sebuah bola logam dengan jari-jari 7 cm dimasukkan ke dalam bak (sepenuhnya terendam). Jari-jari bak = 14 cm.',
   'Soal Penerapan Geometri', NULL,
   'Berapakah kenaikan tinggi air di dalam bak? (π = 22/7)',
   '["2,33 cm","3,50 cm","5,25 cm","7,00 cm","10,50 cm"]'::jsonb,
   'A',
   '[{"label":"Volume bola","content":"V_bola = (4/3)πr³ = (4/3)(22/7)(7³) = (4/3)(22/7)(343) = (4/3)(22)(49) = 4312/3 cm³.","formula":"V_bola = (4/3) × (22/7) × 343 = 4312/3 cm³"},{"label":"Kenaikan air","content":"Kenaikan = Volume bola ÷ luas alas bak = V / (πR²) = (4312/3) / ((22/7)×196) = (4312/3) / 616 = 4312 / 1848.","formula":"Δh = (4312/3) ÷ 616 = 7/3 × ..."},{"label":"Sederhanakan","content":"Δh = (4/3 × 343) / (196) = (4 × 343) / (3 × 196) = 1372 / 588 = 7/3 ≈ 2,33... ? Cek ulang: sebenarnya = 7/3 × 1 = 7/3 ≈ 2,33."},{"label":"Hitung final","content":"Δh = (4312/3) / 616 = 7/3 ≈ 2,33 cm.","formula":"Δh ≈ 2,33 cm"},{"label":"Kesimpulan","content":"Jawaban benar adalah A. 2,33 cm."}]'::jsonb,
   3),
  (205, 2, 'multiple_choice', NULL, NULL, NULL,
   'Jika log₂(x) + log₂(x − 2) = 3, maka nilai x yang memenuhi adalah ...',
   '["2","3","4","5","6"]'::jsonb,
   'C',
   '[{"label":"Sifat logaritma","content":"log₂(x) + log₂(x − 2) = log₂(x(x − 2)) = log₂(x² − 2x).","formula":"log₂(x² − 2x) = 3"},{"label":"Ubah ke bentuk eksponen","content":"x² − 2x = 2³ = 8.","formula":"x² − 2x − 8 = 0"},{"label":"Faktorkan","content":"(x − 4)(x + 2) = 0 → x = 4 atau x = −2.","formula":"x = 4 atau x = −2"},{"label":"Syarat domain","content":"log₂(x) terdefinisi jika x > 0 dan x − 2 > 0 → x > 2. Maka x = 4."},{"label":"Kesimpulan","content":"Jawaban benar adalah C. 4."}]'::jsonb,
   4)
ON CONFLICT (id) DO UPDATE SET
  subtest_id = EXCLUDED.subtest_id,
  type = EXCLUDED.type,
  stimulus = EXCLUDED.stimulus,
  stimulus_title = EXCLUDED.stimulus_title,
  image = EXCLUDED.image,
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  correct_answer = EXCLUDED.correct_answer,
  explanation = EXCLUDED.explanation,
  sort_order = EXCLUDED.sort_order;

-- Grant table privileges
GRANT SELECT ON packages TO authenticated;
GRANT INSERT, UPDATE, DELETE ON packages TO authenticated;
GRANT SELECT ON subtests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON subtests TO authenticated;
