-- Korean Center Lug'at — assignments: word ranges + book-wide exams
-- Run this in Supabase SQL Editor AFTER assignments-schema.sql.
--
-- word_from / word_to : optional 1-based word range inside the set
--                       (both NULL = the whole set, like before)
-- kind                : 'set' (normal vocabulary assignment, default) or
--                       'book_exam' (a book-wide exam sent by the teacher)
-- book_id             : which book, e.g. '1a' (only for kind = 'book_exam')
-- question_count      : how many random questions (only for 'book_exam')
--
-- Existing assignments keep working unchanged.

alter table assignments
  add column if not exists word_from int,
  add column if not exists word_to int,
  add column if not exists kind text not null default 'set' check (kind in ('set', 'book_exam')),
  add column if not exists book_id text,
  add column if not exists question_count int;
