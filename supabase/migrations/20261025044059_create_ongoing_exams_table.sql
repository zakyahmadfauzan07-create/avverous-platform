/*
# Create ongoing_exams table for auto-save of tryout progress

1. Purpose
- Menyimpan progres tryout siswa yang sedang berjalan (auto-save) sehingga
  siswa dapat melanjutkan tryout dari perangkat/browser mana saja atau
  setelah halaman ditutup, tanpa kehilangan jawaban dan sisa waktu.

2. New Tables
- `ongoing_exams`
  - `user_id` (uuid, NOT NULL, default auth.uid()) — terhubung ke auth.users,
    menandai pemilik sesi tryout.
  - `paket_id` (text, NOT NULL) — id paket tryout. Tipe text agar fleksibel
    (mendukung id numerik maupun uuid/string).
  - `subtest_id` (text, NOT NULL DEFAULT '') — id subtes yang sedang aktif
    saat auto-save terakhir dilakukan. Kosong berarti belum dipilih.
  - `answers` (jsonb, NOT NULL DEFAULT '{}'::jsonb) — menyimpan pilihan jawaban
    dan status ragu-ragu per soal. Format: { "<questionId>": { "answer": "A",
    "doubt": false }, ... }.
  - `time_remaining` (integer, NOT NULL DEFAULT 0) — sisa waktu subtes aktif
    dalam detik, diperbarui berkala oleh auto-save.
  - `updated_at` (timestamptz, NOT NULL DEFAULT now()) — penanda waktu
    auto-save terakhir; diperbarui otomatis lewat trigger.
  - Primary key gabungan pada (`user_id`, `paket_id`) sehingga satu siswa
    hanya memiliki satu sesi aktif per paket tryout.

3. Trigger
- `set_ongoing_exams_updated_at` — BEFORE UPDATE trigger yang memperbarui
  kolom `updated_at` ke now() secara otomatis, sehingga auto-save tidak
  perlu mengirim timestamp dari klien.

4. Security
- ENABLE ROW LEVEL SECURITY pada `ongoing_exams`.
- GRANT SELECT, INSERT, UPDATE, DELETE hanya ke `authenticated`
  (aplikasi memiliki layar masuk; tidak ada akses anon).
- Empat policy terpisah (select/insert/update/delete) dengan cek kepemilikan
  `auth.uid() = user_id`, sehingga siswa hanya bisa melihat dan mengubah
  progres tryout miliknya sendiri.
- `user_id` diberi DEFAULT auth.uid() agar insert dari klien yang tidak
  menyertakan user_id tetap memenuhi WITH CHECK policy.
*/

CREATE TABLE IF NOT EXISTS ongoing_exams (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  paket_id text NOT NULL,
  subtest_id text NOT NULL DEFAULT '',
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  time_remaining integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, paket_id)
);

ALTER TABLE ongoing_exams ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON ongoing_exams TO authenticated;

DROP POLICY IF EXISTS "select_own_ongoing_exams" ON ongoing_exams;
CREATE POLICY "select_own_ongoing_exams"
  ON ongoing_exams FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ongoing_exams" ON ongoing_exams;
CREATE POLICY "insert_own_ongoing_exams"
  ON ongoing_exams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_ongoing_exams" ON ongoing_exams;
CREATE POLICY "update_own_ongoing_exams"
  ON ongoing_exams FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ongoing_exams" ON ongoing_exams;
CREATE POLICY "delete_own_ongoing_exams"
  ON ongoing_exams FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION set_ongoing_exams_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ongoing_exams_updated_at ON ongoing_exams;
CREATE TRIGGER trg_ongoing_exams_updated_at
  BEFORE UPDATE ON ongoing_exams
  FOR EACH ROW
  EXECUTE FUNCTION set_ongoing_exams_updated_at();

CREATE INDEX IF NOT EXISTS ongoing_exams_user_id_idx ON ongoing_exams(user_id);
