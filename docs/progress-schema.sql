-- Korean Center Lug'at — Progress / XP / Streak / Exam history schema
-- Run this in Supabase SQL Editor AFTER auth-schema.sql.

alter table profiles add column if not exists xp integer not null default 0;
alter table profiles add column if not exists level integer not null default 1;
alter table profiles add column if not exists daily_goal integer not null default 20;

-- ── Spaced repetition progress (per student, per word) ──────────────────
create table if not exists vocabulary_progress (
  student_id uuid not null references profiles(id) on delete cascade,
  word_id text not null,
  mastery_level integer not null default 0 check (mastery_level between 0 and 4),
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  times_seen integer not null default 0,
  confidence real not null default 0,
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null default now(),
  primary key (student_id, word_id)
);
create index if not exists vocabulary_progress_student_idx on vocabulary_progress (student_id, next_review_at);

-- ── Exams ────────────────────────────────────────────────────────────────
-- id is text (not a generated uuid) because the client already assigns an
-- id like "attempt-1699999999999" when the exam finishes, and immediately
-- navigates to /result/<that id> before the Supabase write completes —
-- reusing the client id avoids needing to patch the URL after the fact.
create table if not exists exam_attempts (
  id text primary key,
  student_id uuid not null references profiles(id) on delete cascade,
  set_id text not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  total_questions integer not null,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  skipped_count integer not null default 0
);

create table if not exists exam_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id text not null references exam_attempts(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  word_id text not null,
  question_type text not null,
  is_correct boolean not null,
  student_answer text
);

-- ── Daily activity (streak is computed from this, not stored directly) ──
create table if not exists daily_activity (
  student_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  new_words integer not null default 0,
  reviewed_words integer not null default 0,
  xp_earned integer not null default 0,
  primary key (student_id, date)
);

-- ── Row Level Security — every row is only readable/writable by its own
--    student ─────────────────────────────────────────────────────────────
alter table vocabulary_progress enable row level security;
alter table exam_attempts enable row level security;
alter table exam_answers enable row level security;
alter table daily_activity enable row level security;

create policy "own vocabulary progress" on vocabulary_progress
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy "own exam attempts" on exam_attempts
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy "own exam answers" on exam_answers
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy "own daily activity" on daily_activity
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
