-- Allow a new signed-in user to save their verified CTV code when creating their profile.
-- The unique constraint on collaborator_code still prevents the same code from being used by another account.
drop policy if exists recruitment_profiles_insert on public.recruitment_profiles;
create policy recruitment_profiles_insert
on public.recruitment_profiles
for insert
to authenticated
with check (id = (select auth.uid()));
