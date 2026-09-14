-- Korean Center Lug'at — Teacher group creation
-- Run this in Supabase SQL Editor AFTER teacher-schema.sql.
--
-- Lets teachers create new groups directly from the teacher panel
-- (previously only possible via SQL Editor).

create policy "teachers can create groups" on groups
  for insert with check (public.is_teacher());
