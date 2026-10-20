-- Korean Center Lug'at — Teacher can move students between groups
-- Run this in Supabase SQL Editor AFTER teacher-schema.sql.
--
-- Teachers could only READ group_members until now. These two policies let a
-- teacher add a student to a group and remove a student from a group, which
-- is what "move to another group" in the teacher panel does.

create policy "teachers can add students to groups" on group_members
  for insert with check (public.is_teacher());

create policy "teachers can remove students from groups" on group_members
  for delete using (public.is_teacher());
