-- Permit signed-in users to update only their own profile, enforced by the existing RLS policy.
grant update on table public.recruitment_profiles to authenticated;
