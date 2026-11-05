-- Korean Center Lug'at — logic upgrade: verified mastery + attempt limit
-- Run this in Supabase SQL Editor AFTER the earlier schema files.
--
-- vocabulary_progress
--   verified_level      0..4  Mastery that comes ONLY from answers in a test or
--                             exam (never from the flashcard "Bilaman" button).
--                             It can only rise once the review interval has
--                             passed (1 -> 3 -> 7 -> 14 days), so it cannot be
--                             rushed in a single sitting. The teacher panel
--                             reads this one.
--   verified_next_at          When verified_level may rise again.
--   verified_correct_at       Last time the word was answered correctly in a
--                             test/exam. Assignment progress counts words
--                             answered correctly after the assignment was sent.
--
-- assignments
--   max_attempts        How many times a student may take a book-wide exam.
--
-- Existing rows keep working: verified_* start at 0 / now, so the teacher
-- panel's numbers start fresh and grow as students take tests and exams.
-- (Their own, unverified progress is untouched and still shown to them.)

alter table vocabulary_progress
  add column if not exists verified_level int not null default 0 check (verified_level between 0 and 4),
  add column if not exists verified_next_at timestamptz not null default now(),
  add column if not exists verified_correct_at timestamptz;

alter table assignments
  add column if not exists max_attempts int not null default 2 check (max_attempts between 1 and 10);
