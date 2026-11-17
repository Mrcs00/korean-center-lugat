-- Korean Center Lug'at — security fix
-- Run this in Supabase SQL Editor (safe to run more than once).
--
-- Closes three holes found in the original schema:
--
--  1. A student could make THEMSELVES a teacher: the "update own profile"
--     policy allowed changing every column, including `role`, straight from
--     the browser. Now `role` can no longer be changed through the app
--     (only you can, in the SQL editor: update profiles set role = 'teacher'
--     where username = '...').
--
--  2. Anyone could sign up AS a teacher, because the profile-creating trigger
--     trusted the `role` sent by the browser. Now every new account is a
--     student.
--
--  3. A student could add themselves to (or remove themselves from) any
--     group. That also let them see assignments — including hidden book
--     exams — sent to groups they do not belong to. Group membership is now
--     managed only by teachers (see teacher-members-schema.sql) and by the
--     account-creation flow.

-- 1) role cannot be changed from the app -----------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- auth.uid() is NULL when the SQL editor / service key makes the change.
  if new.role is distinct from old.role and auth.uid() is not null then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- 2) every new account is a student ---------------------------------------
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
    'student'
  );

  if new.raw_user_meta_data->>'group_id' is not null then
    insert into public.group_members (group_id, student_id)
    values ((new.raw_user_meta_data->>'group_id')::uuid, new.id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

-- 3) students cannot move themselves between groups -----------------------
drop policy if exists "users can join a group themselves" on public.group_members;
drop policy if exists "users can leave/switch their own group" on public.group_members;
