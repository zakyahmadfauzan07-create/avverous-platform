-- Auto-confirm email on signup so students don't need to click a verification link.
-- The handle_new_user trigger (SECURITY DEFINER) runs AFTER INSERT on auth.users,
-- so we can update the newly created row to set email_confirmed_at immediately.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-confirm the email so the user can log in right away
  UPDATE auth.users
  SET email_confirmed_at = now(),
      confirmed_at = now()
  WHERE id = new.id;

  INSERT INTO public.profiles (id, email, full_name, school)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'school', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    school = EXCLUDED.school;

  RETURN new;
END;
$$;

-- Drop and recreate the trigger to pick up the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
