-- 059 · VISA Research Hub (Phase 1 and 2): research projects for the IB Biology internal assessment, later the Extended Essay.
-- Students own their projects; the teachers of the class they choose supervise them; admins see everything. Every table has
-- Row Level Security. Raw data is kept unchanged once locked, submissions and versions are never overwritten (audit trail).
-- The assessment criteria live in research_curricula, so an admin can update them when a guide changes without a rebuild.
begin;

create table if not exists public.research_curricula (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('ia', 'ee')),
  subject text not null default 'Biology',
  title text not null,
  guide text not null,                 -- which IB publication the criteria come from
  sessions text not null,              -- which examination sessions it applies to
  word_limit int,
  rpf_limit int,
  criteria jsonb not null default '[]', -- [{key, name, max, assesses, bands:[{min,max,d:[]}], clar:[]}]
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.research_projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('ia', 'ee')),
  subject text not null default 'Biology',
  curriculum_id uuid references public.research_curricula(id),
  class_id uuid references public.classes(id) on delete set null,
  supervisor_id uuid references auth.users(id) on delete set null,
  title text not null default 'My investigation',
  rq text,
  stage text not null default 'topic',
  status text not null default 'active' check (status in ('active', 'proposal_submitted', 'proposal_approved', 'returned', 'final_submitted', 'completed', 'archived')),
  data jsonb not null default '{}',
  word_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists research_projects_student on public.research_projects(student_id);
create index if not exists research_projects_class on public.research_projects(class_id);
create index if not exists research_projects_supervisor on public.research_projects(supervisor_id);

create table if not exists public.research_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  section text not null,
  data jsonb not null,
  note text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists research_versions_project on public.research_versions(project_id, section, created_at desc);

create table if not exists public.research_datasets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  name text not null default 'Raw data',
  columns jsonb not null default '[]',   -- [{name, unit, unc, kind:'iv'|'dv'|'trial'|'note'}]
  raw jsonb not null default '[]',       -- the original rows, kept unchanged once raw_locked
  rows jsonb not null default '[]',      -- the working copy the student edits
  raw_locked boolean not null default false,
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists research_datasets_project on public.research_datasets(project_id);

create table if not exists public.research_feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  author_id uuid default auth.uid() references auth.users(id) on delete set null,
  source text not null check (source in ('teacher', 'ai')),
  criterion text,
  mark int check (mark between 0 and 8),
  stage text,
  comment text not null,
  evidence text,
  created_at timestamptz not null default now()
);
create index if not exists research_feedback_project on public.research_feedback(project_id, created_at desc);

create table if not exists public.research_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  stage text not null check (stage in ('proposal', 'draft', 'final', 'data')),
  version int not null default 1,
  file_path text,
  file_name text,
  mime text,
  size_bytes bigint,
  word_count int,
  note text,
  status text not null default 'submitted' check (status in ('submitted', 'returned', 'approved')),
  submitted_by uuid not null default auth.uid() references auth.users(id),
  submitted_at timestamptz not null default now(),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  decision_note text
);
create index if not exists research_submissions_project on public.research_submissions(project_id, submitted_at desc);

create table if not exists public.research_meetings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  kind text not null default 'supervision' check (kind in ('supervision', 'ee_initial', 'ee_interim', 'ee_viva')),
  meeting_at timestamptz,
  agenda text,
  notes text,
  student_reflection text,
  supervisor_comment text,
  actions text,
  concern boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists research_meetings_project on public.research_meetings(project_id, meeting_at);

create table if not exists public.research_milestones (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  project_id uuid references public.research_projects(id) on delete cascade,
  kind text not null default 'ia' check (kind in ('ia', 'ee')),
  stage text not null,
  title text not null,
  due_on date not null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  check (class_id is not null or project_id is not null)
);

create table if not exists public.research_ai_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.research_projects(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'ai_tool' check (kind in ('ai_tool', 'disclosure')),
  tool text not null,
  summary text,
  created_at timestamptz not null default now()
);
create index if not exists research_ai_log_project on public.research_ai_log(project_id, created_at desc);

-- who may see and who may supervise a project
create or replace function public.research_can_see(pid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.research_projects p where p.id = pid and (
    p.student_id = auth.uid() or p.supervisor_id = auth.uid() or (p.class_id is not null and public.teaches_class(p.class_id)) or public.is_admin()));
$$;
create or replace function public.research_can_supervise(pid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.research_projects p where p.id = pid and (
    p.supervisor_id = auth.uid() or (p.class_id is not null and public.teaches_class(p.class_id)) or public.is_admin()));
$$;
create or replace function public.research_owns(pid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.research_projects p where p.id = pid and p.student_id = auth.uid());
$$;

-- projects: the class must be one the student has joined (approved); the supervisor is that class's teacher;
-- only a supervisor can approve, return or complete; a student cannot move the project to another student.
create or replace function public.research_projects_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare sup boolean := (tg_op = 'UPDATE' and public.research_can_supervise(old.id)) or public.is_admin();
begin
  if tg_op = 'INSERT' then
    if new.student_id <> auth.uid() and not public.is_admin() then raise exception 'You can only start your own project.'; end if;
    new.status := 'active';
  else
    if new.student_id <> old.student_id then raise exception 'A project cannot be moved to another student.'; end if;
    new.updated_at := now();
  end if;
  if new.class_id is not null and (tg_op = 'INSERT' or new.class_id is distinct from old.class_id) then
    if not public.is_admin() and not exists (select 1 from public.enrolments e where e.class_id = new.class_id and e.student_id = new.student_id and e.status = 'approved') then
      raise exception 'Choose a class you have joined.'; end if;
    new.supervisor_id := (select teacher_id from public.classes where id = new.class_id);
  elsif tg_op = 'UPDATE' and new.supervisor_id is distinct from old.supervisor_id and not sup then
    new.supervisor_id := old.supervisor_id;
  end if;
  if tg_op = 'UPDATE' and new.status is distinct from old.status and not sup then
    if not (old.student_id = auth.uid() and new.status in ('active', 'proposal_submitted', 'final_submitted', 'archived')) then
      raise exception 'Only your supervisor can approve or return work.'; end if;
  end if;
  return new;
end $$;
drop trigger if exists research_projects_guard on public.research_projects;
create trigger research_projects_guard before insert or update on public.research_projects for each row execute function public.research_projects_guard();

-- datasets: the original raw rows cannot change after they are locked
create or replace function public.research_datasets_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    if old.raw_locked and (new.raw is distinct from old.raw or not new.raw_locked) then raise exception 'The original raw data is locked and cannot be changed. Edit the working copy instead.'; end if;
    if new.project_id <> old.project_id then raise exception 'A dataset cannot be moved.'; end if;
    new.updated_at := now();
  end if;
  return new;
end $$;
drop trigger if exists research_datasets_guard on public.research_datasets;
create trigger research_datasets_guard before update on public.research_datasets for each row execute function public.research_datasets_guard();

-- submissions: numbered per project and stage; only the supervisor decides; the file and submission time never change
create or replace function public.research_submissions_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.version := coalesce((select max(version) from public.research_submissions where project_id = new.project_id and stage = new.stage), 0) + 1;
    new.status := 'submitted'; new.submitted_at := now(); new.decided_by := null; new.decided_at := null;
    update public.research_projects set status = case when new.stage = 'proposal' then 'proposal_submitted' when new.stage = 'final' then 'final_submitted' else status end where id = new.project_id;
  else
    if (new.file_path, new.file_name, new.stage, new.version, new.submitted_at, new.submitted_by, new.project_id) is distinct from
       (old.file_path, old.file_name, old.stage, old.version, old.submitted_at, old.submitted_by, old.project_id) then raise exception 'A submission cannot be changed; submit a new version instead.'; end if;
    if new.status is distinct from old.status then
      new.decided_by := auth.uid(); new.decided_at := now();
      update public.research_projects set status = case
        when new.status = 'returned' then 'returned'
        when new.status = 'approved' and new.stage = 'proposal' then 'proposal_approved'
        when new.status = 'approved' and new.stage = 'final' then 'completed' else status end where id = new.project_id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists research_submissions_guard on public.research_submissions;
create trigger research_submissions_guard before insert or update on public.research_submissions for each row execute function public.research_submissions_guard();

alter table public.research_curricula enable row level security;
alter table public.research_projects enable row level security;
alter table public.research_versions enable row level security;
alter table public.research_datasets enable row level security;
alter table public.research_feedback enable row level security;
alter table public.research_submissions enable row level security;
alter table public.research_meetings enable row level security;
alter table public.research_milestones enable row level security;
alter table public.research_ai_log enable row level security;

drop policy if exists rc_read on public.research_curricula;   create policy rc_read on public.research_curricula for select to authenticated using (true);
drop policy if exists rc_admin on public.research_curricula;  create policy rc_admin on public.research_curricula for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists rp_read on public.research_projects;    create policy rp_read on public.research_projects for select to authenticated using (public.research_can_see(id));
drop policy if exists rp_insert on public.research_projects;  create policy rp_insert on public.research_projects for insert to authenticated with check (student_id = auth.uid());
drop policy if exists rp_update on public.research_projects;  create policy rp_update on public.research_projects for update to authenticated using (student_id = auth.uid() or public.research_can_supervise(id)) with check (true);

drop policy if exists rv_read on public.research_versions;    create policy rv_read on public.research_versions for select to authenticated using (public.research_can_see(project_id));
drop policy if exists rv_insert on public.research_versions;  create policy rv_insert on public.research_versions for insert to authenticated with check (created_by = auth.uid() and public.research_can_see(project_id));

drop policy if exists rd_read on public.research_datasets;    create policy rd_read on public.research_datasets for select to authenticated using (public.research_can_see(project_id));
drop policy if exists rd_insert on public.research_datasets;  create policy rd_insert on public.research_datasets for insert to authenticated with check (public.research_owns(project_id));
drop policy if exists rd_update on public.research_datasets;  create policy rd_update on public.research_datasets for update to authenticated using (public.research_owns(project_id)) with check (public.research_owns(project_id));

drop policy if exists rf_read on public.research_feedback;    create policy rf_read on public.research_feedback for select to authenticated using (public.research_can_see(project_id));
drop policy if exists rf_insert on public.research_feedback;  create policy rf_insert on public.research_feedback for insert to authenticated with check (source = 'teacher' and author_id = auth.uid() and public.research_can_supervise(project_id));
drop policy if exists rf_delete on public.research_feedback;  create policy rf_delete on public.research_feedback for delete to authenticated using (source = 'teacher' and author_id = auth.uid());

drop policy if exists rs_read on public.research_submissions;   create policy rs_read on public.research_submissions for select to authenticated using (public.research_can_see(project_id));
drop policy if exists rs_insert on public.research_submissions; create policy rs_insert on public.research_submissions for insert to authenticated with check (submitted_by = auth.uid() and public.research_owns(project_id));
drop policy if exists rs_update on public.research_submissions; create policy rs_update on public.research_submissions for update to authenticated using (public.research_can_supervise(project_id)) with check (public.research_can_supervise(project_id));

drop policy if exists rm_read on public.research_meetings;    create policy rm_read on public.research_meetings for select to authenticated using (public.research_can_see(project_id));
drop policy if exists rm_insert on public.research_meetings;  create policy rm_insert on public.research_meetings for insert to authenticated with check (created_by = auth.uid() and public.research_can_see(project_id));
drop policy if exists rm_update on public.research_meetings;  create policy rm_update on public.research_meetings for update to authenticated using (public.research_can_see(project_id)) with check (public.research_can_see(project_id));

drop policy if exists rms_read on public.research_milestones;  create policy rms_read on public.research_milestones for select to authenticated using (
  (project_id is not null and public.research_can_see(project_id)) or (class_id is not null and (public.teaches_class(class_id) or public.is_admin() or exists (select 1 from public.enrolments e where e.class_id = research_milestones.class_id and e.student_id = auth.uid() and e.status = 'approved'))));
drop policy if exists rms_write on public.research_milestones;  create policy rms_write on public.research_milestones for all to authenticated using (
  (class_id is not null and (public.teaches_class(class_id) or public.is_admin())) or (project_id is not null and public.research_can_supervise(project_id)))
  with check ((class_id is not null and (public.teaches_class(class_id) or public.is_admin())) or (project_id is not null and public.research_can_supervise(project_id)));

drop policy if exists ra_read on public.research_ai_log;      create policy ra_read on public.research_ai_log for select to authenticated using (user_id = auth.uid() or (project_id is not null and public.research_can_see(project_id)));
drop policy if exists ra_insert on public.research_ai_log;    create policy ra_insert on public.research_ai_log for insert to authenticated with check (user_id = auth.uid() and kind = 'disclosure' and (project_id is null or public.research_owns(project_id)));

-- private file store: <project id>/<file>; the student uploads, the student and the supervisors read
insert into storage.buckets (id, name, public, file_size_limit) values ('research-files', 'research-files', false, 26214400) on conflict (id) do nothing;
drop policy if exists research_files_read on storage.objects;
create policy research_files_read on storage.objects for select to authenticated using (bucket_id = 'research-files' and public.research_can_see(((storage.foldername(name))[1])::uuid));
drop policy if exists research_files_write on storage.objects;
create policy research_files_write on storage.objects for insert to authenticated with check (bucket_id = 'research-files' and public.research_owns(((storage.foldername(name))[1])::uuid));

-- the Biology IA criteria, word for word from the guide
insert into public.research_curricula (id, kind, subject, title, guide, sessions, word_limit, criteria, notes)
values ('6f1b6d2a-2c1e-4c8e-9a51-0b7d1a2e4c01', 'ia', 'Biology', 'Biology scientific investigation (SL and HL)',
  'IB Diploma Programme Biology guide, first assessment 2025 (published February 2023), pages 117–123', 'May and November 2027; May and November 2028',
  3000, '[{"key": "rd", "name": "Research design", "max": 6, "assesses": "This criterion assesses the extent to which the student effectively communicates the methodology (purpose and practice) used to address the research question.", "bands": [{"min": 1, "max": 2, "d": ["The research question is stated without context.", "Methodological considerations associated with collecting data relevant to the research question are stated.", "The description of the methodology for collecting or selecting data lacks the detail to allow for the investigation to be reproduced."]}, {"min": 3, "max": 4, "d": ["The research question is outlined within a broad context.", "Methodological considerations associated with collecting relevant and sufficient data to answer the research question are described.", "The description of the methodology for collecting or selecting data allows for the investigation to be reproduced with few ambiguities or omissions."]}, {"min": 5, "max": 6, "d": ["The research question is described within a specific and appropriate context.", "Methodological considerations associated with collecting relevant and sufficient data to answer the research question are explained.", "The description of the methodology for collecting or selecting data allows for the investigation to be reproduced."]}], "clar": ["A research question with context should contain reference to the dependent and independent variables or two correlated variables, include a concise description of the system in which the research question is embedded, and include background theory of direct relevance.", "Methodological considerations include: the selection of the methods for measuring the dependent and independent variables; the selection of the databases or model and the sampling of data; the decisions regarding the scope, quantity and quality of measurements (e.g. the range, interval or frequency of the independent variable, repetition and precision of measurements); the identification of control variables and the choice of method of their control; the recognition of any safety, ethical or environmental issues that needed to be taken into account.", "The description of the methodology refers to presenting sufficiently detailed information (such as specific materials used and precise procedural steps) while avoiding unnecessary or repetitive information, so that the reader may readily understand how the methodology was implemented and could in principle repeat the investigation."]}, {"key": "da", "name": "Data analysis", "max": 6, "assesses": "This criterion assesses the extent to which the student’s report provides evidence that the student has recorded, processed and presented the data in ways that are relevant to the research question.", "bands": [{"min": 1, "max": 2, "d": ["The recording and processing of the data is communicated but is neither clear nor precise.", "The recording and processing of data shows limited evidence of the consideration of uncertainties.", "Some processing of data relevant to addressing the research question is carried out but with major omissions, inaccuracies or inconsistencies."]}, {"min": 3, "max": 4, "d": ["The communication of the recording and processing of the data is either clear or precise.", "The recording and processing of data shows evidence of a consideration of uncertainties but with some significant omissions or inaccuracies.", "The processing of data relevant to addressing the research question is carried out but with some significant omissions, inaccuracies or inconsistencies."]}, {"min": 5, "max": 6, "d": ["The communication of the recording and processing of the data is both clear and precise.", "The recording and processing of data shows evidence of an appropriate consideration of uncertainties.", "The processing of data relevant to addressing the research question is carried out appropriately and accurately."]}], "clar": ["Data refers to quantitative data or a combination of both quantitative and qualitative data.", "Clear communication means that the method of processing can be understood easily. Precise communication refers to following conventions correctly, such as those relating to the annotation of graphs and tables or the use of units, decimal places and significant figures.", "Consideration of uncertainties is subject specific and further guidance is given in the Biology teacher support material.", "Major omissions, inaccuracies or inconsistencies impede the possibility of drawing a valid conclusion that addresses the research question. Significant omissions, inaccuracies or inconsistencies allow the possibility of drawing a conclusion that addresses the research question but with some limit to its validity or detail."]}, {"key": "co", "name": "Conclusion", "max": 6, "assesses": "This criterion assesses the extent to which the student successfully answers their research question with regard to their analysis and the accepted scientific context.", "bands": [{"min": 1, "max": 2, "d": ["A conclusion is stated that is relevant to the research question but is not supported by the analysis presented.", "The conclusion makes superficial comparison to the accepted scientific context."]}, {"min": 3, "max": 4, "d": ["A conclusion is described that is relevant to the research question but is not fully consistent with the analysis presented.", "A conclusion is described that makes some relevant comparison to the accepted scientific context."]}, {"min": 5, "max": 6, "d": ["A conclusion is justified that is relevant to the research question and fully consistent with the analysis presented.", "A conclusion is justified through relevant comparison to the accepted scientific context."]}], "clar": ["A conclusion that is fully consistent requires the interpretation of processed data including associated uncertainties.", "Scientific context refers to information that could come from published material (paper or online), published values, course notes, textbooks or other outside sources. The citation of published materials must be sufficiently detailed to allow these sources to be traceable."]}, {"key": "ev", "name": "Evaluation", "max": 6, "assesses": "This criterion assesses the extent to which the student’s report provides evidence of evaluation of the investigation methodology and has suggested improvements.", "bands": [{"min": 1, "max": 2, "d": ["The report states generic methodological weaknesses or limitations.", "Realistic improvements to the investigation are stated."]}, {"min": 3, "max": 4, "d": ["The report describes specific methodological weaknesses or limitations.", "Realistic improvements to the investigation that are relevant to the identified weaknesses or limitations, are described."]}, {"min": 5, "max": 6, "d": ["The report explains the relative impact of specific methodological weaknesses or limitations.", "Realistic improvements to the investigation, that are relevant to the identified weaknesses or limitations, are explained."]}], "clar": ["Generic is general to many methodologies and not specifically relevant to the methodology of the investigation being evaluated.", "Methodological refers to the overall approach to the investigation of the research question as well as procedural steps.", "Weaknesses could relate to issues regarding the control of variables, the precision of measurement or the variation in the data.", "Limitations could refer to how the conclusion is limited in scope by the range of the data collected, the confines of the system or the applicability of assumptions made."]}]'::jsonb,
  '20% of the final grade; the same requirement and criteria at SL and HL; about 10 hours; maximum 3,000 words; marked out of 24 by the teacher and moderated by the IB. Collaborative data collection in groups of up to three is allowed, but each report is individual.')
on conflict (id) do nothing;

commit;
