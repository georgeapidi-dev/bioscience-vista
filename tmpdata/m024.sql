-- Learnova · migration 024
--  · one list of schools (no more "Aga Khan" typed five ways); teachers pick their school
--  · teachers choose a course when they create a class; its Learnova lessons and quizzes are added automatically
--  · co-teachers: a class teacher can add colleagues who can only view the class, its lessons, quizzes and results
--  · only admins edit the main site; an admin can add or remove other admins
--  · quizzes belong to the classes they are set for (old DP2 links removed)
begin;

-- ───────────── 1. Schools ─────────────
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create unique index if not exists schools_name_key on public.schools (lower(regexp_replace(trim(name), '\s+', ' ', 'g')));
alter table public.profiles add column if not exists school_id uuid references public.schools(id) on delete set null;
alter table public.classes add column if not exists school_id uuid references public.schools(id) on delete set null;
alter table public.classes add column if not exists course text;   -- the Learnova course this class follows (a main class's site_slug)

alter table public.schools enable row level security;
drop policy if exists schools_read on public.schools;
create policy schools_read on public.schools for select to anon, authenticated using (true);   -- names only, for the sign-up list
drop policy if exists schools_admin on public.schools;
create policy schools_admin on public.schools for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.schools to anon, authenticated;
grant insert, update, delete on public.schools to authenticated;

-- find a school by name (ignoring case, spaces and the common "Aga Khan" spellings) or add it
create or replace function public.school_for(nm text) returns uuid
language plpgsql security definer set search_path = public as $$
declare n text := regexp_replace(trim(coalesce(nm, '')), '\s+', ' ', 'g'); sid uuid;
begin
  if char_length(n) < 2 then return null; end if;
  if n ~* '^aga ?khan' then n := 'Aga Khan Academy Mombasa'; end if;
  select id into sid from public.schools where lower(regexp_replace(trim(name), '\s+', ' ', 'g')) = lower(n);
  if sid is null then insert into public.schools (name, created_by) values (left(n, 120), auth.uid()) returning id into sid; end if;
  return sid;
end $$;
revoke all on function public.school_for(text) from public, anon, authenticated;

-- profiles and classes always carry the school's one official name
create or replace function public.tidy_school() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.school_name is not null and (tg_op = 'INSERT' or new.school_name is distinct from old.school_name or new.school_id is null) then
    new.school_id := public.school_for(new.school_name);
  end if;
  if new.school_id is not null then select name into new.school_name from public.schools where id = new.school_id; end if;
  return new;
end $$;
drop trigger if exists tidy_school on public.profiles;
create trigger tidy_school before insert or update of school_name, school_id on public.profiles for each row execute function public.tidy_school();
drop trigger if exists tidy_school on public.classes;
create trigger tidy_school before insert or update of school_name, school_id on public.classes for each row execute function public.tidy_school();

-- tidy the schools already typed in
update public.profiles set school_name = school_name where school_name is not null;
update public.classes set school_name = coalesce(school_name, (select p.school_name from public.profiles p where p.id = classes.teacher_id)) where owner_kind = 'school';

-- teacher changes their own school (their classes follow)
create or replace function public.set_my_school(nm text) returns text
language plpgsql security definer set search_path = public as $$
declare sid uuid := public.school_for(nm); s text;
begin
  if auth.uid() is null or sid is null then raise exception 'Type the name of your school.'; end if;
  update public.profiles set school_id = sid where id = auth.uid();
  update public.classes set school_id = sid where teacher_id = auth.uid() and owner_kind = 'school';
  select name into s from public.schools where id = sid; return s;
end $$;
-- admin: merge two spellings of the same school, or rename one
create or replace function public.merge_schools(src uuid, dst uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  if src = dst then return; end if;
  update public.profiles set school_id = dst where school_id = src;
  update public.classes set school_id = dst where school_id = src;
  delete from public.schools where id = src;
end $$;
revoke all on function public.set_my_school(text), public.merge_schools(uuid, uuid) from public, anon;
grant execute on function public.set_my_school(text), public.merge_schools(uuid, uuid) to authenticated;

-- ───────────── 2. Courses: classes follow a Learnova course ─────────────
create or replace function public.course_list() returns table (slug text, name text, subject text, level text, lessons int, quizzes int)
language sql stable security definer set search_path = public as $$
  select c.site_slug, regexp_replace(c.name, ' Science$', ''), c.subject, c.level,
         (select count(*)::int from public.class_materials m where m.class_id = c.id),
         (select count(*)::int from public.quiz_classes q join public.quizzes z on z.id = q.quiz_id where q.class_id = c.id and z.published)
    from public.classes c
   where c.owner_kind = 'main' and c.site_slug is not null and c.archived_at is null and not c.self_study
   order by (c.site_slug like 'grade-%') , c.subject, c.level, c.name;
$$;
revoke all on function public.course_list() from public, anon;
grant execute on function public.course_list() to authenticated;

-- copy a course's lessons and published quizzes into a class (only adds; never removes what the teacher chose)
create or replace function public.fill_from_course(cid uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c public.classes; m uuid; nl int; nq int;
begin
  select * into c from public.classes where id = cid;
  if c.id is null or c.course is null then return jsonb_build_object('lessons', 0, 'quizzes', 0); end if;
  select id into m from public.classes where site_slug = c.course and owner_kind = 'main' and not self_study;
  if m is null then return jsonb_build_object('lessons', 0, 'quizzes', 0); end if;
  insert into public.class_materials (class_id, path, sort, added_by)
    select cid, cm.path, cm.sort, auth.uid() from public.class_materials cm where cm.class_id = m on conflict do nothing;
  get diagnostics nl = row_count;
  insert into public.quiz_classes (quiz_id, class_id)
    select qc.quiz_id, cid from public.quiz_classes qc join public.quizzes q on q.id = qc.quiz_id where qc.class_id = m and q.published on conflict do nothing;
  get diagnostics nq = row_count;
  return jsonb_build_object('lessons', nl, 'quizzes', nq);
end $$;
revoke all on function public.fill_from_course(uuid) from public, anon, authenticated;

-- a teacher creates a class for a course they teach: lessons and quizzes arrive automatically
create or replace function public.create_school_class(nm text, course_slug text, descr text default null, is_listed boolean default true) returns uuid
language plpgsql security definer set search_path = public as $$
declare m public.classes; cid uuid; p public.profiles;
begin
  if not (public.is_school_teacher() and public.premium_ok()) and not public.is_admin() then raise exception 'An approved teacher account with premium is needed to create classes.'; end if;
  select * into m from public.classes where site_slug = course_slug and owner_kind = 'main' and not self_study and archived_at is null;
  if m.id is null then raise exception 'Choose the course you teach.'; end if;
  if char_length(trim(coalesce(nm, ''))) < 3 then raise exception 'Give the class a name.'; end if;
  select * into p from public.profiles where id = auth.uid();
  insert into public.classes (name, programme, teacher_id, owner_kind, school_id, school_name, subject, level, description, listed, course)
  values (left(trim(nm), 80), m.programme, auth.uid(), 'school', p.school_id, p.school_name, m.subject, m.level, left(nullif(trim(descr), ''), 160), coalesce(is_listed, true), course_slug)
  returning id into cid;
  perform public.fill_from_course(cid);
  return cid;
end $$;
-- the class teacher changes the course or pulls in newly added Learnova lessons and quizzes
create or replace function public.set_class_course(cid uuid, course_slug text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare m public.classes;
begin
  if not (public.owns_class(cid) or public.is_admin()) then raise exception 'Only the class teacher can change this.'; end if;
  if course_slug is not null then
    select * into m from public.classes where site_slug = course_slug and owner_kind = 'main' and not self_study;
    if m.id is null then raise exception 'Choose the course you teach.'; end if;
    update public.classes set course = course_slug, subject = m.subject, level = m.level where id = cid;
  end if;
  return public.fill_from_course(cid);
end $$;
revoke all on function public.create_school_class(text, text, text, boolean), public.set_class_course(uuid, text) from public, anon;
grant execute on function public.create_school_class(text, text, text, boolean), public.set_class_course(uuid, text) to authenticated;

-- existing teacher classes: match the course from what they typed, then add its lessons and quizzes
update public.classes c set course = case
    when lower(coalesce(c.subject, '') || ' ' || c.name) ~ 'chem' then case when lower(coalesce(c.level, '')) like '%sl%' then 'chem-sl' else 'chem-hl' end
    when lower(coalesce(c.subject, '') || ' ' || c.name) ~ 'phys' then case when lower(coalesce(c.level, '')) like '%sl%' then 'phys-sl' else 'phys-hl' end
    when lower(coalesce(c.subject, '') || ' ' || c.name) ~ '(ess|environment)' then case when lower(coalesce(c.level, '')) like '%sl%' then 'ess-sl' else 'ess-hl' end
    when lower(coalesce(c.subject, '') || ' ' || c.name) ~ 'bio' then case when lower(coalesce(c.level, '')) like '%sl%' then 'bio-sl' else 'bio-hl' end
    when lower(c.name) ~ 'grade ?(6|8|9|10)' then 'grade-' || substring(lower(c.name) from 'grade ?(6|8|9|10)')
    else null end
 where c.owner_kind = 'school' and c.course is null;
select public.fill_from_course(id) from public.classes where owner_kind = 'school' and course is not null;

-- ───────────── 3. Co-teachers (view only) ─────────────
create table if not exists public.class_teachers (
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  added_by uuid references auth.users(id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (class_id, teacher_id)
);
alter table public.class_teachers enable row level security;
create or replace function public.co_teaches(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.class_teachers t where t.class_id = cid and t.teacher_id = auth.uid())
     and (public.is_school_teacher() or public.has_role('teacher')) and public.premium_ok();
$$;
create or replace function public.teaches_class(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.owns_class(cid) or public.co_teaches(cid);
$$;
grant execute on function public.co_teaches(uuid), public.teaches_class(uuid) to authenticated;
drop policy if exists ct_read on public.class_teachers;
create policy ct_read on public.class_teachers for select to authenticated using (teacher_id = auth.uid() or public.owns_class(class_id) or public.is_admin());
revoke insert, update, delete on public.class_teachers from anon, authenticated;
grant select on public.class_teachers to authenticated;

drop function if exists public.add_coteacher(uuid, text);
create or replace function public.add_coteacher(cid uuid, teacher_email text) returns text
language plpgsql security definer set search_path = public as $$
declare u uuid; nm text;
begin
  if not public.owns_class(cid) then raise exception 'Only the class teacher can add colleagues.'; end if;
  select id into u from auth.users where lower(auth.users.email) = lower(trim(teacher_email));
  if u is null or not exists (select 1 from public.user_roles r where r.user_id = u and r.role in ('school_teacher', 'teacher')) then
    raise exception 'No approved teacher account uses that email. Your colleague must sign up as a teacher and be approved first.'; end if;
  if u = auth.uid() then raise exception 'You already teach this class.'; end if;
  insert into public.class_teachers (class_id, teacher_id, added_by) values (cid, u, auth.uid()) on conflict do nothing;
  select full_name into nm from public.profiles where id = u; return coalesce(nm, 'Teacher');
end $$;
create or replace function public.remove_coteacher(cid uuid, tid uuid) returns void
language sql security definer set search_path = public as $$
  delete from public.class_teachers where class_id = cid and teacher_id = tid and (public.owns_class(cid) or teacher_id = auth.uid() or public.is_admin());
$$;
create or replace function public.class_coteachers(cid uuid) returns table (teacher_id uuid, full_name text, school text)
language sql stable security definer set search_path = public as $$
  select t.teacher_id, p.full_name, p.school_name from public.class_teachers t join public.profiles p on p.id = t.teacher_id
   where t.class_id = cid and (public.teaches_class(cid) or public.is_admin()) order by p.full_name;
$$;
-- classes the signed-in teacher helps with
create or replace function public.my_cotaught() returns table (id uuid, name text, subject text, level text, school text, owner text)
language sql stable security definer set search_path = public as $$
  select c.id, c.name, c.subject, c.level, c.school_name, p.full_name from public.class_teachers t join public.classes c on c.id = t.class_id
    left join public.profiles p on p.id = c.teacher_id where t.teacher_id = auth.uid() and c.archived_at is null and public.co_teaches(c.id) order by c.name;
$$;
revoke all on function public.add_coteacher(uuid, text), public.remove_coteacher(uuid, uuid), public.class_coteachers(uuid), public.my_cotaught() from public, anon;
grant execute on function public.add_coteacher(uuid, text), public.remove_coteacher(uuid, uuid), public.class_coteachers(uuid), public.my_cotaught() to authenticated;

-- co-teachers can see (never change) the class, its students, lessons, quizzes and results
create or replace function public.in_my_school_class(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select (public.is_school_teacher() and public.premium_ok()) and exists (
    select 1 from public.enrolments e join public.classes c on c.id = e.class_id
     where e.student_id = sid and c.owner_kind = 'school' and (c.teacher_id = auth.uid() or public.co_teaches(c.id)));
$$;
drop policy if exists classes_read on public.classes;
create policy classes_read on public.classes for select to authenticated
  using (public.is_admin() or teacher_id = auth.uid() or public.co_teaches(id) or exists (select 1 from public.enrolments e where e.class_id = classes.id and e.student_id = auth.uid()));
drop policy if exists enr_read on public.enrolments;
create policy enr_read on public.enrolments for select to authenticated
  using (student_id = auth.uid() or public.is_admin() or public.teaches_class(class_id));
drop policy if exists cm_read on public.class_materials;
create policy cm_read on public.class_materials for select to authenticated
  using (public.is_staff() or public.teaches_class(class_id) or class_id = any(public.my_class_ids()));
drop policy if exists quiz_classes_read on public.quiz_classes;
create policy quiz_classes_read on public.quiz_classes for select to authenticated
  using (public.is_staff() or class_id = any(public.my_class_ids()) or public.teaches_class(class_id));
drop policy if exists attempts_school_read on public.quiz_attempts;
create policy attempts_school_read on public.quiz_attempts for select to authenticated
  using (public.in_my_school_class(student_id) and exists (
    select 1 from public.quiz_classes qc join public.enrolments e on e.class_id = qc.class_id
     where qc.quiz_id = quiz_attempts.quiz_id and public.teaches_class(qc.class_id) and e.student_id = quiz_attempts.student_id and e.status = 'approved'));
drop policy if exists lesson_work_school_read on public.lesson_work;
create policy lesson_work_school_read on public.lesson_work for select to authenticated
  using (student_id is not null and public.in_my_school_class(student_id) and exists (
    select 1 from public.class_materials cm join public.materials m on m.path = cm.path join public.enrolments e on e.class_id = cm.class_id
     where m.lesson_id = lesson_work.lesson and public.teaches_class(cm.class_id) and e.student_id = lesson_work.student_id and e.status = 'approved'));

-- ───────────── 4. Only admins edit the main site; admins can add admins ─────────────
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role('admin');
$$;
create or replace function public.is_staff_user(uid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = uid and role = 'admin');
$$;
create or replace function public.set_admin(uid uuid, make boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only an admin can change admins.'; end if;
  if make then
    insert into public.user_roles (user_id, role, granted_by) values (uid, 'admin', auth.uid()) on conflict do nothing;
  else
    if uid = auth.uid() then raise exception 'You cannot remove your own admin rights.'; end if;
    delete from public.user_roles where user_id = uid and role = 'admin';
  end if;
end $$;
revoke all on function public.set_admin(uuid, boolean) from public, anon;
grant execute on function public.set_admin(uuid, boolean) to authenticated;
-- a new admin shows as a teacher account on the Members tab
create or replace function public.admin_members() returns table (id uuid, full_name text, email text, account_type text, teacher_status text,
  premium_free boolean, premium_until timestamptz, classes text, pending int, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, u.email::text,
         case when exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'admin') then 'admin' else p.account_type end,
         p.teacher_status, p.premium_free, p.premium_until,
         (select string_agg(c.name || case when e.status = 'approved' then '' else ' (' || e.status || ')' end, ', ' order by c.name)
            from public.enrolments e join public.classes c on c.id = e.class_id where e.student_id = p.id),
         (select count(*)::int from public.enrolments e where e.student_id = p.id and e.status in ('pending', 'teacher_ok')), p.created_at
    from public.profiles p join auth.users u on u.id = p.id
   where public.is_admin()
   order by p.created_at desc;
$$;

-- the admin appears by name again (the owner asked to be credited as creator and admin)
create or replace function public.message_contacts()
returns table (id uuid, name text, role text, class_name text)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(p.full_name, ''), 'Unnamed'),
         case when exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'admin') then 'Admin'
              when exists (select 1 from public.user_roles r where r.user_id = p.id and r.role in ('teacher', 'school_teacher')) then 'Teacher'
              when exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'parent') then 'Parent'
              else 'Student' end,
         c.name
  from public.profiles p left join public.classes c on c.id = p.class_id
  where auth.uid() is not null and p.id <> auth.uid() and public.can_message(p.id)
  order by 3, 4 nulls first, 2
$$;
-- co-teachers can message the students of classes they help with
create or replace function public.can_message(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() or public.is_staff_user(rid)
      or public.in_my_school_class(rid)
      or exists (select 1 from public.enrolments e join public.classes c on c.id = e.class_id
                  where e.student_id = auth.uid() and e.status = 'approved' and c.teacher_id = rid);
$$;

-- Grade 7 (MYP 2) joins the main classes, with an independent learners class like the others
insert into public.classes (name, programme, teacher_id, owner_kind, site_slug, subject, level, listed)
  select 'Grade 7 Science', 'MYP 2', (select user_id from public.user_roles where role = 'admin' order by granted_at nulls first limit 1), 'main', 'grade-7', 'MYP Science', 'MYP 2', true
   where not exists (select 1 from public.classes where site_slug = 'grade-7');
insert into public.classes (name, programme, teacher_id, owner_kind, self_study, follows, subject, level, description, listed)
  select m.name || ' · Independent learners', m.programme, m.teacher_id, 'main', true, m.site_slug, m.subject, m.level,
         'Learn on your own at your own pace: lessons with instant feedback, quizzes and your personal learning profile.', true
    from public.classes m where m.site_slug = 'grade-7' and not exists (select 1 from public.classes x where x.self_study and x.follows = 'grade-7');

-- ───────────── 5. Quizzes belong to their classes ─────────────
delete from public.quiz_classes where class_id in (select id from public.classes where archived_at is not null);

-- class directory: one name per school
create or replace function public.class_directory() returns table (id uuid, name text, school text, subject text, level text, description text, my_status text)
language sql stable security definer set search_path = public as $$
  select c.id, c.name,
         case when c.self_study then 'Learnova · Independent learners (no teacher needed)'
              when c.owner_kind = 'main' then 'Learnova'
              else coalesce((select s.name from public.schools s where s.id = c.school_id), nullif(c.school_name, ''), (select nullif(pr.full_name, '') from public.profiles pr where pr.id = c.teacher_id), 'Independent teacher') end,
         c.subject, c.level, c.description,
         (select en.status from public.enrolments en where en.class_id = c.id and en.student_id = auth.uid())
    from public.classes c
   where auth.uid() is not null and c.active and c.archived_at is null and c.listed and c.name <> 'Staff'
   order by c.self_study, (c.owner_kind = 'school'), 3, c.name;
$$;

-- ───────────── 6. Lesson retries: the first attempt's mark stays (independent learners keep their best) ─────────────
alter table public.student_results add column if not exists attempts int not null default 1;
alter table public.student_results add column if not exists best_score numeric;
alter table public.student_results add column if not exists last_score numeric;
create or replace function public.independent_only(uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.enrolments e join public.classes c on c.id = e.class_id where e.student_id = uid and e.status = 'approved' and c.self_study)
     and not exists (select 1 from public.enrolments e join public.classes c on c.id = e.class_id where e.student_id = uid and e.status = 'approved' and not c.self_study);
$$;
grant execute on function public.independent_only(uuid) to authenticated;
drop function if exists public.record_lesson_result(text, numeric, numeric, integer);
create or replace function public.record_lesson_result(lesson_ext_id text, got numeric, out_of numeric, step integer default null, attempt integer default 1)
returns void language plpgsql security definer set search_path = public as $$
declare l public.lessons; r public.student_results; g numeric; mx numeric; ind boolean := public.independent_only(); a int := greatest(coalesce(attempt, 1), 1);
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if not public.is_approved() then raise exception 'Your account needs premium access and an approved class.'; end if;
  select * into l from public.lessons where external_id = lesson_ext_id;
  if l.id is null then raise exception 'Unknown lesson.'; end if;
  mx := coalesce(l.max_marks, out_of); g := least(got, mx);
  select * into r from public.student_results where student_id = auth.uid() and lesson_id = l.id for update;
  if r.id is null then
    insert into public.student_results (student_id, lesson_id, title, score, max_score, attempts, best_score, last_score) values (auth.uid(), l.id, l.title, g, mx, a, g, g);
  elsif coalesce(r.attempts, 1) = 1 then
    -- still the first attempt: the running total for that attempt is the mark
    update public.student_results set score = greatest(coalesce(score, 0), g), best_score = greatest(coalesce(best_score, 0), g), last_score = g, updated_at = now() where id = r.id;
  else
    -- a "try again": the first mark stays for class students; independent learners keep their best mark
    update public.student_results set last_score = g,
           best_score = greatest(coalesce(best_score, score, 0), g), score = case when ind then greatest(coalesce(score, 0), g) else score end, updated_at = now() where id = r.id;
  end if;
  insert into public.learning_progress (student_id, lesson_id, status, percent, last_step) values (auth.uid(), l.id, case when coalesce(step, 0) >= 6 then 'completed' else 'in_progress' end, least(100, round(100.0 * coalesce(step, 0) / 6)), step)
  on conflict (student_id, lesson_id) do update set last_step = greatest(coalesce(public.learning_progress.last_step, 0), coalesce(excluded.last_step, 0)),
    percent = least(100, round(100.0 * greatest(coalesce(public.learning_progress.last_step, 0), coalesce(excluded.last_step, 0)) / 6)),
    status = case when greatest(coalesce(public.learning_progress.last_step, 0), coalesce(excluded.last_step, 0)) >= 6 then 'completed' else 'in_progress' end, updated_at = now();
end $$;
revoke all on function public.record_lesson_result(text, numeric, numeric, integer, integer) from public, anon;
grant execute on function public.record_lesson_result(text, numeric, numeric, integer, integer) to authenticated;
-- "Try again": starts a new attempt on the server, so later saves never replace the first mark (except for independent learners)
create or replace function public.begin_retry(lesson_ext_id text) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.student_results r set attempts = coalesce(r.attempts, 1) + 1, last_score = 0, updated_at = now()
    from public.lessons l where l.id = r.lesson_id and l.external_id = lesson_ext_id and r.student_id = auth.uid() returning r.attempts into n;
  return coalesce(n, 1);
end $$;
revoke all on function public.begin_retry(text) from public, anon;
grant execute on function public.begin_retry(text) to authenticated;
-- a student's own lessons with marks and attempts (for "My lessons" on the dashboard)
create or replace function public.my_lessons() returns table (lesson_id uuid, external_id text, title text, url text, score numeric, max_score numeric, best_score numeric, last_score numeric, attempts int, percent int, status text, updated_at timestamptz, independent boolean)
language sql stable security definer set search_path = public as $$
  select l.id, l.external_id, l.title, l.url, r.score, r.max_score, r.best_score, r.last_score, coalesce(r.attempts, 1), coalesce(p.percent, 0)::int, coalesce(p.status, 'in_progress'), greatest(r.updated_at, p.updated_at), public.independent_only()
    from public.lessons l left join public.student_results r on r.lesson_id = l.id and r.student_id = auth.uid()
    left join public.learning_progress p on p.lesson_id = l.id and p.student_id = auth.uid()
   where auth.uid() is not null and (r.id is not null or p.lesson_id is not null)
   order by greatest(r.updated_at, p.updated_at) desc nulls last;
$$;
revoke all on function public.my_lessons() from public, anon;
grant execute on function public.my_lessons() to authenticated;

-- ───────────── 7. Reviews from real learners and teachers (shown once the admin approves them) ─────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  who text not null check (who in ('Student', 'Teacher', 'Parent', 'Independent learner')),
  display_name text not null check (char_length(display_name) between 1 and 60),
  school text,
  rating int not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 600),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
drop policy if exists reviews_public on public.reviews;
create policy reviews_public on public.reviews for select to anon using (status = 'approved');
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select to authenticated using (status = 'approved' or user_id = auth.uid() or public.is_admin());
drop policy if exists reviews_admin on public.reviews;
create policy reviews_admin on public.reviews for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists reviews_admin_del on public.reviews;
create policy reviews_admin_del on public.reviews for delete to authenticated using (public.is_admin() or user_id = auth.uid());
grant select on public.reviews to anon, authenticated;
grant update, delete on public.reviews to authenticated;
-- write or change my review; it waits for the admin again after any change
create or replace function public.submit_review(stars int, words text, show_full_name boolean default false) returns text
language plpgsql security definer set search_path = public as $$
declare p public.profiles; w text; nm text;
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  select * into p from public.profiles where id = auth.uid();
  w := case when public.is_school_teacher() or p.account_type = 'teacher' then 'Teacher' when public.has_role('parent') then 'Parent'
            when public.independent_only() then 'Independent learner' else 'Student' end;
  nm := case when show_full_name then coalesce(nullif(trim(p.full_name), ''), 'Learnova user') else split_part(coalesce(nullif(trim(p.full_name), ''), 'Learnova user'), ' ', 1) end;
  insert into public.reviews (user_id, who, display_name, school, rating, body)
  values (auth.uid(), w, left(nm, 60), p.school_name, stars, left(trim(words), 600))
  on conflict (user_id) do update set who = excluded.who, display_name = excluded.display_name, school = excluded.school, rating = excluded.rating, body = excluded.body, status = 'pending', updated_at = now();
  return 'pending';
end $$;
revoke all on function public.submit_review(int, text, boolean) from public, anon;
grant execute on function public.submit_review(int, text, boolean) to authenticated;

commit;
select 'migration 024 done' as result,
  (select string_agg(name, ' | ' order by name) from public.schools) as schools,
  (select string_agg(name || '→' || coalesce(course, '?'), ', ') from public.classes where owner_kind = 'school') as teacher_classes;
