-- 061 · VISTA MYP Personal Project Hub: MYP Year 5 personal projects, from idea to report and exhibition.
-- Students own their projects and their process journal. Every teacher can coordinate (create cohorts, assign supervisors,
-- set deadlines). Site teachers see all projects; partner-school teachers see the projects of their own students and cohorts.
-- Admins see everything. Every table has Row Level Security. Journal edits keep a version history; report versions and
-- submissions are never overwritten. The assessment framework lives in pp_guides so the official descriptors can be
-- entered from the IB MYP Projects guide (and updated when the guide changes) without a rebuild.

create table if not exists public.pp_guides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null,                 -- which IB publication the framework comes from
  criteria jsonb not null default '[]', -- [{key, name, max, strands:[], bands:[{min,max,d:[]}]}]; bands stay empty until entered from the guide
  report jsonb not null default '{}',   -- {max_pages, sections:[{key,label,criterion}], notes:[]}
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.pp_cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year text,
  guide_id uuid references public.pp_guides(id),
  deadlines jsonb not null default '[]',  -- [{key, label, due}]
  exhibition jsonb not null default '{}', -- {date, venue, notes}
  archived boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.pp_projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cohort_id uuid references public.pp_cohorts(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  supervisor_id uuid references auth.users(id) on delete set null,
  title text not null default 'My personal project',
  stage text not null default 'intro',
  status text not null default 'active' check (status in ('active', 'proposal_submitted', 'proposal_approved', 'returned', 'final_submitted', 'completed', 'archived')),
  data jsonb not null default '{}',     -- ideas, learning goal, global context, product, success criteria, ATL plan, report sections, exhibition
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists pp_one_live_project on public.pp_projects (student_id) where status <> 'archived';
create index if not exists pp_projects_sup on public.pp_projects (supervisor_id);
create index if not exists pp_projects_cohort on public.pp_projects (cohort_id);

create table if not exists public.pp_journal (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pp_projects(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  stage text,
  kind text not null default 'reflection',
  activity text, learning text, challenges text, decisions text, next_steps text,
  atl text[] not null default '{}',
  evidence uuid[] not null default '{}',
  history jsonb not null default '[]',  -- earlier versions, oldest first
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pp_journal_project on public.pp_journal (project_id, entry_date desc);

create table if not exists public.pp_evidence (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pp_projects(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  area text not null default 'general' check (area in ('general', 'product', 'atl', 'journal', 'research', 'exhibition')),
  stage text,                           -- product development: design, prototype, test, final
  title text not null default 'Evidence',
  caption text,
  path text,                            -- object in the pp-files bucket: <project_id>/<file>
  mime text, size_bytes bigint,
  link text,                            -- or an external link (video, online design)
  created_at timestamptz not null default now()
);

create table if not exists public.pp_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pp_projects(id) on delete cascade,
  citation text not null,
  url text, kind text, notes text,
  evaluation jsonb not null default '{}', -- {relevance, authority, accuracy, purpose, currency, reliability: 1-3, comment}
  created_at timestamptz not null default now()
);

create table if not exists public.pp_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pp_projects(id) on delete cascade,
  title text not null,
  phase text not null default 'planning',
  status text not null default 'todo' check (status in ('todo', 'doing', 'done', 'attention')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  start_on date, due_on date,
  resources text,
  milestone boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pp_feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pp_projects(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  target text not null default 'project', -- project | plan | goal | criteria | journal:<id> | report | product | atl
  comment text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.pp_assessments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pp_projects(id) on delete cascade,
  assessor_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('self', 'teacher')),
  levels jsonb not null default '{}',   -- {A: 0-8, B: 0-8, C: 0-8}
  comments jsonb not null default '{}', -- {A: '', B: '', C: ''}
  evidence jsonb not null default '{}', -- {A: [refs], ...}
  updated_at timestamptz not null default now(),
  unique (project_id, assessor_id, kind)
);

create table if not exists public.pp_report_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pp_projects(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text,
  sections jsonb not null default '{}',
  words int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pp_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pp_projects(id) on delete cascade,
  student_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('proposal', 'report_draft', 'report_final', 'exhibition')),
  path text, filename text, words int, note text,
  academic_honesty boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.pp_exhibit_slots (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.pp_cohorts(id) on delete cascade,
  project_id uuid references public.pp_projects(id) on delete set null,
  starts_at timestamptz,
  place text,
  notes text
);

-- ---------- access helpers ----------
create or replace function public.pp_owns(pid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pp_projects p where p.id = pid and p.student_id = auth.uid());
$$;
-- Every teacher can coordinate: create cohorts, assign supervisors, set deadlines (pp_staff). Which projects a teacher can open:
-- site teachers and admins see all; a teacher from a partner school sees projects they supervise, of students in classes they
-- teach, or in cohorts they created (so one school's journals are not visible to another school).
create or replace function public.pp_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('teacher', 'admin', 'school_teacher'));
$$;
create or replace function public.pp_can_supervise(pid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('teacher', 'admin'))
      or exists (select 1 from public.pp_projects p where p.id = pid and (p.supervisor_id = auth.uid()
           or (p.class_id is not null and public.teaches_class(p.class_id))
           or exists (select 1 from public.pp_cohorts c where c.id = p.cohort_id and c.created_by = auth.uid())));
$$;
create or replace function public.pp_can_see(pid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select public.pp_owns(pid) or public.pp_can_supervise(pid);
$$;

-- projects: students start and edit their own; only staff assign supervisors and cohorts, approve, return or complete.
create or replace function public.pp_projects_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.student_id <> auth.uid() and not public.is_admin() then raise exception 'You can only start your own personal project.'; end if;
    if not public.pp_staff() then new.status := 'active'; new.supervisor_id := null; end if;
    return new;
  end if;
  if new.student_id <> old.student_id then raise exception 'A project cannot be moved to another student.'; end if;
  new.updated_at := now();
  if not public.pp_can_supervise(old.id) then
    if new.supervisor_id is distinct from old.supervisor_id then raise exception 'Only a coordinator can assign a supervisor.'; end if;
    if new.cohort_id is distinct from old.cohort_id and old.cohort_id is not null then raise exception 'Only a coordinator can move you to another cohort.'; end if;
    if new.status is distinct from old.status and not (
      (old.status in ('active', 'returned') and new.status = 'proposal_submitted') or
      (old.status in ('proposal_approved', 'active', 'returned') and new.status = 'final_submitted') or
      (old.status = 'proposal_submitted' and new.status = 'active')) then
      raise exception 'Only your supervisor can change the project to that status.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists pp_projects_guard on public.pp_projects;
create trigger pp_projects_guard before insert or update on public.pp_projects for each row execute function public.pp_projects_guard();

-- journal: only the student writes; each edit keeps the previous version
create or replace function public.pp_journal_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not public.pp_owns(new.project_id) then raise exception 'Only the student can write in their process journal.'; end if;
    new.author_id := auth.uid(); new.history := '[]'; return new;
  end if;
  if new.project_id <> old.project_id then raise exception 'An entry cannot be moved to another project.'; end if;
  new.history := old.history || jsonb_build_array(jsonb_build_object('at', old.updated_at, 'entry_date', old.entry_date, 'stage', old.stage, 'kind', old.kind,
    'activity', old.activity, 'learning', old.learning, 'challenges', old.challenges, 'decisions', old.decisions, 'next_steps', old.next_steps, 'atl', old.atl));
  new.updated_at := now(); new.created_at := old.created_at; new.author_id := old.author_id;
  return new;
end $$;
drop trigger if exists pp_journal_guard on public.pp_journal;
create trigger pp_journal_guard before insert or update on public.pp_journal for each row execute function public.pp_journal_guard();

-- ---------- Row Level Security ----------
alter table public.pp_guides enable row level security;
alter table public.pp_cohorts enable row level security;
alter table public.pp_projects enable row level security;
alter table public.pp_journal enable row level security;
alter table public.pp_evidence enable row level security;
alter table public.pp_sources enable row level security;
alter table public.pp_tasks enable row level security;
alter table public.pp_feedback enable row level security;
alter table public.pp_assessments enable row level security;
alter table public.pp_report_versions enable row level security;
alter table public.pp_submissions enable row level security;
alter table public.pp_exhibit_slots enable row level security;

drop policy if exists ppg_read on public.pp_guides;   create policy ppg_read on public.pp_guides for select to authenticated using (true);
drop policy if exists ppg_write on public.pp_guides;  create policy ppg_write on public.pp_guides for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists ppc_read on public.pp_cohorts;  create policy ppc_read on public.pp_cohorts for select to authenticated using (true);
drop policy if exists ppc_write on public.pp_cohorts; create policy ppc_write on public.pp_cohorts for insert to authenticated with check (public.pp_staff());
drop policy if exists ppc_edit on public.pp_cohorts;  create policy ppc_edit on public.pp_cohorts for update to authenticated using (created_by = auth.uid() or public.is_admin()) with check (created_by = auth.uid() or public.is_admin());
drop policy if exists ppc_del on public.pp_cohorts;   create policy ppc_del on public.pp_cohorts for delete to authenticated using (created_by = auth.uid() or public.is_admin());

drop policy if exists ppp_read on public.pp_projects;   create policy ppp_read on public.pp_projects for select to authenticated using (student_id = auth.uid() or public.pp_can_supervise(id));
drop policy if exists ppp_insert on public.pp_projects; create policy ppp_insert on public.pp_projects for insert to authenticated with check (student_id = auth.uid() or public.is_admin());
drop policy if exists ppp_update on public.pp_projects; create policy ppp_update on public.pp_projects for update to authenticated using (student_id = auth.uid() or public.pp_can_supervise(id)) with check (student_id = auth.uid() or public.pp_can_supervise(id));
drop policy if exists ppp_delete on public.pp_projects; create policy ppp_delete on public.pp_projects for delete to authenticated using (public.is_admin());

-- tables the student fills in and staff can read (and, for plans, staff can add to)
drop policy if exists ppj_read on public.pp_journal;  create policy ppj_read on public.pp_journal for select to authenticated using (public.pp_can_see(project_id));
drop policy if exists ppj_write on public.pp_journal; create policy ppj_write on public.pp_journal for insert to authenticated with check (public.pp_owns(project_id));
drop policy if exists ppj_upd on public.pp_journal;   create policy ppj_upd on public.pp_journal for update to authenticated using (public.pp_owns(project_id)) with check (public.pp_owns(project_id));
drop policy if exists ppj_del on public.pp_journal;   create policy ppj_del on public.pp_journal for delete to authenticated using (public.pp_owns(project_id));

drop policy if exists ppe_read on public.pp_evidence;  create policy ppe_read on public.pp_evidence for select to authenticated using (public.pp_can_see(project_id));
drop policy if exists ppe_write on public.pp_evidence; create policy ppe_write on public.pp_evidence for all to authenticated using (public.pp_owns(project_id)) with check (public.pp_owns(project_id));

drop policy if exists pps_read on public.pp_sources;  create policy pps_read on public.pp_sources for select to authenticated using (public.pp_can_see(project_id));
drop policy if exists pps_write on public.pp_sources; create policy pps_write on public.pp_sources for all to authenticated using (public.pp_owns(project_id)) with check (public.pp_owns(project_id));

drop policy if exists ppt_read on public.pp_tasks;  create policy ppt_read on public.pp_tasks for select to authenticated using (public.pp_can_see(project_id));
drop policy if exists ppt_write on public.pp_tasks; create policy ppt_write on public.pp_tasks for all to authenticated using (public.pp_owns(project_id)) with check (public.pp_owns(project_id));

drop policy if exists ppf_read on public.pp_feedback;    create policy ppf_read on public.pp_feedback for select to authenticated using (public.pp_can_see(project_id));
drop policy if exists ppf_insert on public.pp_feedback;  create policy ppf_insert on public.pp_feedback for insert to authenticated with check (public.pp_can_see(project_id) and author_id = auth.uid());
drop policy if exists ppf_update on public.pp_feedback;  create policy ppf_update on public.pp_feedback for update to authenticated using (public.pp_can_see(project_id)) with check (public.pp_can_see(project_id));
drop policy if exists ppf_delete on public.pp_feedback;  create policy ppf_delete on public.pp_feedback for delete to authenticated using (author_id = auth.uid());

-- assessment: students write only their self-assessment; teacher assessments are written by staff and readable by the student
drop policy if exists ppa_read on public.pp_assessments;  create policy ppa_read on public.pp_assessments for select to authenticated using (public.pp_can_see(project_id));
drop policy if exists ppa_write on public.pp_assessments; create policy ppa_write on public.pp_assessments for all to authenticated
  using (assessor_id = auth.uid() and ((kind = 'self' and public.pp_owns(project_id)) or (kind = 'teacher' and public.pp_can_supervise(project_id))))
  with check (assessor_id = auth.uid() and ((kind = 'self' and public.pp_owns(project_id)) or (kind = 'teacher' and public.pp_can_supervise(project_id))));

-- report versions and submissions are kept as a record: insert and read only
drop policy if exists ppr_read on public.pp_report_versions;  create policy ppr_read on public.pp_report_versions for select to authenticated using (public.pp_can_see(project_id));
drop policy if exists ppr_write on public.pp_report_versions; create policy ppr_write on public.pp_report_versions for insert to authenticated with check (public.pp_owns(project_id) and author_id = auth.uid());
drop policy if exists ppsub_read on public.pp_submissions;  create policy ppsub_read on public.pp_submissions for select to authenticated using (public.pp_can_see(project_id));
drop policy if exists ppsub_write on public.pp_submissions; create policy ppsub_write on public.pp_submissions for insert to authenticated with check (public.pp_owns(project_id) and student_id = auth.uid());

drop policy if exists ppx_read on public.pp_exhibit_slots;  create policy ppx_read on public.pp_exhibit_slots for select to authenticated using (public.pp_staff() or (project_id is not null and public.pp_owns(project_id)) or exists (select 1 from public.pp_projects p where p.student_id = auth.uid() and p.cohort_id = pp_exhibit_slots.cohort_id));
drop policy if exists ppx_write on public.pp_exhibit_slots; create policy ppx_write on public.pp_exhibit_slots for all to authenticated using (public.pp_staff() and exists (select 1 from public.pp_cohorts c where c.id = cohort_id and (c.created_by = auth.uid() or public.is_admin()))) with check (public.pp_staff() and exists (select 1 from public.pp_cohorts c where c.id = cohort_id and (c.created_by = auth.uid() or public.is_admin())));

-- ---------- private files: pp-files/<project_id>/<file> ----------
insert into storage.buckets (id, name, public, file_size_limit) values ('pp-files', 'pp-files', false, 52428800) on conflict (id) do nothing;
drop policy if exists pp_files_read on storage.objects;
create policy pp_files_read on storage.objects for select to authenticated using (bucket_id = 'pp-files' and public.pp_can_see(((storage.foldername(name))[1])::uuid));
drop policy if exists pp_files_write on storage.objects;
create policy pp_files_write on storage.objects for insert to authenticated with check (bucket_id = 'pp-files' and public.pp_owns(((storage.foldername(name))[1])::uuid));
drop policy if exists pp_files_delete on storage.objects;
create policy pp_files_delete on storage.objects for delete to authenticated using (bucket_id = 'pp-files' and public.pp_owns(((storage.foldername(name))[1])::uuid));

-- names: a student sees their supervisor's name; a supervisor sees the names of the students whose projects they can open
create or replace function public.pp_names(pids uuid[]) returns table (project_id uuid, student_name text, supervisor_name text)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(s.full_name, ''), coalesce(t.full_name, '')
  from public.pp_projects p left join public.profiles s on s.id = p.student_id left join public.profiles t on t.id = p.supervisor_id
  where p.id = any(pids) and public.pp_can_see(p.id);
$$;
-- teachers a coordinator can assign as supervisors (only for teachers)
create or replace function public.pp_teachers() returns table (id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select distinct pr.id, pr.full_name from public.user_roles r join public.profiles pr on pr.id = r.user_id
  where public.pp_staff() and r.role in ('teacher', 'admin', 'school_teacher') order by pr.full_name;
$$;
revoke all on function public.pp_names(uuid[]), public.pp_teachers() from public, anon;
grant execute on function public.pp_names(uuid[]), public.pp_teachers() to authenticated;
revoke all on function public.pp_owns(uuid), public.pp_staff(), public.pp_can_see(uuid), public.pp_can_supervise(uuid) from public, anon;
grant execute on function public.pp_owns(uuid), public.pp_staff(), public.pp_can_see(uuid), public.pp_can_supervise(uuid) to authenticated;
revoke all on function public.pp_projects_guard(), public.pp_journal_guard() from public, anon, authenticated;

-- ---------- the framework: criteria names, maxima and strands are set; the achievement-level descriptors are entered from the official IB MYP Projects guide ----------
insert into public.pp_guides (id, title, source, criteria, report) values ('7a2c3e10-61aa-4b0e-9c61-000000000061', 'MYP Personal Project', 'IB MYP Projects guide (enter the edition your school uses)',
  '[{"key":"A","name":"Planning","max":8,"strands":["Learning goal and the personal interest that led to it","Intended product and its success criteria","Plan for achieving the product"],"bands":[]},
    {"key":"B","name":"Applying skills","max":8,"strands":["How ATL skills were applied to help achieve the learning goal","How ATL skills were applied to help achieve the product"],"bands":[]},
    {"key":"C","name":"Reflecting","max":8,"strands":["Impact of the project on the student or their learning","Evaluation of the product against the success criteria"],"bands":[]}]',
  '{"max_pages":15,"sections":[{"key":"intro","label":"Introduction and personal interest","criterion":"A"},{"key":"goal","label":"Learning goal","criterion":"A"},{"key":"product","label":"Product or outcome","criterion":"A"},{"key":"context","label":"Global context","criterion":"A"},{"key":"criteria","label":"Success criteria","criterion":"A"},{"key":"plan","label":"Research and planning","criterion":"A"},{"key":"atl","label":"ATL skills","criterion":"B"},{"key":"process","label":"Development process","criterion":"B"},{"key":"evaluation","label":"Product evaluation","criterion":"C"},{"key":"reflection","label":"Reflection on learning","criterion":"C"},{"key":"evidence","label":"Supporting evidence","criterion":""},{"key":"references","label":"References","criterion":""}],"notes":["Check the page limit and format against the current IB MYP Projects guide and your school’s handbook."]}')
on conflict (id) do nothing;

