-- Learnova · migration 020: class pages and learning materials open only for signed-in, approved accounts.
-- The site's pages are encrypted; the key is handed out only to staff and approved students (never to visitors,
-- signed-out users, parents or accounts waiting for approval). Safe to run again.
-- The key is made here, inside the database, the first time this runs (it is never written in a file or typed anywhere);
-- the build reads it back through site_key() while a teacher is signed in.

create table if not exists public.site_secrets (id int primary key check (id = 1), k text not null default '', updated_at timestamptz not null default now());
insert into public.site_secrets (id) values (1) on conflict (id) do nothing;
update public.site_secrets set k = encode(decode(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), updated_at = now()
where id = 1 and k = '';
alter table public.site_secrets enable row level security;   -- no policies: nobody reads the table directly
revoke all on public.site_secrets from anon, authenticated;

create or replace function public.site_key() returns text
language sql stable security definer set search_path = public as $$
  select s.k from public.site_secrets s
  where s.id = 1 and auth.uid() is not null and (public.is_staff() or public.is_approved())
$$;
revoke all on function public.site_key() from public, anon;
grant execute on function public.site_key() to authenticated;

-- Materials in the database also need an approved account (the lesson notes used to be readable without signing in).
drop policy if exists lesson_notes_read on public.lesson_notes;
create policy lesson_notes_read on public.lesson_notes for select to authenticated using (public.is_staff() or public.is_approved());
drop policy if exists topics_read on public.topics;
create policy topics_read on public.topics for select to authenticated using (public.is_staff() or (published and public.is_approved() and public.topic_for_me(id)));

select 'migration 020 done' as result, length(k) as key_length from public.site_secrets;
