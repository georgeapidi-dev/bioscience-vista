-- Learnova · migration 022: join classes by name, several classes per student, premium access,
-- teachers from other schools with their own classes, and per-page keys so a student only opens their own classes.
-- Run 022a first (adds the school_teacher role). Safe to run more than once.

begin;

-- ───────────────────────── 1. New columns ─────────────────────────
alter table public.profiles
  add column if not exists premium_until timestamptz,                 -- paid premium ends at this time
  add column if not exists premium_free boolean not null default false, -- admin gave free access
  add column if not exists account_type text not null default 'student',
  add column if not exists school_name text,
  add column if not exists teacher_status text;                        -- pending / approved / rejected (teacher sign-ups)
do $$ begin
  alter table public.profiles add constraint profiles_account_type_chk check (account_type in ('student', 'teacher', 'parent'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_teacher_status_chk check (teacher_status is null or teacher_status in ('pending', 'approved', 'rejected'));
exception when duplicate_object then null; end $$;

alter table public.classes
  add column if not exists site_slug text,                             -- main-site class page, e.g. bio-hl
  add column if not exists owner_kind text not null default 'main',    -- main = Learnova (George); school = a teacher's own class
  add column if not exists school_name text,
  add column if not exists subject text,
  add column if not exists level text,
  add column if not exists listed boolean not null default true,       -- shown in the "join a class" list
  add column if not exists description text,
  add column if not exists self_study boolean not null default false,   -- independent learners: join without a teacher, learn at their own pace
  add column if not exists follows text;                               -- self-study class uses this main class's lessons (a site_slug)
do $$ begin
  alter table public.classes add constraint classes_owner_kind_chk check (owner_kind in ('main', 'school'));
exception when duplicate_object then null; end $$;
create unique index if not exists classes_site_slug_key on public.classes (site_slug) where site_slug is not null;

-- activity log: also record join requests and payments
alter table public.site_events drop constraint if exists site_events_kind_check;
alter table public.site_events add constraint site_events_kind_check check (kind in ('visit', 'signup', 'login', 'join_request', 'payment'));

-- ───────────────────────── 2. New tables ─────────────────────────
create table if not exists public.enrolments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id),
  unique (student_id, class_id)
);
create index if not exists enrolments_class on public.enrolments (class_id, status);
-- teacher_ok: the class's teacher (from another school) said yes; the admin still has to approve
alter table public.enrolments drop constraint if exists enrolments_status_check;
alter table public.enrolments add constraint enrolments_status_check check (status in ('pending', 'teacher_ok', 'approved', 'rejected'));

-- catalogue of main-site materials (filled by the site build); teachers pick from it
create table if not exists public.materials (
  path text primary key check (path ~ '^/[a-z0-9-]+/$'),
  lesson_id text,
  title text not null,
  kind text not null default 'lesson',
  subject text,
  level text,
  unit text,
  sort int not null default 0
);
create table if not exists public.class_materials (
  class_id uuid not null references public.classes(id) on delete cascade,
  path text not null references public.materials(path) on delete cascade,
  added_by uuid references auth.users(id),
  added_at timestamptz not null default now(),
  sort int not null default 0,
  primary key (class_id, path)
);

create table if not exists public.plans (
  code text primary key check (code ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  audience text not null check (audience in ('student', 'teacher')),
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  months int not null check (months between 1 and 24),
  active boolean not null default true,
  sort int not null default 0
);
create table if not exists public.payments (
  reference text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text references public.plans(code),
  amount numeric(10, 2),
  currency text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  raw jsonb,
  provider_order text unique   -- PayPal order id
);
alter table public.payments add column if not exists provider_order text unique;
-- M-Pesa (KES) as well as PayPal (USD): the student sends money to the admin's M-Pesa number, then types the M-Pesa code; the admin confirms it
alter table public.plans add column if not exists amount_kes numeric(10, 2) not null default 0 check (amount_kes >= 0);
alter table public.payments add column if not exists method text not null default 'paypal';
alter table public.payments add column if not exists mpesa_code text;
alter table public.payments add column if not exists payer_phone text;
alter table public.payments add column if not exists payer_name text;
create unique index if not exists payments_mpesa_code on public.payments (mpesa_code) where mpesa_code is not null;
do $$ begin
  alter table public.payments add constraint payments_method_chk check (method in ('paypal', 'mpesa'));
exception when duplicate_object then null; end $$;
create table if not exists public.app_settings (k text primary key check (k ~ '^[a-z0-9_]{2,40}$'), v text not null);

-- ───────────────────────── 3. Helper functions ─────────────────────────
create or replace function public.is_school_teacher() returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role('school_teacher');
$$;
create or replace function public.premium_ok(uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public as $$
  select uid is not null and (public.is_staff_user(uid) or exists (
    select 1 from public.profiles p where p.id = uid and (p.premium_free or coalesce(p.premium_until > now(), false))));
$$;
-- classes this student is approved for (active, not archived)
create or replace function public.my_class_ids() returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(e.class_id), array[]::uuid[]) from public.enrolments e join public.classes c on c.id = e.class_id
   where e.student_id = auth.uid() and e.status = 'approved' and c.active and c.archived_at is null;
$$;
create or replace function public.owns_class(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes c where c.id = cid and c.teacher_id = auth.uid()
                 and (public.has_role('teacher') or public.has_role('admin') or (public.is_school_teacher() and public.premium_ok())));
$$;
-- a school teacher may see a student who asked to join, or belongs to, one of their classes
create or replace function public.in_my_school_class(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_school_teacher() and public.premium_ok() and exists (
    select 1 from public.enrolments e join public.classes c on c.id = e.class_id
     where e.student_id = sid and c.teacher_id = auth.uid() and c.owner_kind = 'school');
$$;

-- Approved = staff, or premium with at least one approved class, or an approved school teacher with premium, or a parent.
create or replace function public.is_approved() returns boolean language sql stable security definer set search_path = public as $$
  select public.is_staff()
      or (public.premium_ok() and cardinality(public.my_class_ids()) > 0)
      or (public.is_school_teacher() and public.premium_ok())
      or (public.has_role('parent') and coalesce((select approved from public.profiles where id = auth.uid()), false));
$$;

-- the student's main class (kept for older screens): the first approved class
create or replace function public.my_class() returns uuid language sql stable security definer set search_path = public as $$
  select coalesce((select class_id from public.profiles p where p.id = auth.uid() and p.class_id = any(public.my_class_ids())),
                  (public.my_class_ids())[1]);
$$;

-- main-site teachers (teacher role) see students in their classes through enrolments too
create or replace function public.can_view_student(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select sid = auth.uid() or public.is_admin()
      or (public.has_role('teacher') and (
            exists (select 1 from public.profiles p join public.classes c on c.id = p.class_id where p.id = sid and c.teacher_id = auth.uid())
         or exists (select 1 from public.enrolments e join public.classes c on c.id = e.class_id where e.student_id = sid and c.teacher_id = auth.uid())))
      or exists (select 1 from public.parent_links l where l.student_id = sid and l.parent_id = auth.uid());
$$;

create or replace function public.my_programmes() returns text[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(distinct x), array[]::text[]) from (
    select unnest(public.class_programmes(c)) x from public.classes c where c.id = any(public.my_class_ids())) s;
$$;
create or replace function public.quiz_for_me(qid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.quiz_classes where quiz_id = qid and class_id = any(public.my_class_ids()))
      or exists (select 1 from public.quiz_students where quiz_id = qid and student_id = auth.uid());
$$;
create or replace function public.assigned_to_me(a uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.assignments x where x.id = a and (
    (x.everyone and x.class_id = any(public.my_class_ids())) or
    exists (select 1 from public.assignment_students s where s.assignment_id = x.id and s.student_id = auth.uid())));
$$;

create or replace function public.start_quiz(qid uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare q public.quizzes; a uuid; n int;
begin
  select * into q from public.quizzes where id = qid;
  if q.id is null or not public.quiz_for_me(qid) then raise exception 'This quiz is not set for your class.'; end if;
  if not public.is_approved() then raise exception 'Your account needs premium access and an approved class.'; end if;
  select id into a from public.quiz_attempts where quiz_id = qid and student_id = auth.uid() and status = 'in_progress' limit 1;
  if a is not null then return a; end if;
  if not public.quiz_is_open(q) then raise exception 'This quiz is not open.'; end if;
  select count(*) into n from public.quiz_attempts where quiz_id = qid and student_id = auth.uid();
  if n >= q.max_attempts then raise exception 'You have used all your attempts for this quiz.'; end if;
  insert into public.quiz_attempts (quiz_id, student_id, max_score)
  values (qid, auth.uid(), (select coalesce(sum(x.marks), 0) from public.quiz_questions qq join public.questions x on x.id = qq.question_id where qq.quiz_id = qid))
  returning id into a;
  return a;
end $$;

-- ───────────────────────── 4. Page keys ─────────────────────────
-- Each class page and lesson page is locked with its own key: HMAC-SHA256(site key, path).
-- The key is only given to staff, to school teachers with premium (for main-site materials they can add),
-- and to premium students approved for a class that contains that page.
create or replace function public.page_key(p text) returns text
language plpgsql stable security definer set search_path = public, extensions as $$
declare ok boolean := false; k text;
begin
  if auth.uid() is null or p is null or p !~ '^/[a-z0-9-]+/$' then return null; end if;
  if public.is_staff() then ok := true;
  elsif public.premium_ok() then
    ok := exists (select 1 from public.classes c where c.id = any(public.my_class_ids())
                    and (coalesce(c.site_slug, c.follows) is not null and '/' || coalesce(c.site_slug, c.follows) || '/' = p
                         or exists (select 1 from public.class_materials cm where cm.class_id = c.id and cm.path = p)))
       or (public.is_school_teacher() and exists (select 1 from public.materials m where m.path = p));
  end if;
  if not ok then return null; end if;
  select encode(extensions.hmac(convert_to(p, 'UTF8'), decode(s.k, 'base64'), 'sha256'), 'base64') into k from public.site_secrets s where s.id = 1;
  return k;
end $$;
revoke all on function public.page_key(text) from public, anon;
grant execute on function public.page_key(text) to authenticated;

-- Shared pages (learning centre, quizzes, tools) use a key made from the site key, never the site key itself,
-- so nobody can work out a class or lesson key from it.
create or replace function public.site_key() returns text
language sql stable security definer set search_path = public, extensions as $$
  select encode(extensions.hmac(convert_to('*', 'UTF8'), decode(s.k, 'base64'), 'sha256'), 'base64') from public.site_secrets s
  where s.id = 1 and auth.uid() is not null and public.is_approved()
$$;
revoke all on function public.site_key() from public, anon;
grant execute on function public.site_key() to authenticated;

-- ───────────────────────── 5. Joining classes ─────────────────────────
-- the list students choose from (no join codes are shown)
create or replace function public.class_directory() returns table (id uuid, name text, school text, subject text, level text, description text, my_status text)
language sql stable security definer set search_path = public as $$
  select c.id, c.name,
         case when c.self_study then 'Learnova · Independent learners (no teacher needed)'
              when c.owner_kind = 'main' then 'Learnova'
              else coalesce(nullif(c.school_name, ''), (select nullif(pr.full_name, '') from public.profiles pr where pr.id = c.teacher_id), 'Independent teacher') end,
         c.subject, c.level, c.description,
         (select en.status from public.enrolments en where en.class_id = c.id and en.student_id = auth.uid())
    from public.classes c
   where auth.uid() is not null and c.active and c.archived_at is null and c.listed and c.name <> 'Staff'
   order by c.self_study, (c.owner_kind = 'school'), 3, c.name;
$$;
revoke all on function public.class_directory() from public, anon;
grant execute on function public.class_directory() to authenticated;

create or replace function public.request_join(cid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c public.classes; st text;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  if public.has_role('parent') then raise exception 'Parent accounts cannot join classes.'; end if;
  select * into c from public.classes where id = cid and active and archived_at is null and listed;
  if c.id is null then raise exception 'That class is not open for joining.'; end if;
  if (select count(*) from public.enrolments where student_id = auth.uid() and status in ('pending', 'teacher_ok')) >= 10 then
    raise exception 'You already have 10 requests waiting. Wait for a teacher to answer them.'; end if;
  if c.self_study then   -- independent learners need no teacher: they are in straight away (premium still opens the materials)
    insert into public.enrolments (student_id, class_id, status, decided_at) values (auth.uid(), cid, 'approved', now())
    on conflict (student_id, class_id) do update set status = 'approved', decided_at = now();
    update public.profiles set approved = true, class_id = coalesce(class_id, cid) where id = auth.uid();
    insert into public.site_events (kind, user_id, path) values ('join_request', auth.uid(), c.name);
    return 'approved';
  end if;
  insert into public.enrolments (student_id, class_id) values (auth.uid(), cid)
  on conflict (student_id, class_id) do update set status = case when public.enrolments.status = 'rejected' then 'pending' else public.enrolments.status end,
                                                   requested_at = case when public.enrolments.status = 'rejected' then now() else public.enrolments.requested_at end
  returning status into st;
  insert into public.site_events (kind, user_id, path) values ('join_request', auth.uid(), c.name);
  return st;
end $$;
create or replace function public.leave_class(cid uuid) returns void
language sql security definer set search_path = public as $$
  delete from public.enrolments where student_id = auth.uid() and class_id = cid;
$$;
-- Answering a join request. The admin's yes is final. A teacher from another school can only say yes as a first step
-- (teacher_ok): the admin approves every student before they get in. The admin can also give free access at the same time.
drop function if exists public.decide_enrolment(uuid, boolean);
create or replace function public.decide_enrolment(eid uuid, approve boolean, give_free boolean default false) returns text
language plpgsql security definer set search_path = public as $$
declare e public.enrolments; c public.classes; st text;
begin
  select * into e from public.enrolments where id = eid;
  if e.id is null then raise exception 'Request not found.'; end if;
  select * into c from public.classes where id = e.class_id;
  if not (public.is_admin() or public.owns_class(e.class_id)) then raise exception 'Only the class teacher can answer this request.'; end if;
  st := case when not approve then 'rejected'
             when public.is_admin() or c.owner_kind = 'main' then 'approved'
             else 'teacher_ok' end;
  update public.enrolments set status = st, decided_at = now(), decided_by = auth.uid() where id = eid;
  if st = 'approved' then
    update public.profiles set approved = true, class_id = coalesce(class_id, e.class_id) where id = e.student_id;
  end if;
  if give_free and approve and public.is_admin() then update public.profiles set premium_free = true where id = e.student_id; end if;
  return st;
end $$;
-- keep the old join_class (codes) working for anyone who still has a code
create or replace function public.join_class(code text) returns text
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select id, name into c from public.classes where join_code = upper(trim(code)) and active and archived_at is null;
  if c.id is null then raise exception 'That class code is not recognised.'; end if;
  perform public.request_join(c.id);
  return c.name;
end $$;
revoke all on function public.request_join(uuid), public.leave_class(uuid), public.decide_enrolment(uuid, boolean, boolean), public.join_class(text) from public, anon;
grant execute on function public.request_join(uuid), public.leave_class(uuid), public.decide_enrolment(uuid, boolean, boolean), public.join_class(text) to authenticated;

-- ───────────────────────── 6. Premium ─────────────────────────
create or replace function public.my_access() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'premium', public.premium_ok(), 'free', p.premium_free, 'until', p.premium_until,
    'account_type', p.account_type, 'teacher_status', p.teacher_status,
    'roles', (select coalesce(jsonb_agg(role), '[]') from public.user_roles where user_id = auth.uid()),
    'classes', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'slug', coalesce(c.site_slug, c.follows), 'self', c.self_study, 'status', e.status, 'kind', c.owner_kind) order by c.name), '[]')
                  from public.enrolments e join public.classes c on c.id = e.class_id where e.student_id = auth.uid() and c.archived_at is null))
  from public.profiles p where p.id = auth.uid();
$$;
-- admin: give or remove free access, or set a paid-until date
create or replace function public.set_premium(uid uuid, free boolean, until timestamptz default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only an admin can change premium access.'; end if;
  update public.profiles set premium_free = free, premium_until = coalesce(until, premium_until) where id = uid;
end $$;
-- student/teacher: start a payment; returns the reference and amount (called by the paypal edge function as the signed-in user)
create or replace function public.start_payment(plan text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare pl public.plans; ref text; em text;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select * into pl from public.plans where code = plan and active;
  if pl.code is null or pl.amount <= 0 then raise exception 'That plan is not available.'; end if;
  if pl.audience = 'teacher' and not (public.is_school_teacher() or (select account_type from public.profiles where id = auth.uid()) = 'teacher') then
    raise exception 'That plan is for teachers.'; end if;
  ref := 'LV-' || replace(gen_random_uuid()::text, '-', '');
  select email into em from auth.users where id = auth.uid();
  insert into public.payments (reference, user_id, plan_code, amount, currency) values (ref, auth.uid(), pl.code, pl.amount, pl.currency);
  return jsonb_build_object('reference', ref, 'amount', pl.amount, 'currency', pl.currency, 'email', em, 'plan', pl.name);
end $$;
-- called only by the paypal edge function (service role) after PayPal confirms the captured payment
create or replace function public.confirm_payment(ref text, paid_amount numeric, paid_currency text, payload jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare p public.payments; pl public.plans;
begin
  select * into p from public.payments where reference = ref for update;
  if p.reference is null or p.status <> 'pending' then return false; end if;
  select * into pl from public.plans where code = p.plan_code;
  if paid_amount < p.amount or upper(paid_currency) <> upper(p.currency) then
    update public.payments set status = 'failed', raw = payload where reference = ref; return false;
  end if;
  update public.payments set status = 'paid', paid_at = now(), raw = payload where reference = ref;
  update public.profiles set premium_until = greatest(coalesce(premium_until, now()), now()) + make_interval(months => pl.months) where id = p.user_id;
  return true;
end $$;
revoke all on function public.set_premium(uuid, boolean, timestamptz), public.start_payment(text), public.my_access() from public, anon;
grant execute on function public.set_premium(uuid, boolean, timestamptz), public.start_payment(text), public.my_access() to authenticated;
revoke all on function public.confirm_payment(text, numeric, text, jsonb) from public, anon, authenticated;
grant execute on function public.confirm_payment(text, numeric, text, jsonb) to service_role;

-- M-Pesa: the payer sends the plan's KES price to the admin's number, then submits the M-Pesa confirmation code here
drop function if exists public.submit_mpesa(text, text, text, text);
create or replace function public.submit_mpesa(plan_id text, mpesa text, phone text, payer text default null) returns text
language plpgsql security definer set search_path = public as $$
declare pl public.plans; ref text; c text := upper(regexp_replace(coalesce(mpesa, ''), '\s', '', 'g'));
        ph text := regexp_replace(coalesce(phone, ''), '[^0-9+]', '', 'g');
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select * into pl from public.plans x where x.code = plan_id and x.active;
  if pl.code is null or pl.amount_kes <= 0 then raise exception 'That plan is not available for M-Pesa yet.'; end if;
  if pl.audience = 'teacher' and not (public.is_school_teacher() or (select account_type from public.profiles where id = auth.uid()) = 'teacher') then
    raise exception 'That plan is for teachers.'; end if;
  if c !~ '^[A-Z0-9]{10}$' then raise exception 'The M-Pesa code has 10 letters and numbers, for example SKL4ABC12D.'; end if;
  if ph !~ '^\+?[0-9]{9,13}$' then raise exception 'Type the phone number you paid from.'; end if;
  if exists (select 1 from public.payments y where y.mpesa_code = c) then raise exception 'That M-Pesa code has already been sent.'; end if;
  if (select count(*) from public.payments where user_id = auth.uid() and method = 'mpesa' and status = 'pending') >= 3 then
    raise exception 'You have 3 M-Pesa payments waiting. The admin will check them soon.'; end if;
  ref := 'MP-' || replace(gen_random_uuid()::text, '-', '');
  insert into public.payments (reference, user_id, plan_code, amount, currency, method, mpesa_code, payer_phone, payer_name)
  values (ref, auth.uid(), pl.code, pl.amount_kes, 'KES', 'mpesa', c, ph, left(nullif(trim(payer), ''), 80));
  insert into public.site_events (kind, user_id, path) values ('payment', auth.uid(), 'mpesa ' || pl.code);
  return ref;
end $$;
-- admin checks the code in the M-Pesa messages on their phone, then confirms (premium starts) or rejects it
create or replace function public.decide_mpesa(ref text, approve boolean) returns void
language plpgsql security definer set search_path = public as $$
declare p public.payments; pl public.plans;
begin
  if not public.is_admin() then raise exception 'Only an admin can confirm payments.'; end if;
  select * into p from public.payments where reference = ref and method = 'mpesa' for update;
  if p.reference is null or p.status <> 'pending' then raise exception 'That payment is not waiting.'; end if;
  if not approve then update public.payments set status = 'failed' where reference = ref; return; end if;
  select * into pl from public.plans where code = p.plan_code;
  update public.payments set status = 'paid', paid_at = now(), raw = jsonb_build_object('confirmed_by', auth.uid()) where reference = ref;
  update public.profiles set premium_until = greatest(coalesce(premium_until, now()), now()) + make_interval(months => pl.months) where id = p.user_id;
end $$;
create or replace function public.admin_payments() returns table (reference text, full_name text, email text, plan text, method text, amount numeric, currency text,
  status text, mpesa_code text, payer_phone text, payer_name text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select y.reference, p.full_name, u.email::text, pl.name, y.method, y.amount, y.currency, y.status, y.mpesa_code, y.payer_phone, y.payer_name, y.created_at
    from public.payments y left join public.profiles p on p.id = y.user_id left join auth.users u on u.id = y.user_id left join public.plans pl on pl.code = y.plan_code
   where public.is_admin() order by (y.status = 'pending') desc, y.created_at desc limit 300;
$$;
revoke all on function public.submit_mpesa(text, text, text, text), public.decide_mpesa(text, boolean), public.admin_payments() from public, anon;
grant execute on function public.submit_mpesa(text, text, text, text), public.decide_mpesa(text, boolean), public.admin_payments() to authenticated;

-- admin: approve a teacher from another school
create or replace function public.decide_teacher(uid uuid, approve boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only an admin can approve teachers.'; end if;
  update public.profiles set teacher_status = case when approve then 'approved' else 'rejected' end, approved = approve where id = uid and account_type = 'teacher';
  if approve then insert into public.user_roles (user_id, role, granted_by) values (uid, 'school_teacher', auth.uid()) on conflict do nothing;
  else delete from public.user_roles where user_id = uid and role = 'school_teacher'; end if;
end $$;
revoke all on function public.decide_teacher(uuid, boolean) from public, anon;
grant execute on function public.decide_teacher(uuid, boolean) to authenticated;

-- admin overview of accounts for the Members tab
create or replace function public.admin_members() returns table (id uuid, full_name text, email text, account_type text, teacher_status text,
  premium_free boolean, premium_until timestamptz, classes text, pending int, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, u.email::text, p.account_type, p.teacher_status, p.premium_free, p.premium_until,
         (select string_agg(c.name || case when e.status = 'approved' then '' else ' (' || e.status || ')' end, ', ' order by c.name)
            from public.enrolments e join public.classes c on c.id = e.class_id where e.student_id = p.id),
         (select count(*)::int from public.enrolments e where e.student_id = p.id and e.status = 'pending'), p.created_at
    from public.profiles p join auth.users u on u.id = p.id
   where public.is_admin()
   order by p.created_at desc;
$$;
revoke all on function public.admin_members() from public, anon;
grant execute on function public.admin_members() to authenticated;

-- join requests to answer: a teacher sees new requests for their own classes; the admin sees every request
-- (teacher_ok = the other school's teacher already said yes)
drop function if exists public.my_join_requests();
create or replace function public.my_join_requests() returns table (id uuid, student_id uuid, full_name text, class_id uuid, class_name text, school text,
  status text, requested_at timestamptz, premium boolean)
language sql stable security definer set search_path = public as $$
  select e.id, e.student_id, p.full_name, c.id, c.name,
         case when c.owner_kind = 'main' then 'Learnova' else coalesce(nullif(c.school_name, ''), (select t.full_name from public.profiles t where t.id = c.teacher_id)) end,
         e.status, e.requested_at, public.premium_ok(e.student_id)
    from public.enrolments e join public.classes c on c.id = e.class_id join public.profiles p on p.id = e.student_id
   where (public.is_admin() and e.status in ('pending', 'teacher_ok'))
      or (not public.is_admin() and e.status = 'pending' and public.owns_class(c.id))
   order by (e.status = 'teacher_ok') desc, e.requested_at;
$$;
revoke all on function public.my_join_requests() from public, anon;
grant execute on function public.my_join_requests() to authenticated;

-- ───────────────────────── 7. Sign-up ─────────────────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare cid uuid; kid uuid; t text := coalesce(new.raw_user_meta_data->>'account_type', 'student');
        nm text := left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)), 80);
begin
  if t = 'parent' then
    select student_id into kid from public.student_parent_codes where code = upper(trim(coalesce(new.raw_user_meta_data->>'parent_code', ''))) limit 1;
    if kid is null then raise exception 'That parent code is not recognised. Check it with the school.'; end if;
    insert into public.profiles (id, full_name, class_id, approved, account_type) values (new.id, nm, null, true, 'parent') on conflict (id) do nothing;
    insert into public.user_roles (user_id, role) values (new.id, 'parent') on conflict do nothing;
    insert into public.parent_links (parent_id, student_id) values (new.id, kid) on conflict do nothing;
    insert into public.site_events (kind, user_id, path) values ('signup', new.id, 'parent');
    return new;
  end if;
  if t = 'teacher' then   -- teachers from other schools wait for the admin; they never get the main-site teacher role
    insert into public.profiles (id, full_name, approved, account_type, school_name, teacher_status)
    values (new.id, nm, false, 'teacher', left(nullif(trim(new.raw_user_meta_data->>'school_name'), ''), 120), 'pending') on conflict (id) do nothing;
    insert into public.site_events (kind, user_id, path) values ('signup', new.id, 'teacher');
    return new;
  end if;
  -- students: an optional old join code still works; otherwise they choose classes after signing in
  select id into cid from public.classes where join_code = upper(trim(coalesce(new.raw_user_meta_data->>'join_code', ''))) and active and archived_at is null limit 1;
  insert into public.profiles (id, full_name, class_id, approved, account_type) values (new.id, nm, null, false, 'student') on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'student') on conflict do nothing;
  insert into public.student_parent_codes (student_id) values (new.id) on conflict do nothing;
  if cid is not null then insert into public.enrolments (student_id, class_id) values (new.id, cid) on conflict do nothing; end if;
  insert into public.site_events (kind, user_id, path) values ('signup', new.id, 'student');
  return new;
end $$;

-- students and teachers cannot change their own class, approval, premium or account type
create or replace function public.protect_profile() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.id := old.id; new.premium_until := old.premium_until; new.premium_free := old.premium_free;
    new.account_type := old.account_type; new.teacher_status := old.teacher_status;
    if not public.is_staff() then new.class_id := old.class_id; new.approved := old.approved; end if;
  end if;
  new.full_name := left(new.full_name, 80);
  new.updated_at := now();
  return new;
end $$;

-- older staff screens approve a student or move them by setting profiles.class_id: keep enrolments in step
create or replace function public.sync_enrolment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.class_id is not null and new.approved and (tg_op = 'INSERT' or new.class_id is distinct from old.class_id or new.approved is distinct from old.approved)
     and exists (select 1 from public.user_roles r where r.user_id = new.id and r.role = 'student') then
    insert into public.enrolments (student_id, class_id, status, decided_at, decided_by) values (new.id, new.class_id, 'approved', now(), auth.uid())
    on conflict (student_id, class_id) do update set status = 'approved', decided_at = now(), decided_by = auth.uid();
  end if;
  return null;
end $$;
drop trigger if exists sync_enrolment on public.profiles;
create trigger sync_enrolment after insert or update of class_id, approved on public.profiles for each row execute function public.sync_enrolment();

-- school teachers can only make "school" classes owned by themselves
create or replace function public.guard_class() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if tg_op = 'UPDATE' then
      new.id := old.id; new.teacher_id := old.teacher_id; new.owner_kind := old.owner_kind; new.site_slug := old.site_slug; new.join_code := old.join_code;
    else
      new.teacher_id := auth.uid(); new.site_slug := null;
      new.owner_kind := case when public.has_role('teacher') then coalesce(new.owner_kind, 'main') else 'school' end;
      new.school_name := coalesce(new.school_name, (select school_name from public.profiles where id = auth.uid()));
    end if;
    if new.owner_kind = 'school' then new.content_programmes := null; end if;
    new.name := left(trim(new.name), 80);
  end if;
  return new;
end $$;
drop trigger if exists guard_class on public.classes;
create trigger guard_class before insert or update on public.classes for each row execute function public.guard_class();

-- ───────────────────────── 8. Row level security ─────────────────────────
alter table public.enrolments enable row level security;
alter table public.materials enable row level security;
alter table public.class_materials enable row level security;
alter table public.plans enable row level security;
alter table public.payments enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists enr_read on public.enrolments;
create policy enr_read on public.enrolments for select to authenticated
  using (student_id = auth.uid() or public.is_admin() or public.owns_class(class_id));
-- writes only through request_join / decide_enrolment / leave_class (no direct insert, update or delete)
revoke insert, update, delete on public.enrolments from anon, authenticated;
grant select on public.enrolments to authenticated;

drop policy if exists mat_read on public.materials;
create policy mat_read on public.materials for select to authenticated using (true);
drop policy if exists mat_admin on public.materials;
create policy mat_admin on public.materials for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.materials to authenticated;
grant insert, update, delete on public.materials to authenticated;

drop policy if exists cm_read on public.class_materials;
create policy cm_read on public.class_materials for select to authenticated
  using (public.is_staff() or public.owns_class(class_id) or class_id = any(public.my_class_ids()));
drop policy if exists cm_owner on public.class_materials;
create policy cm_owner on public.class_materials for all to authenticated
  using (public.is_admin() or (public.owns_class(class_id) and exists (select 1 from public.classes c where c.id = class_id and c.owner_kind = 'school')))
  with check (public.is_admin() or (public.owns_class(class_id) and exists (select 1 from public.classes c where c.id = class_id and c.owner_kind = 'school')));
grant select, insert, update, delete on public.class_materials to authenticated;

drop policy if exists plans_read on public.plans;
create policy plans_read on public.plans for select to anon, authenticated using (active);
drop policy if exists plans_admin on public.plans;
create policy plans_admin on public.plans for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.plans to anon, authenticated;
grant insert, update, delete on public.plans to authenticated;

drop policy if exists pay_read on public.payments;
create policy pay_read on public.payments for select to authenticated using (user_id = auth.uid() or public.is_admin());
revoke insert, update, delete on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

drop policy if exists set_read on public.app_settings;
create policy set_read on public.app_settings for select to anon, authenticated using (k in ('paypal_client_id', 'currency', 'premium_note', 'mpesa_number', 'mpesa_name'));
drop policy if exists set_admin on public.app_settings;
create policy set_admin on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.app_settings to anon, authenticated;
grant insert, update, delete on public.app_settings to authenticated;

-- classes: students see the classes they asked for; teachers see their own; admin sees all
drop policy if exists classes_read on public.classes;
create policy classes_read on public.classes for select to authenticated
  using (public.is_admin() or teacher_id = auth.uid() or exists (select 1 from public.enrolments e where e.class_id = classes.id and e.student_id = auth.uid()));
drop policy if exists classes_teacher_insert on public.classes;
create policy classes_teacher_insert on public.classes for insert to authenticated
  with check (teacher_id = auth.uid() and (public.has_role('teacher') or (public.is_school_teacher() and public.premium_ok())));
drop policy if exists classes_teacher_update on public.classes;
create policy classes_teacher_update on public.classes for update to authenticated
  using (teacher_id = auth.uid() and (public.has_role('teacher') or (public.is_school_teacher() and public.premium_ok())))
  with check (teacher_id = auth.uid());

-- quizzes: students see quizzes set for any of their classes; school teachers see published main-site quizzes to assign
drop policy if exists quiz_classes_read on public.quiz_classes;
create policy quiz_classes_read on public.quiz_classes for select to authenticated
  using (public.is_staff() or class_id = any(public.my_class_ids()) or public.owns_class(class_id));
drop policy if exists quiz_classes_owner on public.quiz_classes;
create policy quiz_classes_owner on public.quiz_classes for all to authenticated
  using (public.owns_class(class_id) and exists (select 1 from public.classes c where c.id = class_id and c.owner_kind = 'school'))
  with check (public.owns_class(class_id) and exists (select 1 from public.classes c where c.id = class_id and c.owner_kind = 'school')
              and exists (select 1 from public.quizzes q where q.id = quiz_id and q.published));
drop policy if exists quizzes_school_read on public.quizzes;
create policy quizzes_school_read on public.quizzes for select to authenticated using (published and public.is_school_teacher() and public.premium_ok());

-- school teachers: their students' names, quiz attempts on quizzes set for their classes, and lesson work for lessons in their classes
drop policy if exists profiles_school_read on public.profiles;
create policy profiles_school_read on public.profiles for select to authenticated using (public.in_my_school_class(id));
drop policy if exists attempts_school_read on public.quiz_attempts;
create policy attempts_school_read on public.quiz_attempts for select to authenticated
  using (public.in_my_school_class(student_id) and exists (
    select 1 from public.quiz_classes qc join public.classes c on c.id = qc.class_id join public.enrolments e on e.class_id = c.id
     where qc.quiz_id = quiz_attempts.quiz_id and c.teacher_id = auth.uid() and e.student_id = quiz_attempts.student_id and e.status = 'approved'));
drop policy if exists lesson_work_school_read on public.lesson_work;
create policy lesson_work_school_read on public.lesson_work for select to authenticated
  using (student_id is not null and public.in_my_school_class(student_id) and exists (
    select 1 from public.class_materials cm join public.materials m on m.path = cm.path join public.classes c on c.id = cm.class_id
      join public.enrolments e on e.class_id = c.id
     where m.lesson_id = lesson_work.lesson and c.teacher_id = auth.uid() and e.student_id = lesson_work.student_id and e.status = 'approved'));

-- school teachers: to-do lists for their own classes only
drop policy if exists assignments_owner on public.assignments;
create policy assignments_owner on public.assignments for all to authenticated
  using (public.owns_class(class_id) and public.is_school_teacher()) with check (public.owns_class(class_id) and public.is_school_teacher());

-- lesson work: signed-in accounts only (no anonymous rows), and only as themselves
drop policy if exists lesson_work_write on public.lesson_work;
create policy lesson_work_write on public.lesson_work for insert to authenticated
  with check ((student_id is null or student_id = auth.uid()) and char_length(student_name) between 1 and 80
              and char_length(answers) between 1 and 20000 and char_length(lesson) between 1 and 60 and step between 1 and 12);
revoke insert on public.lesson_work from anon;

-- messages: students can also write to the teachers of their classes, and teachers to their own students
create or replace function public.can_message(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() or public.is_staff_user(rid)
      or public.in_my_school_class(rid)
      or exists (select 1 from public.enrolments e join public.classes c on c.id = e.class_id
                  where e.student_id = auth.uid() and e.status = 'approved' and c.teacher_id = rid);
$$;
drop policy if exists msg_send on public.messages;
create policy msg_send on public.messages for insert to authenticated
  with check (sender = auth.uid() and recipient <> auth.uid() and read_at is null and public.can_message(recipient));

-- people this user may write to: staff for everyone; school teachers also see their own students, and students see their class teachers
create or replace function public.message_contacts()
returns table (id uuid, name text, role text, class_name text)
language sql stable security definer set search_path = public as $$
  select p.id,   -- the admin appears to everyone else as "Learnova" (no personal name on the site)
         case when not public.is_admin() and exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'admin') then 'Learnova'
              else coalesce(nullif(p.full_name, ''), 'Unnamed') end,
         case when exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'admin') then 'Admin'
              when exists (select 1 from public.user_roles r where r.user_id = p.id and r.role in ('teacher', 'school_teacher')) then 'Teacher'
              when exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'parent') then 'Parent'
              else 'Student' end,
         c.name
  from public.profiles p left join public.classes c on c.id = p.class_id
  where auth.uid() is not null and p.id <> auth.uid() and public.can_message(p.id)
  order by 3, 4 nulls first, 2
$$;
revoke all on function public.message_contacts() from public, anon;
grant execute on function public.message_contacts() to authenticated;

-- ───────────────────────── 9. Existing data ─────────────────────────
-- Biology: one SL class and one HL class (DP2 classes are empty; their quizzes move across, then they are archived)
update public.classes set name = 'IB Biology SL', programme = 'IB DP Biology SL', site_slug = 'bio-sl', subject = 'IB Biology', level = 'SL'
 where id = '9bba4bdc-2504-4007-a27a-b1adb9a2549a';
update public.classes set name = 'IB Biology HL', programme = 'IB DP Biology HL', site_slug = 'bio-hl', subject = 'IB Biology', level = 'HL'
 where id = '737f787a-3cf6-4a63-81dc-759982e801f8';
insert into public.quiz_classes (quiz_id, class_id)
  select quiz_id, case class_id when 'd029cb74-d08e-4627-870e-f38c4da302ec'::uuid then '9bba4bdc-2504-4007-a27a-b1adb9a2549a'::uuid else '737f787a-3cf6-4a63-81dc-759982e801f8'::uuid end
    from public.quiz_classes where class_id in ('d029cb74-d08e-4627-870e-f38c4da302ec', 'f81335e8-9ce4-4d1d-89ac-de3d12c60f3b')
  on conflict do nothing;
update public.assignments set class_id = case class_id when 'd029cb74-d08e-4627-870e-f38c4da302ec'::uuid then '9bba4bdc-2504-4007-a27a-b1adb9a2549a'::uuid else '737f787a-3cf6-4a63-81dc-759982e801f8'::uuid end
 where class_id in ('d029cb74-d08e-4627-870e-f38c4da302ec', 'f81335e8-9ce4-4d1d-89ac-de3d12c60f3b');
update public.profiles set class_id = case class_id when 'd029cb74-d08e-4627-870e-f38c4da302ec'::uuid then '9bba4bdc-2504-4007-a27a-b1adb9a2549a'::uuid else '737f787a-3cf6-4a63-81dc-759982e801f8'::uuid end
 where class_id in ('d029cb74-d08e-4627-870e-f38c4da302ec', 'f81335e8-9ce4-4d1d-89ac-de3d12c60f3b');
update public.classes set active = false, archived_at = coalesce(archived_at, now()), listed = false
 where id in ('d029cb74-d08e-4627-870e-f38c4da302ec', 'f81335e8-9ce4-4d1d-89ac-de3d12c60f3b');

-- main-site class pages
update public.classes set site_slug = v.slug, subject = coalesce(subject, v.subj), level = coalesce(level, v.lvl)
  from (values ('IB ESS SL', 'ess-sl', 'IB ESS', 'SL'), ('IB ESS HL', 'ess-hl', 'IB ESS', 'HL'),
               ('IB Chemistry SL', 'chem-sl', 'IB Chemistry', 'SL'), ('IB Chemistry HL', 'chem-hl', 'IB Chemistry', 'HL'),
               ('IB Physics SL', 'phys-sl', 'IB Physics', 'SL'), ('IB Physics HL', 'phys-hl', 'IB Physics', 'HL'),
               ('Grade 6 Science', 'grade-6', 'MYP Science', 'MYP 1'), ('Grade 8', 'grade-8', 'MYP Science', 'MYP 3'),
               ('Grade 9', 'grade-9', 'MYP Science', 'MYP 4'), ('Grade 10 Science', 'grade-10', 'MYP Science', 'MYP 5'),
               ('Grade 11 Science', 'grade-11', 'Science', 'Grade 11'), ('Grade 12 Science', 'grade-12', 'Science', 'Grade 12')) v(nm, slug, subj, lvl)
 where classes.name = v.nm and classes.site_slug is null;
update public.classes set listed = false where name = 'Staff';

-- every current student keeps their class: an approved (or waiting) enrolment from their profile
insert into public.enrolments (student_id, class_id, status, decided_at)
  select p.id, p.class_id, case when p.approved then 'approved' else 'pending' end, case when p.approved then now() end
    from public.profiles p join public.user_roles r on r.user_id = p.id and r.role = 'student'
   where p.class_id is not null
  on conflict (student_id, class_id) do nothing;
update public.profiles p set account_type = 'parent' where exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'parent');
update public.profiles p set account_type = 'teacher' where exists (select 1 from public.user_roles r where r.user_id = p.id and r.role in ('teacher', 'admin'));
-- current approved students keep free access until the admin changes it
-- (only the first time this migration runs, so a re-run never gives free access to newer students)
update public.profiles p set premium_free = true
 where not exists (select 1 from public.app_settings where k = 'migration_022')
   and p.approved and exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'student')
   and exists (select 1 from public.enrolments e where e.student_id = p.id and e.status = 'approved');
insert into public.app_settings (k, v) values ('migration_022', now()::text) on conflict do nothing;

-- starter plans (prices are set by the admin on the Members tab; 0 means not for sale yet)
insert into public.plans (code, name, audience, amount, currency, months, sort) values
  ('student-term', 'Student · 4 months', 'student', 0, 'USD', 4, 1),
  ('student-year', 'Student · 12 months', 'student', 0, 'USD', 12, 2),
  ('teacher-term', 'Teacher · 4 months', 'teacher', 0, 'USD', 4, 3),
  ('teacher-year', 'Teacher · 12 months', 'teacher', 0, 'USD', 12, 4)
on conflict (code) do nothing;
insert into public.app_settings (k, v) values ('currency', 'USD') on conflict do nothing;
insert into public.app_settings (k, v) values ('mpesa_number', '+254 702 129 847') on conflict do nothing;
-- classes for independent learners (no teacher, no school): one per course, using the same lessons as the main class
insert into public.classes (name, programme, teacher_id, owner_kind, self_study, follows, subject, level, description, listed)
  select m.name || ' · Independent learners', m.programme, m.teacher_id, 'main', true, m.site_slug, m.subject, m.level,
         'Learn on your own at your own pace: lessons with instant feedback, quizzes and your personal learning profile.', true
    from public.classes m
   where m.site_slug is not null and m.site_slug not in ('grade-11', 'grade-12') and m.owner_kind = 'main' and m.archived_at is null
     and not exists (select 1 from public.classes x where x.self_study and x.follows = m.site_slug);
-- the admin types the M-Pesa number and name on the Admin page (Payments tab); nothing is shown to payers until then

-- no personal name on the site: content that mentions the owner by name now says Learnova
do $$
declare r record; n int;
begin
  for r in select c.table_name, c.column_name from information_schema.columns c
            where c.table_schema = 'public' and c.data_type = 'text'
              and c.table_name in ('topics', 'resources', 'lessons', 'lesson_notes', 'lesson_specs', 'quizzes', 'questions', 'subjects', 'sims', 'feedback_rules')
  loop
    execute format($f$update public.%I set %I =
      regexp_replace(regexp_replace(regexp_replace(%I, '(Mr\.? )?George (Edwin )?Apidi(''s)?', 'Learnova', 'gi'), 'Mr\.? Apidi(''s)?', 'Learnova', 'gi'), 'georgeapidi@gmail\.com', 'biosciencevista.com', 'gi')
      where %I ~* 'apidi'$f$, r.table_name, r.column_name, r.column_name, r.column_name);
  end loop;
end $$;

grant execute on function public.premium_ok(uuid), public.my_class_ids(), public.owns_class(uuid), public.in_my_school_class(uuid),
  public.is_school_teacher(), public.can_message(uuid) to authenticated;

commit;

select 'migration 022 done' as result,
  (select count(*) from public.enrolments) as enrolments,
  (select count(*) from public.profiles where premium_free) as free_access,
  (select string_agg(name || '→' || site_slug, ', ') from public.classes where site_slug is not null) as class_pages;
