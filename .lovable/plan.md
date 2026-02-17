

# Fix: Auto-Create Profile on Sign-Up

## Problem
The `handle_new_user()` function exists in the database, but the trigger `on_auth_user_created` on `auth.users` is missing. This means no profile row was created when you signed up, and it won't be created for future users either.

## Solution

### 1. Create the missing trigger via migration
Run a migration that creates the trigger on `auth.users` to fire `handle_new_user()` after each INSERT.

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 2. Backfill your existing profile
Insert a profile row for your existing user account so you can use the profile page immediately.

```sql
INSERT INTO public.profiles (user_id, display_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles);
```

### 3. Add a fallback in the Profile page
Update `useProfile.ts` to handle the case where no profile exists yet by automatically creating one (upsert), so the UI never shows a broken state even if the trigger somehow fails.

## Technical Details
- One new database migration with the trigger creation and backfill
- Small update to `src/hooks/useProfile.ts` to add a create-if-missing fallback
- No other file changes needed

