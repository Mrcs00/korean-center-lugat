-- ============================================================================
-- Korean Center — PLATFORM UPGRADE (Admin / Ustoz / O'quvchi)
-- Run this ONCE in Supabase → SQL Editor, AFTER all the earlier schema files.
-- It is safe to run more than once.
--
-- BEFORE RUNNING: take a backup (Supabase → Database → Backups).
--
-- What it does
--   1. Adds the "admin" role. Ustoz (teacher) sees ONLY the groups they teach;
--      the admin sees everything; a student sees only their own data.
--   2. Adds the tables for courses, branches, schedule/lessons, attendance,
--      homework + submissions, materials, payments, announcements,
--      notifications and platform settings.
--   3. Rewrites the access rules (Row Level Security) of the old tables for
--      the three roles, and locks the new ones down.
--   4. Creates a private file bucket for homework files.
--
-- AFTER RUNNING: if more than one teacher account existed, nobody was promoted
-- automatically. Make yourself admin with (put your own login):
--     update profiles set role = 'admin' where username = 'YOUR_LOGIN';
-- ============================================================================

create extension if not exists pgcrypto;

-- ── 1. Roles ────────────────────────────────────────────────────────────────
-- Drop whatever check constraint limits profiles.role (its name can differ),
-- then allow the three roles.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_role_check check (role in ('student', 'teacher', 'admin'));

alter table public.profiles
  add column if not exists status text not null default 'active',
  add column if not exists branch_id uuid;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_status_check') then
    alter table public.profiles add constraint profiles_status_check check (status in ('active', 'inactive'));
  end if;
end $$;

-- ── 2. Reference tables ─────────────────────────────────────────────────────
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_branch_fk') then
    alter table public.profiles add constraint profiles_branch_fk
      foreign key (branch_id) references public.branches(id) on delete set null;
  end if;
end $$;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  level text,
  description text,
  duration_weeks int,
  image_url text,
  monthly_price numeric not null default 0,
  vocab_book text,            -- e.g. '1a' links the course to the Seoul book vocabulary
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.groups
  add column if not exists course_id uuid references public.courses(id) on delete set null,
  add column if not exists teacher_id uuid references public.profiles(id) on delete set null,
  add column if not exists branch_id uuid references public.branches(id) on delete set null,
  add column if not exists level text,
  add column if not exists lesson_days int[] not null default '{}',   -- 1 = Monday … 7 = Sunday
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists status text not null default 'active',
  add column if not exists monthly_price numeric,
  add column if not exists created_at timestamptz not null default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'groups_status_check') then
    alter table public.groups add constraint groups_status_check
      check (status in ('new', 'active', 'finished', 'cancelled'));
  end if;
end $$;

create table if not exists public.profile_details (
  id uuid primary key references public.profiles(id) on delete cascade,
  phone text,
  birth_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── 3. Lessons, attendance ──────────────────────────────────────────────────
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  lesson_date date not null,
  start_time time,
  end_time time,
  topic text,
  status text not null default 'planned' check (status in ('planned', 'done', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (group_id, lesson_date)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('present', 'late', 'absent', 'excused')),
  note text,
  marked_by uuid references public.profiles(id) on delete set null,
  marked_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

-- ── 4. Homework ─────────────────────────────────────────────────────────────
create table if not exists public.homework (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  description text,
  type text not null default 'written' check (type in ('written', 'file', 'reading', 'other')),
  points int not null default 100,
  assigned_at date not null default current_date,
  due_at timestamptz,
  attachments jsonb not null default '[]'::jsonb,   -- [{name, path, type}]
  student_ids uuid[],                               -- NULL = the whole group
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  answer text,
  attachments jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'reviewing', 'needs_revision', 'graded')),
  score numeric,
  feedback text,
  mistakes text,
  attempt int not null default 1,
  submitted_at timestamptz,
  graded_at timestamptz,
  graded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (homework_id, student_id)
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  kind text not null default 'link' check (kind in ('link', 'file')),
  url text,
  path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (group_id is not null or course_id is not null)
);

-- ── 5. Money, announcements, notifications ──────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  amount numeric not null check (amount > 0),
  paid_at date not null default current_date,
  method text not null default 'cash' check (method in ('cash', 'click', 'payme', 'bank', 'other')),
  status text not null default 'paid' check (status in ('paid', 'pending')),
  period text not null check (period ~ '^[0-9]{4}-[0-9]{2}$'),   -- the month it pays for, e.g. 2026-11
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_url text,
  audience text not null default 'all_students'
    check (audience in ('all_students', 'group', 'teachers', 'everyone')),
  group_id uuid references public.groups(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists lessons_group_date_idx on public.lessons (group_id, lesson_date);
create index if not exists attendance_student_idx on public.attendance (student_id);
create index if not exists homework_group_idx on public.homework (group_id, due_at);
create index if not exists payments_student_idx on public.payments (student_id, period);
create index if not exists group_members_student_idx on public.group_members (student_id);

-- The old vocabulary-assignment table must survive a teacher being deleted.
alter table public.assignments alter column created_by drop not null;

-- ── 6. Helper functions (SECURITY DEFINER so the rules below never recurse) ─
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- Kept for older code: true only for a real teacher account.
create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'teacher' from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin', 'teacher') from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.teaches_group(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.groups g where g.id = gid and g.teacher_id = auth.uid())
$$;

create or replace function public.is_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members m where m.group_id = gid and m.student_id = auth.uid())
$$;

create or replace function public.teaches_student(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.group_members m join public.groups g on g.id = m.group_id
    where m.student_id = sid and g.teacher_id = auth.uid()
  )
$$;

create or replace function public.is_my_teacher(tid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.group_members m join public.groups g on g.id = m.group_id
    where m.student_id = auth.uid() and g.teacher_id = tid
  )
$$;

create or replace function public.shares_group(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_my_teacher(uid) or exists (
    select 1 from public.group_members a join public.group_members b on b.group_id = a.group_id
    where a.student_id = auth.uid() and b.student_id = uid
  )
$$;

create or replace function public.teaches_lesson(lid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.lessons l join public.groups g on g.id = l.group_id
    where l.id = lid and g.teacher_id = auth.uid()
  )
$$;

create or replace function public.teaches_homework(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.homework h join public.groups g on g.id = h.group_id
    where h.id = hid and g.teacher_id = auth.uid()
  )
$$;

-- Can this student see/submit this homework? (member of the group, and either
-- the whole group is targeted or the student is listed)
create or replace function public.can_see_homework(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.homework h
    where h.id = hid and public.is_member(h.group_id)
      and (h.student_ids is null or auth.uid() = any (h.student_ids))
  )
$$;

create or replace function public.in_course(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.group_members m join public.groups g on g.id = m.group_id
    where m.student_id = auth.uid() and g.course_id = cid
  ) or exists (
    select 1 from public.groups g where g.course_id = cid and g.teacher_id = auth.uid()
  )
$$;

create or replace function public.setting_bool(k text, d boolean) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case when jsonb_typeof(value) = 'boolean' then (value #>> '{}')::boolean else d end
       from public.app_settings where key = k),
    d)
$$;

create or replace function public.try_uuid(t text) returns uuid
language plpgsql immutable as $$
begin
  return t::uuid;
exception when others then
  return null;
end;
$$;

-- ── 7. Account triggers ─────────────────────────────────────────────────────
-- Every NEW account starts as a student, whatever the browser asks for. The
-- admin makes someone a teacher through the server (service key) or SQL.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username'),
    'student'
  );

  if new.raw_user_meta_data->>'phone' is not null or new.raw_user_meta_data->>'birth_date' is not null then
    insert into public.profile_details (id, phone, birth_date)
    values (
      new.id,
      nullif(new.raw_user_meta_data->>'phone', ''),
      nullif(new.raw_user_meta_data->>'birth_date', '')::date
    )
    on conflict (id) do nothing;
  end if;

  if new.raw_user_meta_data->>'group_id' is not null then
    insert into public.group_members (group_id, student_id)
    values ((new.raw_user_meta_data->>'group_id')::uuid, new.id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

-- Role, login name, status and branch can only be changed by the admin
-- (and role only from SQL / the server key).
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    new.role := old.role;
    if not public.is_admin() then
      new.username := old.username;
      new.status := old.status;
      new.branch_id := old.branch_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- A student may only write their own answer; the grade, feedback and the
-- review status belong to the teacher.
create or replace function public.guard_submission()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  staff boolean := coalesce(public.is_admin(), false) or public.teaches_homework(coalesce(new.homework_id, old.homework_id));
begin
  new.updated_at := now();

  if tg_op = 'INSERT' then
    if not staff then
      new.score := null; new.feedback := null; new.mistakes := null;
      new.graded_at := null; new.graded_by := null; new.attempt := 1;
      if new.status not in ('draft', 'submitted') then new.status := 'draft'; end if;
    end if;
    if new.status = 'submitted' and new.submitted_at is null then new.submitted_at := now(); end if;
    return new;
  end if;

  if not staff then
    -- student update
    new.student_id := old.student_id;
    new.homework_id := old.homework_id;
    new.score := old.score; new.feedback := old.feedback; new.mistakes := old.mistakes;
    new.graded_at := old.graded_at; new.graded_by := old.graded_by; new.attempt := old.attempt;
    if old.status in ('graded', 'reviewing') then
      -- once the teacher is reviewing or has graded it, the answer is closed
      new.answer := old.answer; new.attachments := old.attachments; new.status := old.status;
    elsif new.status not in ('draft', 'submitted') then
      new.status := old.status;
    end if;
    if old.status = 'needs_revision' and new.status = 'submitted' then
      new.attempt := old.attempt + 1;
    end if;
  else
    if new.status in ('graded', 'needs_revision') and old.status is distinct from new.status then
      new.graded_at := now();
      new.graded_by := auth.uid();
    end if;
  end if;

  if new.status = 'submitted' and old.status is distinct from 'submitted' then
    new.submitted_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists guard_submission on public.homework_submissions;
create trigger guard_submission
  before insert or update on public.homework_submissions
  for each row execute function public.guard_submission();

-- ── 8. Notification triggers ────────────────────────────────────────────────
create or replace function public.notify_users(uids uuid[], t text, ttl text, bdy text, lnk text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  select u, t, ttl, bdy, lnk
  from unnest(uids) as u
  where exists (select 1 from public.profiles p where p.id = u);
end;
$$;

create or replace function public.trg_homework_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare ids uuid[];
begin
  if not public.setting_bool('notify_homework', true) then return new; end if;
  if new.student_ids is not null then
    ids := new.student_ids;
  else
    select coalesce(array_agg(student_id), '{}') into ids from public.group_members where group_id = new.group_id;
  end if;
  perform public.notify_users(ids, 'homework', 'Yangi vazifa: ' || new.title,
    case when new.due_at is not null then 'Muddat: ' || to_char(new.due_at at time zone 'Asia/Tashkent', 'DD.MM.YYYY HH24:MI') end,
    '/student/homework/' || new.id);
  return new;
end;
$$;
drop trigger if exists homework_notify on public.homework;
create trigger homework_notify after insert on public.homework
  for each row execute function public.trg_homework_notify();

create or replace function public.trg_submission_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare hw record; tid uuid; sname text;
begin
  select h.id, h.title, h.group_id, g.teacher_id into hw
  from public.homework h join public.groups g on g.id = h.group_id where h.id = new.homework_id;

  if new.status = 'submitted' and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    tid := hw.teacher_id;
    if tid is not null then
      select full_name into sname from public.profiles where id = new.student_id;
      perform public.notify_users(array[tid], 'submission', 'Yangi topshiriq: ' || hw.title,
        coalesce(sname, 'O''quvchi') || ' vazifani topshirdi', '/teacher/homework/' || hw.id);
    end if;
  elsif tg_op = 'UPDATE' and new.status in ('graded', 'needs_revision')
        and old.status is distinct from new.status
        and public.setting_bool('notify_grade', true) then
    perform public.notify_users(array[new.student_id], 'grade',
      case when new.status = 'graded' then 'Vazifa baholandi: ' || hw.title
           else 'Qayta ishlash kerak: ' || hw.title end,
      new.feedback, '/student/homework/' || hw.id);
  end if;
  return new;
end;
$$;
drop trigger if exists submission_notify on public.homework_submissions;
create trigger submission_notify after insert or update on public.homework_submissions
  for each row execute function public.trg_submission_notify();

create or replace function public.trg_announcement_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare ids uuid[];
begin
  if not public.setting_bool('notify_announcement', true) then return new; end if;
  if new.audience = 'everyone' then
    select coalesce(array_agg(id), '{}') into ids from public.profiles where status = 'active' and id <> coalesce(new.created_by, '00000000-0000-0000-0000-000000000000');
  elsif new.audience = 'all_students' then
    select coalesce(array_agg(id), '{}') into ids from public.profiles where role = 'student' and status = 'active';
  elsif new.audience = 'teachers' then
    select coalesce(array_agg(id), '{}') into ids from public.profiles where role = 'teacher' and status = 'active';
  else
    select coalesce(array_agg(student_id), '{}') into ids from public.group_members where group_id = new.group_id;
    select ids || array_agg(teacher_id) into ids from public.groups where id = new.group_id and teacher_id is not null;
  end if;
  perform public.notify_users(coalesce(ids, '{}'), 'announcement', new.title, left(new.body, 140), '/student');
  return new;
end;
$$;
drop trigger if exists announcement_notify on public.announcements;
create trigger announcement_notify after insert on public.announcements
  for each row execute function public.trg_announcement_notify();

create or replace function public.trg_payment_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'paid' and public.setting_bool('notify_payment', true) then
    perform public.notify_users(array[new.student_id], 'payment', 'To''lov qabul qilindi',
      to_char(new.amount, 'FM999G999G999') || ' so''m · ' || new.period, '/student/payments');
  end if;
  return new;
end;
$$;
drop trigger if exists payment_notify on public.payments;
create trigger payment_notify after insert on public.payments
  for each row execute function public.trg_payment_notify();

create or replace function public.trg_member_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare gname text; sid uuid; gid uuid;
begin
  if not public.setting_bool('notify_group_change', true) then
    return coalesce(new, old);
  end if;
  sid := coalesce(new.student_id, old.student_id);
  gid := coalesce(new.group_id, old.group_id);
  select name into gname from public.groups where id = gid;
  if gname is null then return coalesce(new, old); end if;   -- the group itself is being deleted
  if tg_op = 'INSERT' then
    perform public.notify_users(array[sid], 'group', 'Guruhga qo''shildingiz', gname, '/student/courses');
  else
    perform public.notify_users(array[sid], 'group', 'Guruhdan chiqarildingiz', gname, '/student/courses');
  end if;
  return coalesce(new, old);
end;
$$;
drop trigger if exists member_notify on public.group_members;
create trigger member_notify after insert or delete on public.group_members
  for each row execute function public.trg_member_notify();

create or replace function public.trg_lesson_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare ids uuid[];
begin
  if new.topic is null or new.topic = '' or new.lesson_date < current_date then return new; end if;
  if tg_op = 'UPDATE' and old.topic is not distinct from new.topic then return new; end if;
  select coalesce(array_agg(student_id), '{}') into ids from public.group_members where group_id = new.group_id;
  perform public.notify_users(ids, 'lesson', 'Dars mavzusi: ' || new.topic,
    to_char(new.lesson_date, 'DD.MM.YYYY'), '/student/schedule');
  return new;
end;
$$;
drop trigger if exists lesson_notify on public.lessons;
create trigger lesson_notify after insert or update on public.lessons
  for each row execute function public.trg_lesson_notify();

-- ── 9. Row Level Security ───────────────────────────────────────────────────
alter table public.branches enable row level security;
alter table public.courses enable row level security;
alter table public.profile_details enable row level security;
alter table public.app_settings enable row level security;
alter table public.lessons enable row level security;
alter table public.attendance enable row level security;
alter table public.homework enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.materials enable row level security;
alter table public.payments enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;

-- Drop every policy this upgrade replaces (old names from the earlier SQL files).
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and (
      (tablename = 'profiles' and policyname in
        ('profiles readable by signed-in users', 'teachers can read all profiles', 'users can update their own profile', 'own profile'))
      or (tablename = 'groups' and policyname in
        ('groups readable by anyone', 'teachers can create groups', 'teachers can delete groups'))
      or (tablename = 'group_members' and policyname in
        ('group members readable by signed-in users', 'users can join a group themselves',
         'users can leave/switch their own group', 'teachers can read all group memberships',
         'teachers can add students to groups', 'teachers can remove students from groups'))
      or (tablename = 'vocabulary_progress' and policyname in
        ('teachers can read all vocabulary progress', 'teacher reads group progress'))
      or (tablename = 'exam_attempts' and policyname = 'teachers can read all exam attempts')
      or (tablename = 'exam_answers' and policyname = 'teachers can read all exam answers')
      or (tablename = 'assignments' and policyname in
        ('teachers manage assignments', 'students view own group assignments'))
    )
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- Our own policies are re-created on every run.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and policyname like 'kc\_%' escape '\'
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- profiles: yourself, the admin, the teacher of your group, your classmates
create policy kc_profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin() or public.teaches_student(id) or public.shares_group(id));
create policy kc_profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- profile_details (phone, birthday): private
create policy kc_details_select on public.profile_details for select
  using (id = auth.uid() or public.is_admin() or public.teaches_student(id) or public.is_my_teacher(id));
create policy kc_details_insert on public.profile_details for insert
  with check (id = auth.uid() or public.is_admin());
create policy kc_details_update on public.profile_details for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- groups / membership
create policy kc_groups_select on public.groups for select using (auth.role() = 'authenticated');
create policy kc_groups_admin on public.groups for all using (public.is_admin()) with check (public.is_admin());

create policy kc_members_select on public.group_members for select
  using (student_id = auth.uid() or public.is_admin() or public.teaches_group(group_id) or public.is_member(group_id));
create policy kc_members_admin on public.group_members for all
  using (public.is_admin()) with check (public.is_admin());

-- reference data: everyone signed in may read, only the admin writes
create policy kc_courses_select on public.courses for select using (auth.role() = 'authenticated');
create policy kc_courses_admin on public.courses for all using (public.is_admin()) with check (public.is_admin());
create policy kc_branches_select on public.branches for select using (auth.role() = 'authenticated');
create policy kc_branches_admin on public.branches for all using (public.is_admin()) with check (public.is_admin());
create policy kc_settings_select on public.app_settings for select using (auth.role() = 'authenticated');
create policy kc_settings_admin on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

-- lessons / attendance
create policy kc_lessons_select on public.lessons for select
  using (public.is_admin() or public.teaches_group(group_id) or public.is_member(group_id));
create policy kc_lessons_write on public.lessons for all
  using (public.is_admin() or public.teaches_group(group_id))
  with check (public.is_admin() or public.teaches_group(group_id));

create policy kc_attendance_select on public.attendance for select
  using (student_id = auth.uid() or public.is_admin() or public.teaches_lesson(lesson_id));
create policy kc_attendance_write on public.attendance for all
  using (public.is_admin() or public.teaches_lesson(lesson_id))
  with check (public.is_admin() or public.teaches_lesson(lesson_id));

-- homework
create policy kc_homework_select on public.homework for select
  using (public.is_admin() or public.teaches_group(group_id) or public.can_see_homework(id));
create policy kc_homework_write on public.homework for all
  using (public.is_admin() or public.teaches_group(group_id))
  with check (public.is_admin() or public.teaches_group(group_id));

create policy kc_submissions_select on public.homework_submissions for select
  using (student_id = auth.uid() or public.is_admin() or public.teaches_homework(homework_id));
create policy kc_submissions_insert on public.homework_submissions for insert
  with check (
    public.is_admin() or public.teaches_homework(homework_id)
    or (student_id = auth.uid() and public.can_see_homework(homework_id))
  );
create policy kc_submissions_update on public.homework_submissions for update
  using (student_id = auth.uid() or public.is_admin() or public.teaches_homework(homework_id))
  with check (student_id = auth.uid() or public.is_admin() or public.teaches_homework(homework_id));
create policy kc_submissions_delete on public.homework_submissions for delete
  using (public.is_admin());

-- materials
create policy kc_materials_select on public.materials for select
  using (
    public.is_admin()
    or (group_id is not null and (public.teaches_group(group_id) or public.is_member(group_id)))
    or (course_id is not null and public.in_course(course_id))
  );
create policy kc_materials_write on public.materials for all
  using (public.is_admin() or (group_id is not null and public.teaches_group(group_id)))
  with check (public.is_admin() or (group_id is not null and public.teaches_group(group_id)));

-- payments: the student sees their own; the admin everything; teachers only if enabled
create policy kc_payments_select on public.payments for select
  using (
    student_id = auth.uid() or public.is_admin()
    or (public.setting_bool('teacher_view_payments', false) and public.teaches_student(student_id))
  );
create policy kc_payments_admin on public.payments for all
  using (public.is_admin()) with check (public.is_admin());

-- announcements
create policy kc_announcements_select on public.announcements for select
  using (
    public.is_admin() or created_by = auth.uid()
    or audience = 'everyone'
    or (audience = 'all_students' and public.my_role() = 'student')
    or (audience = 'teachers' and public.my_role() = 'teacher')
    or (audience = 'group' and (public.is_member(group_id) or public.teaches_group(group_id)))
  );
create policy kc_announcements_insert on public.announcements for insert
  with check (
    public.is_admin()
    or (
      public.my_role() = 'teacher' and created_by = auth.uid() and audience = 'group'
      and public.teaches_group(group_id) and public.setting_bool('teacher_announcements', true)
    )
  );
create policy kc_announcements_modify on public.announcements for update
  using (public.is_admin() or created_by = auth.uid()) with check (public.is_admin() or created_by = auth.uid());
create policy kc_announcements_delete on public.announcements for delete
  using (public.is_admin() or created_by = auth.uid());

-- notifications: only your own (they are created by the triggers above)
create policy kc_notifications_select on public.notifications for select using (user_id = auth.uid());
create policy kc_notifications_update on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy kc_notifications_delete on public.notifications for delete using (user_id = auth.uid());

-- vocabulary progress and exams: the student, the admin, and the student's teacher
create policy kc_progress_staff on public.vocabulary_progress for select
  using (public.is_admin() or public.teaches_student(student_id));
create policy kc_attempts_staff on public.exam_attempts for select
  using (public.is_admin() or public.teaches_student(student_id));
create policy kc_answers_staff on public.exam_answers for select
  using (public.is_admin() or public.teaches_student(student_id));

-- vocabulary assignments (the old "topshiriq"): admin, or the teacher of that group
create policy kc_assignments_staff on public.assignments for all
  using (public.is_admin() or public.teaches_group(group_id))
  with check (public.is_admin() or public.teaches_group(group_id));
create policy kc_assignments_student on public.assignments for select
  using (public.is_member(group_id));

-- Deleting accounts from SQL helper: only an admin may call it.
create or replace function public.delete_students(student_ids uuid[])
returns integer language plpgsql security definer set search_path = public, auth as $$
declare deleted_count integer;
begin
  if not public.is_admin() then
    raise exception 'Faqat admin akkauntlarni o''chira oladi';
  end if;
  delete from auth.users
  where id = any(student_ids) and id <> auth.uid()
    and id in (select p.id from public.profiles p where p.role = 'student');
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- ── 10. File storage (private bucket) ───────────────────────────────────────
-- Path rules:
--   hw/<group_id>/<file>                      teacher's homework attachments
--   sub/<homework_id>/<student_id>/<file>     a student's submission files
--   mat/g/<group_id>/<file>                   group materials
insert into storage.buckets (id, name, public, file_size_limit)
values ('homework-files', 'homework-files', false, 10485760)
on conflict (id) do update set file_size_limit = excluded.file_size_limit, public = false;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'kc\_%' escape '\'
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

create policy kc_files_select on storage.objects for select
  using (
    bucket_id = 'homework-files' and (
      public.is_admin()
      or ((storage.foldername(name))[1] in ('hw') and (
            public.teaches_group(public.try_uuid((storage.foldername(name))[2]))
            or public.is_member(public.try_uuid((storage.foldername(name))[2]))))
      or ((storage.foldername(name))[1] = 'mat' and (storage.foldername(name))[2] = 'g' and (
            public.teaches_group(public.try_uuid((storage.foldername(name))[3]))
            or public.is_member(public.try_uuid((storage.foldername(name))[3]))))
      or ((storage.foldername(name))[1] = 'sub' and (
            (storage.foldername(name))[3] = auth.uid()::text
            or public.teaches_homework(public.try_uuid((storage.foldername(name))[2]))))
    )
  );

create policy kc_files_insert on storage.objects for insert
  with check (
    bucket_id = 'homework-files' and (
      public.is_admin()
      or ((storage.foldername(name))[1] = 'hw' and public.teaches_group(public.try_uuid((storage.foldername(name))[2])))
      or ((storage.foldername(name))[1] = 'mat' and (storage.foldername(name))[2] = 'g'
          and public.teaches_group(public.try_uuid((storage.foldername(name))[3])))
      or ((storage.foldername(name))[1] = 'sub' and (storage.foldername(name))[3] = auth.uid()::text
          and public.can_see_homework(public.try_uuid((storage.foldername(name))[2])))
    )
  );

create policy kc_files_delete on storage.objects for delete
  using (
    bucket_id = 'homework-files' and (
      public.is_admin()
      or ((storage.foldername(name))[1] = 'hw' and public.teaches_group(public.try_uuid((storage.foldername(name))[2])))
      or ((storage.foldername(name))[1] = 'mat' and (storage.foldername(name))[2] = 'g'
          and public.teaches_group(public.try_uuid((storage.foldername(name))[3])))
      or ((storage.foldername(name))[1] = 'sub' and (storage.foldername(name))[3] = auth.uid()::text)
    )
  );

-- ── 11. Defaults ────────────────────────────────────────────────────────────
insert into public.app_settings (key, value) values
  ('platform_name', '"Korean Center"'),
  ('logo_url', '""'),
  ('accent_color', '"#FEDD00"'),
  ('contact_phone', '""'),
  ('contact_address', '""'),
  ('contact_telegram', '""'),
  ('payment_due_day', '5'),
  ('default_lesson_minutes', '90'),
  ('teacher_announcements', 'true'),
  ('teacher_view_payments', 'false'),
  ('notify_homework', 'true'),
  ('notify_grade', 'true'),
  ('notify_announcement', 'true'),
  ('notify_payment', 'true'),
  ('notify_group_change', 'true')
on conflict (key) do nothing;

insert into public.courses (name, level, vocab_book, description) values
  ('SNU 1A', '1A', '1a', '서울대 한국어 1A'),
  ('SNU 1B', '1B', '1b', '서울대 한국어 1B'),
  ('SNU 2A', '2A', '2a', '서울대 한국어 2A'),
  ('SNU 2B', '2B', '2b', '서울대 한국어 2B'),
  ('SNU 3A', '3A', '3a', '서울대 한국어 3A'),
  ('SNU 3B', '3B', '3b', '서울대 한국어 3B')
on conflict (name) do nothing;

-- If exactly one teacher account exists, that is you: promote to admin.
do $$
declare n int;
begin
  select count(*) into n from public.profiles where role = 'teacher';
  if n = 1 and not exists (select 1 from public.profiles where role = 'admin') then
    update public.profiles set role = 'admin' where role = 'teacher';
    raise notice 'The only teacher account was promoted to admin.';
  elsif not exists (select 1 from public.profiles where role = 'admin') then
    raise notice 'No admin yet! Run: update profiles set role = ''admin'' where username = ''YOUR_LOGIN'';';
  end if;
end $$;
