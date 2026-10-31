/*
# Server-side exam scoring RPC

## Overview
Because correctAnswer is now revoked from the authenticated role, the
client cannot grade exams. Scoring moves to a SECURITY DEFINER function
that reads the answer key server-side, compares each student answer, and
returns the per-subtest results. The student's answers are passed in;
the answer key is read from the questions table.

## Function
- `score_exam(p_package_id int, p_answers jsonb)` → jsonb
  Returns an array of { subtestId, name, total, correct, wrong, empty, score }.
*/

CREATE OR REPLACE FUNCTION public.score_exam(p_package_id int, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'subtestId', s.id,
      'name', s.name,
      'total', q_count,
      'correct', q_correct,
      'wrong', q_wrong,
      'empty', q_empty,
      'score', CASE WHEN q_count > 0 THEN round(q_correct::numeric / q_count * 1000) ELSE 0 END
    )
  ) INTO result
  FROM (
    SELECT
      s.id,
      s.name,
      count(q.id) AS q_count,
      count(CASE
        WHEN p_answers ? q.id::text
        AND trim(lower(p_answers->>q.id::text)) = trim(lower(q.correct_answer))
        THEN 1
      END) AS q_correct,
      count(CASE
        WHEN p_answers ? q.id::text
        AND p_answers->>q.id::text IS NOT NULL
        AND p_answers->>q.id::text <> ''
        AND trim(lower(p_answers->>q.id::text)) <> trim(lower(q.correct_answer))
        THEN 1
      END) AS q_wrong,
      count(CASE
        WHEN NOT (p_answers ? q.id::text)
        OR p_answers->>q.id::text IS NULL
        OR p_answers->>q.id::text = ''
        THEN 1
      END) AS q_empty
    FROM subtests s
    JOIN questions q ON q.subtest_id = s.id
    WHERE s.package_id = p_package_id
    GROUP BY s.id, s.name
  ) s;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.score_exam(int, jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.score_exam(int, jsonb) TO authenticated;
