begin;
select set_config('rp_test.a',(select id::text from auth.users order by id limit 1),true),set_config('rp_test.b',(select id::text from auth.users order by id offset 1 limit 1),true),set_config('rp_test.job',gen_random_uuid()::text,true),set_config('rp_test.candidate',gen_random_uuid()::text,true);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('rp_test.a'),'role','authenticated')::text,true);
set local role authenticated;
insert into public.recruitment_jobs(id,owner_id,title) values(current_setting('rp_test.job')::uuid,auth.uid(),'RLS rollback test');
insert into public.recruitment_candidates(id,owner_id,job_id,name) values(current_setting('rp_test.candidate')::uuid,auth.uid(),current_setting('rp_test.job')::uuid,'RLS rollback candidate');
update public.recruitment_candidates set current_status='interview' where id=current_setting('rp_test.candidate')::uuid;
do $$ begin
 if not exists(select 1 from public.recruitment_candidates where id=current_setting('rp_test.candidate')::uuid and current_status='interview' and status_updated_at is not null) then raise exception 'Owner update failed'; end if;
 begin update public.recruitment_candidates set owner_id=current_setting('rp_test.b')::uuid where id=current_setting('rp_test.candidate')::uuid; raise exception 'Owner reassignment permitted'; exception when insufficient_privilege then null; end;
 begin update public.recruitment_candidates set needs_follow_up=true where id=current_setting('rp_test.candidate')::uuid; raise exception 'Follow-up spoof permitted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('rp_test.b'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare affected integer; begin
 if exists(select 1 from public.recruitment_candidates where id=current_setting('rp_test.candidate')::uuid) then raise exception 'Cross-user candidate read'; end if;
 if exists(select 1 from public.recruitment_jobs where id=current_setting('rp_test.job')::uuid) then raise exception 'Cross-user job read'; end if;
 update public.recruitment_candidates set name='intrusion' where id=current_setting('rp_test.candidate')::uuid; get diagnostics affected=row_count; if affected<>0 then raise exception 'Cross-user update'; end if;
 begin insert into public.recruitment_candidates(owner_id,job_id,name) values(auth.uid(),current_setting('rp_test.job')::uuid,'Cross-owner job'); raise exception 'Cross-owner Job accepted'; exception when foreign_key_violation then null; end;
 begin insert into public.recruitment_jobs(owner_id,title) values(current_setting('rp_test.a')::uuid,'Impersonation'); raise exception 'Cross-owner insert accepted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform * from public.recruitment_candidates; raise exception 'Anonymous read permitted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: two-user RLS, owner writes, denied cross-user reads/writes, denied cross-owner Job, protected server fields, denied anonymous access; test data rolled back' as result;
