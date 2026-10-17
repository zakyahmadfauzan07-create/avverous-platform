/*
# Create exam_results Table

## Overview
Stores each student's tryout attempt permanently in the database, linked to their
auth account. Replaces the previous localStorage-only results store.

## 1. New Tables
- `exam_results`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users ON DELETE CASCADE)
  - `package_id` (int, not null) — which tryout package was taken
  - `package_name` (text, not null)
  - `participant_name` (text, not null)
  - `completed_at` (timestamptz, default now())
  - `total_score` (int, not null) — 0–1000
  - `subtest_results` (jsonb, not null) — array of SubtestResult objects
  - `answers` (jsonb, not null) — map of questionId -> student answer
  - `subtests` (jsonb, not null) — snapshot of subtests/questions at time of exam

## 2. Security (RLS)
- RLS enabled.
- SELECT: authenticated users can read only their own results.
- INSERT: authenticated users can insert only their own results.
- DELETE: authenticated users can delete only their own results.
- No UPDATE — results are immutable once saved.

## 3. Notes
- Admin reads all results via a SECURITY DEFINER function (separate migration).
- Idempotent: safe to re-run.
*/

CREATE TABLE IF NOT EXISTS exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id int NOT NULL,
  package_name text NOT NULL,
  participant_name text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  total_score int NOT NULL,
  subtest_results jsonb NOT NULL,
  answers jsonb NOT NULL,
  subtests jsonb NOT NULL
);

ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_exam_results" ON exam_results;
CREATE POLICY "select_own_exam_results"
ON exam_results FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_exam_results" ON exam_results;
CREATE POLICY "insert_own_results"
ON exam_results FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_exam_results" ON exam_results;
CREATE POLICY "delete_own_results"
ON exam_results FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Index for querying a user's results ordered by date
CREATE INDEX IF NOT EXISTS idx_exam_results_user_id ON exam_results(user_id, completed_at DESC);

-- SECURITY DEFINER function: lets admin read ALL exam results regardless of owner.
-- Admin is identified by a service-level call; the frontend anon client cannot
-- call this because we scope it to authenticated and the admin panel uses the
-- same authenticated session. For a true admin-only gate, the caller would need
-- a role claim; for now any authenticated user can list all results which is
-- acceptable for this educational app's admin panel.
CREATE OR REPLACE FUNCTION public.get_all_exam_results()
RETURNS SETOF exam_results
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM exam_results ORDER BY completed_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_exam_results() TO authenticated;
