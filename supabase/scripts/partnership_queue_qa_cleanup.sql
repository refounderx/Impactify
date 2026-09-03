-- Run only after recording the QA results. Deletes every temporary entity made
-- by partnership_queue_qa.sql, including its six temporary auth users.

begin;

delete from auth.users
where raw_user_meta_data ->> 'fixture' = 'partnership_queue_qa';

delete from public.communities
where name like '[QA Partnership Queue %';

delete from public.organizations
where name like '[QA Partnership Queue %';

commit;
