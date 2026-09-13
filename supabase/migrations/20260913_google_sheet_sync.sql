-- Metadata imported only by the protected Google Sheets sync function.
-- Do not run this file twice on the same project.

alter table public.recruitment_candidates
  add column if not exists source_customer_interview_result text,
  add column if not exists source_start_work_status text,
  add column if not exists warranty_end_date date,
  add column if not exists warranty_status text
    check (warranty_status is null or warranty_status in ('pending', 'pass', 'fail')),
  add column if not exists source_last_synced_at timestamptz;

alter table public.recruitment_candidates
  add constraint recruitment_candidates_owner_external_key_uniq
  unique(owner_id, external_candidate_key);

comment on column public.recruitment_candidates.warranty_status is
  'pass = CTV eligible for commission; fail = candidate left before warranty period.';
