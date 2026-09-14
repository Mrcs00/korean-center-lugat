-- Korean Center Lug'at — Teacher visibility schema
-- Run this in Supabase SQL Editor AFTER auth-schema.sql and progress-schema.sql.
--
-- Grants any profile with role='teacher' read access to every student's
-- profile, group membership, and progress data (needed for the teacher
-- panel's real roster, group rosters, and analytics).

create or replace function public.is_teacher()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'teacher'
  );
$$;

create policy "teachers can read all profiles" on profiles
  for select using (public.is_teacher());

create policy "teachers can read all group memberships" on group_members
  for select using (public.is_teacher());

create policy "teachers can read all vocabulary progress" on vocabulary_progress
  for select using (public.is_teacher());

create policy "teachers can read all exam attempts" on exam_attempts
  for select using (public.is_teacher());

create policy "teachers can read all exam answers" on exam_answers
  for select using (public.is_teacher());

-- ── Turning an account into a teacher ───────────────────────────────────
-- There's no "register as teacher" form yet (registration always creates a
-- student). To make your own account a teacher, register normally at
-- /register, then run this once with your username:
--
--   update profiles set role = 'teacher' where username = 'your_username';
