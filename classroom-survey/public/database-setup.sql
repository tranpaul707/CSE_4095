-- Run once in a new Supabase project's SQL Editor.
begin;
create table public.surveys(id uuid primary key default gen_random_uuid(),title text not null check(length(trim(title))>0),description text not null default '',status text not null default 'draft' check(status in('draft','active','closed','archived')),public_slug text unique not null default replace(gen_random_uuid()::text,'-',''),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create unique index only_one_active_survey on public.surveys(status) where status='active';
create table public.questions(id uuid primary key default gen_random_uuid(),survey_id uuid not null references public.surveys on delete cascade,question_text text not null check(length(trim(question_text))>0),question_type text not null check(question_type in('multiple_choice','true_false')),position integer not null,created_at timestamptz not null default now());
create index questions_survey_id_idx on public.questions(survey_id);
create table public.choices(id uuid primary key default gen_random_uuid(),question_id uuid not null references public.questions on delete cascade,choice_text text not null check(length(trim(choice_text))>0),position integer not null,created_at timestamptz not null default now());
create index choices_question_id_idx on public.choices(question_id);
create table public.responses(id uuid primary key default gen_random_uuid(),survey_id uuid not null references public.surveys on delete cascade,anonymous_token text not null,submitted_at timestamptz not null default now(),unique(survey_id,anonymous_token));
create index responses_survey_id_idx on public.responses(survey_id);
create index responses_submitted_at_idx on public.responses(submitted_at);
create table public.answers(id uuid primary key default gen_random_uuid(),response_id uuid not null references public.responses on delete cascade,question_id uuid not null references public.questions on delete cascade,choice_id uuid references public.choices on delete set null,text_answer text,created_at timestamptz not null default now(),unique(response_id,question_id));
create index answers_response_id_idx on public.answers(response_id);
create index answers_question_id_idx on public.answers(question_id);
create index answers_choice_id_idx on public.answers(choice_id);
create function public.update_updated_at_column() returns trigger language plpgsql set search_path='' as $$begin new.updated_at=now();return new;end;$$;
create trigger surveys_updated_at before update on public.surveys for each row execute function public.update_updated_at_column();
alter table public.surveys enable row level security;
alter table public.questions enable row level security;
alter table public.choices enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;
-- Single instructor deployment: disable public signup. Only provisioned users are instructors.
create policy instructor_surveys on public.surveys for all to authenticated using(true) with check(true);
create policy instructor_questions on public.questions for select to authenticated using(true);
create policy instructor_choices on public.choices for select to authenticated using(true);
create policy instructor_responses on public.responses for select to authenticated using(true);
create policy instructor_answers on public.answers for select to authenticated using(true);
create policy student_surveys on public.surveys for select to anon using(status='active');
create policy student_questions on public.questions for select to anon using(exists(select 1 from public.surveys s where s.id=survey_id and s.status='active'));
create policy student_choices on public.choices for select to anon using(exists(select 1 from public.questions q join public.surveys s on s.id=q.survey_id where q.id=question_id and s.status='active'));
grant select on public.surveys,public.questions,public.choices to anon;
grant select,insert,update,delete on public.surveys to authenticated;
grant select on public.questions,public.choices,public.responses,public.answers to authenticated;
-- No anonymous table inserts or response reads; submissions go through the RPC.
revoke all on public.responses,public.answers from anon;
revoke insert,update,delete on public.questions,public.choices,public.responses,public.answers from anon,authenticated;
create function public.save_survey(p_survey jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare sid uuid:=(p_survey->>'id')::uuid; q jsonb; c jsonb; qi integer:=0; ci integer; state text;
begin
if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED';end if;
if coalesce(trim(p_survey->>'title'),'')='' or jsonb_typeof(p_survey->'questions') is distinct from 'array' or jsonb_array_length(p_survey->'questions')=0 then raise exception 'INVALID_SURVEY';end if;
select status into state from public.surveys where id=sid for update;
if found and state<>'draft' then raise exception 'ONLY_DRAFTS_CAN_BE_EDITED';end if;
insert into public.surveys(id,title,description,status,public_slug) values(sid,p_survey->>'title',coalesce(p_survey->>'description',''),'draft',coalesce(nullif(p_survey->>'public_slug',''),replace(gen_random_uuid()::text,'-',''))) on conflict(id) do update set title=excluded.title,description=excluded.description;
delete from public.questions where survey_id=sid;
for q in select value from jsonb_array_elements(p_survey->'questions') loop
if jsonb_typeof(q->'choices') is distinct from 'array' or jsonb_array_length(q->'choices')<2 then raise exception 'INVALID_CHOICES';end if;
if q->>'question_type'='true_false' and (jsonb_array_length(q->'choices')<>2 or q->'choices'->0->>'choice_text'<>'True' or q->'choices'->1->>'choice_text'<>'False') then raise exception 'INVALID_TRUE_FALSE_CHOICES';end if;
insert into public.questions(id,survey_id,question_text,question_type,position) values((q->>'id')::uuid,sid,q->>'question_text',q->>'question_type',qi);qi:=qi+1;ci:=0;
for c in select value from jsonb_array_elements(q->'choices') loop
insert into public.choices(id,question_id,choice_text,position) values((c->>'id')::uuid,(q->>'id')::uuid,c->>'choice_text',ci);ci:=ci+1;
end loop;end loop;return sid;end;$$;
create function public.activate_survey(p_survey_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.surveys;
begin
if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED';end if;
perform pg_advisory_xact_lock(4095);
select * into s from public.surveys where id=p_survey_id for update;
if not found or s.status='archived' then raise exception 'INVALID_SURVEY';end if;
if not exists(select 1 from public.questions where survey_id=s.id) or exists(select 1 from public.questions q where q.survey_id=s.id and (select count(*) from public.choices c where c.question_id=q.id)<2) then raise exception 'INVALID_SURVEY';end if;
update public.surveys set status='closed' where status='active' and id<>s.id;
update public.surveys set status='active' where id=s.id returning * into s;
return jsonb_build_object('id',s.id,'status',s.status,'public_slug',s.public_slug);end;$$;
create function public.close_survey(p_survey_id uuid) returns void language plpgsql security definer set search_path='' as $$begin
if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED';end if;
perform pg_advisory_xact_lock(4095);
update public.surveys set status='closed' where id=p_survey_id and status='active';end;$$;
create function public.submit_survey_response(p_survey_id uuid,p_anonymous_token text,p_answers jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.surveys; a jsonb; rid uuid; qid uuid; cid uuid; expected integer;
begin
-- SHARE lock makes close/activation wait for in-flight submissions to finish.
select * into s from public.surveys where id=p_survey_id for share;
if not found or s.status<>'active' then raise exception 'SURVEY_NOT_ACTIVE';end if;
if p_anonymous_token is null or length(p_anonymous_token)<16 or length(p_anonymous_token)>128 then raise exception 'INVALID_TOKEN';end if;
if exists(select 1 from public.responses where survey_id=s.id and anonymous_token=p_anonymous_token) then raise exception 'DUPLICATE_RESPONSE';end if;
select count(*) into expected from public.questions where survey_id=s.id;
if jsonb_typeof(p_answers) is distinct from 'array' then raise exception 'MISSING_REQUIRED_ANSWER';end if;
if jsonb_array_length(p_answers)<>expected or (select count(distinct value->>'question_id') from jsonb_array_elements(p_answers))<>expected then raise exception 'MISSING_REQUIRED_ANSWER';end if;
for a in select value from jsonb_array_elements(p_answers) loop
qid:=(a->>'question_id')::uuid;cid:=(a->>'choice_id')::uuid;
if not exists(select 1 from public.questions where id=qid and survey_id=s.id) then raise exception 'INVALID_QUESTION';end if;
if not exists(select 1 from public.choices where id=cid and question_id=qid) then raise exception 'INVALID_CHOICE';end if;
end loop;
insert into public.responses(survey_id,anonymous_token) values(s.id,p_anonymous_token) returning id into rid;
for a in select value from jsonb_array_elements(p_answers) loop
insert into public.answers(response_id,question_id,choice_id) values(rid,(a->>'question_id')::uuid,(a->>'choice_id')::uuid);
end loop;return jsonb_build_object('success',true,'response_id',rid);
exception when unique_violation then raise exception 'DUPLICATE_RESPONSE';end;$$;
revoke execute on function public.save_survey(jsonb),public.activate_survey(uuid),public.close_survey(uuid),public.submit_survey_response(uuid,text,jsonb) from public;
grant execute on function public.save_survey(jsonb),public.activate_survey(uuid),public.close_survey(uuid) to authenticated;
grant execute on function public.submit_survey_response(uuid,text,jsonb) to anon,authenticated;
commit;
