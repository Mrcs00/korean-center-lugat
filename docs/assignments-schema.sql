-- Korean Center Lug'at — Teacher assignments
-- Run this in Supabase SQL Editor AFTER auth-schema.sql, progress-schema.sql,
-- teacher-schema.sql and teacher-groups-schema.sql.
--
-- Previously assignments were only stored in the teacher's own browser
-- (localStorage), so students never actually saw them. This moves them
-- into a real, shared table.

create table if not exists assignments (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups(id) on delete cascade,
  set_id text not null,
  deadline date,
  minimum_mastery int not null default 70,
  created_by uuid not null references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table assignments enable row level security;

-- Teachers can create, read, and delete any assignment.
create policy "teachers manage assignments" on assignments
  for all using (public.is_teacher()) with check (public.is_teacher());

-- Students can only see assignments given to a group they belong to.
create policy "students view own group assignments" on assignments
  for select using (
    exists (
      select 1 from group_members
      where group_members.group_id = assignments.group_id
        and group_members.student_id = auth.uid()
    )
  );
