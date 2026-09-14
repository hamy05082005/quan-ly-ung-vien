-- Add commission amount per job position for the monthly dashboard.
-- Run this in Supabase SQL Editor before using the "Ket qua" dashboard.

alter table public.recruitment_jobs
  add column if not exists commission_amount numeric
    check (commission_amount is null or commission_amount >= 0);

comment on column public.recruitment_jobs.commission_amount is
  'Commission (VND) earned when a candidate from this job passes the warranty period.';
