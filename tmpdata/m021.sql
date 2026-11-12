-- Learnova · migration 021: private messages (students ↔ teachers ↔ admin) and archiving or removing classes.
-- Needs migrations up to 020. Safe to run again.

-- 1. Messages. Students (and parents) write to teachers and admins; teachers and admins write to anyone.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references auth.users(id) on delete cascade,
  recipient uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_recipient on public.messages (recipient, created_at desc);
create index if not exists messages_sender on public.messages (sender, created_at desc);
alter table public.messages enable row level security;

create or replace function public.is_staff_user(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = u and role in ('teacher', 'admin'))
$$;

drop policy if exists msg_read on public.messages;
create policy msg_read on public.messages for select to authenticated using (sender = auth.uid() or recipient = auth.uid());
drop policy if exists msg_send on public.messages;
create policy msg_send on public.messages for insert to authenticated
  with check (sender = auth.uid() and recipient <> auth.uid() and read_at is null and (public.is_staff() or public.is_staff_user(recipient)));
drop policy if exists msg_mark_read on public.messages;
create policy msg_mark_read on public.messages for update to authenticated using (recipient = auth.uid()) with check (recipient = auth.uid());
drop policy if exists msg_delete_own on public.messages;
create policy msg_delete_own on public.messages for delete to authenticated using (sender = auth.uid() and read_at is null);

create or replace function public.msg_guard() returns trigger language plpgsql as $$
begin   -- the reader can only mark a message read; nothing else changes
  if new.sender <> old.sender or new.recipient <> old.recipient or new.body <> old.body or new.created_at <> old.created_at then
    raise exception 'Messages cannot be edited.';
  end if;
  return new;
end $$;
drop trigger if exists msg_guard on public.messages;
create trigger msg_guard before update on public.messages for each row execute function public.msg_guard();

-- People this user may write to: students and parents see the teachers and admins; staff see everyone.
create or replace function public.message_contacts()
returns table (id uuid, name text, role text, class_name text)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(p.full_name, ''), 'Unnamed'),
         case when exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'admin') then 'Admin'
              when exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'teacher') then 'Teacher'
              when exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'parent') then 'Parent'
              else 'Student' end,
         c.name
  from public.profiles p left join public.classes c on c.id = p.class_id
  where auth.uid() is not null and p.id <> auth.uid()
    and (public.is_staff() or public.is_staff_user(p.id))
  order by 3, 4 nulls first, 2
$$;
revoke all on function public.message_contacts() from public, anon;
grant execute on function public.message_contacts() to authenticated;

create or replace function public.unread_messages() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.messages where recipient = auth.uid() and read_at is null
$$;
grant execute on function public.unread_messages() to authenticated;

-- 2. Archiving classes (for example when the teacher changes school). Lessons, quizzes, notes and simulations are kept.
--    Students in an archived class lose access until the class is restored. Removing a class deletes only the class
--    and its class links; its students are taken out of it and need approval again.
alter table public.classes add column if not exists archived_at timestamptz;

create or replace function public.is_approved() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.approved and not exists (select 1 from public.classes c where c.id = p.class_id and c.archived_at is not null)
                   from public.profiles p where p.id = auth.uid()), false) or public.is_staff();
$$;

create or replace function public.archive_class(cid uuid, archive boolean default true) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only an admin can archive classes.'; end if;
  update public.classes set archived_at = case when archive then coalesce(archived_at, now()) end,
                            active = case when archive then false else active end
  where id = cid;
end $$;
revoke all on function public.archive_class(uuid, boolean) from public, anon;
grant execute on function public.archive_class(uuid, boolean) to authenticated;

create or replace function public.remove_class(cid uuid) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'Only an admin can remove classes.'; end if;
  update public.profiles set class_id = null, approved = false
   where class_id = cid and not exists (select 1 from public.user_roles r where r.user_id = profiles.id and r.role in ('teacher', 'admin'));
  get diagnostics n = row_count;
  update public.profiles set class_id = null where class_id = cid;   -- staff test accounts just leave the class
  delete from public.classes where id = cid;
  return n;
end $$;
revoke all on function public.remove_class(uuid) from public, anon;
grant execute on function public.remove_class(uuid) to authenticated;

select 'migration 021 done' as result;
