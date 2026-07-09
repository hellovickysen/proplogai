-- Migration 0035: Protect is_beta column from client-side writes
-- Only service_role (admin) can change is_beta on user_preferences.
-- Normal authenticated users silently have their is_beta change reverted.

CREATE OR REPLACE FUNCTION protect_is_beta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_beta IS DISTINCT FROM OLD.is_beta THEN
    -- current_setting('role') is 'authenticated' for normal users,
    -- 'service_role' for admin/service-role client calls.
    IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
      NEW.is_beta := OLD.is_beta;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if re-running
DROP TRIGGER IF EXISTS trg_protect_is_beta ON user_preferences;

CREATE TRIGGER trg_protect_is_beta
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION protect_is_beta();
