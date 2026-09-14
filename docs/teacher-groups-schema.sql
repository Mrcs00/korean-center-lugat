-- Korean Center Lug'at — Teacher group creation
-- Run this in Supabase SQL Editor AFTER teacher-schema.sql.
--
-- Lets teachers create new groups directly from the teacher panel
-- (previously only possible via SQL Editor).

create policy "teachers can create groups" on groups
  for insert with check (public.is_teacher());

-- ── Deleting a group ─────────────────────────────────────────────────────
-- Lets teachers delete groups from the teacher panel (group_members rows
-- for that group are removed automatically via the ON DELETE CASCADE on
-- group_members.group_id, defined in auth-schema.sql).
create policy "teachers can delete groups" on groups
  for delete using (public.is_teacher());
