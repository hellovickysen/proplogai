-- Add is_admin column to user_preferences.
-- Decouples admin access from email — only service role can promote users.

ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Trigger: silently prevent non-service-role users from setting is_admin = true.
-- Service role (webhooks, admin actions) bypasses auth.uid() — returns NULL.
-- Regular users have auth.uid() set — they get their change silently reverted.
CREATE OR REPLACE FUNCTION prevent_admin_self_promotion()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_admin = true AND (OLD.is_admin IS DISTINCT FROM true) THEN
    IF auth.uid() IS NOT NULL THEN
      -- Regular user trying to self-promote — revert silently
      NEW.is_admin := COALESCE(OLD.is_admin, false);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_admin_self_promotion_trigger ON user_preferences;
CREATE TRIGGER prevent_admin_self_promotion_trigger
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_self_promotion();

-- Also prevent INSERT with is_admin = true from non-service-role
CREATE OR REPLACE FUNCTION prevent_admin_insert_promotion()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_admin = true AND auth.uid() IS NOT NULL THEN
    NEW.is_admin := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_admin_insert_promotion_trigger ON user_preferences;
CREATE TRIGGER prevent_admin_insert_promotion_trigger
  BEFORE INSERT ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_insert_promotion();

NOTIFY pgrst, 'reload schema';
