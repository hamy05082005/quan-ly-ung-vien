-- Recruitment Pipeline uses additive, isolated tables in the existing project.
create table public.recruitment_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 collaborator_code text unique,
 created_at timestamptz not null default now(),
 check (collaborator_code is null or length(btrim(collaborator_code)) > 0)
);
create table public.recruitment_jobs (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(btrim(title)) between 1 and 150),
 company_name text,
 jd_url text check(jd_url is null or jd_url ~ '^https?://'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(id,owner_id)
);
create table public.recruitment_candidates (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 job_id uuid not null,
 name text not null check(length(btrim(name)) between 1 and 150),
 email text,
 phone text,
 external_candidate_key text,
 current_status text not null default 'new' check(current_status in ('new','reviewing','interview','offer','hired','rejected')),
 status_updated_at timestamptz,
 needs_follow_up boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(job_id,owner_id) references public.recruitment_jobs(id,owner_id)
);
create table public.recruitment_sync_runs (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 status text not null check(status in ('running','success','failed','partial')),
 error_message text
);
create index recruitment_jobs_owner_idx on public.recruitment_jobs(owner_id);
create index recruitment_candidates_owner_status_idx on public.recruitment_candidates(owner_id,current_status);
create index recruitment_candidates_job_owner_idx on public.recruitment_candidates(job_id,owner_id);
create index recruitment_sync_owner_idx on public.recruitment_sync_runs(owner_id,started_at desc);
alter table public.recruitment_profiles enable row level security;
alter table public.recruitment_jobs enable row level security;
alter table public.recruitment_candidates enable row level security;
alter table public.recruitment_sync_runs enable row level security;
revoke all on public.recruitment_profiles,public.recruitment_jobs,public.recruitment_candidates,public.recruitment_sync_runs from anon,authenticated;
grant select,insert on public.recruitment_profiles to authenticated;
grant update(display_name) on public.recruitment_profiles to authenticated;
grant select,insert on public.recruitment_jobs,public.recruitment_candidates to authenticated;
grant update(title,company_name,jd_url) on public.recruitment_jobs to authenticated;
grant update(name,email,phone,job_id,current_status) on public.recruitment_candidates to authenticated;
grant select on public.recruitment_sync_runs to authenticated;
create policy recruitment_profiles_select on public.recruitment_profiles for select to authenticated using (id=(select auth.uid()));
create policy recruitment_profiles_insert on public.recruitment_profiles for insert to authenticated with check (id=(select auth.uid()) and collaborator_code is null);
create policy recruitment_profiles_update on public.recruitment_profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy recruitment_jobs_select on public.recruitment_jobs for select to authenticated using(owner_id=(select auth.uid()));
create policy recruitment_jobs_insert on public.recruitment_jobs for insert to authenticated with check(owner_id=(select auth.uid()));
create policy recruitment_jobs_update on public.recruitment_jobs for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy recruitment_candidates_select on public.recruitment_candidates for select to authenticated using(owner_id=(select auth.uid()));
create policy recruitment_candidates_insert on public.recruitment_candidates for insert to authenticated with check(owner_id=(select auth.uid()) and not needs_follow_up and external_candidate_key is null);
create policy recruitment_candidates_update on public.recruitment_candidates for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy recruitment_sync_select on public.recruitment_sync_runs for select to authenticated using(owner_id=(select auth.uid()));
create function public.recruitment_touch_row() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 new.updated_at=now();
 if TG_TABLE_NAME='recruitment_candidates' then
   if TG_OP='INSERT' then new.status_updated_at=null;
   elsif new.current_status is distinct from old.current_status then new.status_updated_at=now();
   else new.status_updated_at=old.status_updated_at;
   end if;
 end if;
 return new;
end;
$$;
revoke all on function public.recruitment_touch_row() from public,anon,authenticated;
create trigger recruitment_jobs_touch before update on public.recruitment_jobs for each row execute function public.recruitment_touch_row();
create trigger recruitment_candidates_touch before insert or update on public.recruitment_candidates for each row execute function public.recruitment_touch_row();
