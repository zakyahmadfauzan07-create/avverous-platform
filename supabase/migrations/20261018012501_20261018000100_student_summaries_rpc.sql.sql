/*
# Student summaries view (for admin panel)

Adds a SECURITY DEFINER function `get_student_summaries()` that returns one
row per profile with: id, email, full_name, school, role, tryout_count
(from exam_results), grade_count (from grades), latest_score and latest_at
(most recent grade). Admin-callable only.
*/

CREATE OR REPLACE FUNCTION public.get_student_summaries()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  school text,
  role text,
  tryout_count bigint,
  grade_count bigint,
  latest_score integer,
  latest_at date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can view student summaries.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.school,
    p.role,
    COALESCE(ec.tryout_count, 0) AS tryout_count,
    COALESCE(gc.grade_count, 0) AS grade_count,
    lg.latest_score,
    lg.latest_at
  FROM public.profiles p
  LEFT JOIN (
    SELECT user_id, count(*) AS tryout_count
    FROM public.exam_results
    GROUP BY user_id
  ) ec ON ec.user_id = p.id
  LEFT JOIN (
    SELECT user_id, count(*) AS grade_count
    FROM public.grades
    GROUP BY user_id
  ) gc ON gc.user_id = p.id
  LEFT JOIN LATERAL (
    SELECT score AS latest_score, graded_at AS latest_at
    FROM public.grades
    WHERE user_id = p.id
    ORDER BY graded_at DESC, created_at DESC
    LIMIT 1
  ) lg ON true
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_student_summaries() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_summaries() TO authenticated;
