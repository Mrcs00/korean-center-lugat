-- Korean Center Lug'at — Auth / Groups schema
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.
--
-- Before running this, also do the following in the dashboard:
--   Authentication → Sign In / Providers → Email → turn OFF "Confirm email"
--   (registration uses a username, not a real email, so there is no inbox
--   to click a confirmation link in — this lets signUp() return a session
--   immediately).

create extension if not exists "pgcrypto";

-- ── Groups ───────────────────────────────────────────────────────────────
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

insert into groups (name) values
  ('TOPIK 3 — Guruh A'),
  ('TOPIK 4 — Guruh B'),
  ('TOPIK 5 — Guruh C')
on conflict (name) do nothing;

-- ── Profiles ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now()
);

-- ── Group membership ────────────────────────────────────────────────────
create table if not exists group_members (
  group_id uuid not null references groups(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, student_id)
);

-- ── Auto-create profile (+ group membership) right after signup ────────
-- Reads the extra fields passed via supabase.auth.signUp({ options: { data } })
-- on the client, so registration is one atomic step.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username'),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );

  if new.raw_user_meta_data->>'group_id' is not null then
    insert into public.group_members (group_id, student_id)
    values ((new.raw_user_meta_data->>'group_id')::uuid, new.id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ───────────────────────────────────────────────────
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;

create policy "profiles readable by signed-in users" on profiles
  for select using (auth.role() = 'authenticated');
create policy "users can update their own profile" on profiles
  for update using (auth.uid() = id);

create policy "groups readable by anyone" on groups
  for select using (true);

create policy "group members readable by signed-in users" on group_members
  for select using (auth.role() = 'authenticated');
create policy "users can join a group themselves" on group_members
  for insert with check (auth.uid() = student_id);
create policy "users can leave/switch their own group" on group_members
  for delete using (auth.uid() = student_id);
