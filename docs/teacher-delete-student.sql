-- Korean Center Lug'at — Teacher can delete student accounts
-- Run this in Supabase SQL Editor AFTER teacher-schema.sql.
--
-- Deleting a login account needs access to auth.users, which the browser can
-- never touch directly. This function does it safely on the server side:
--   * only a teacher can call it (checked with is_teacher())
--   * only accounts with role = 'student' are deleted — never a teacher
--     account, and never the caller's own account
--   * everything that belongs to the student (profile, group membership,
--     progress, exam attempts and answers) is removed automatically through
--     the existing ON DELETE CASCADE rules.
-- Returns how many accounts were actually deleted.

create or replace function public.delete_students(student_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  deleted_count integer;
begin
  if not public.is_teacher() then
    raise exception 'Faqat o''qituvchi akkauntlarni o''chira oladi';
  end if;

  delete from auth.users
  where id = any(student_ids)
    and id <> auth.uid()
    and id in (select p.id from public.profiles p where p.role = 'student');

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_students(uuid[]) from public, anon;
grant execute on function public.delete_students(uuid[]) to authenticated;
