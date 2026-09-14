-- TOPIK Vocabulary Trainer — Supabase / PostgreSQL schema
-- Mirrors lib/types.ts exactly. Run this in the Supabase SQL editor,
-- then wire lib/services/*.ts to real `supabase.from(...)` calls.

create extension if not exists "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('student', 'teacher', 'admin')) default 'student',
  avatar_url text,
  level int not null default 1,
  xp int not null default 0,
  streak int not null default 0,
  created_at timestamptz not null default now()
);

-- ── Vocabulary ───────────────────────────────────────────────────────────
create table vocabulary_sets (
  id text primary key,           -- e.g. 'topik-35'
  topik_level int not null,      -- 1..6
  set_number int not null,
  title text not null,
  description text,
  word_count int not null default 0
);

create table vocabulary_words (
  id text primary key,
  set_id text not null references vocabulary_sets(id) on delete cascade,
  korean_word text not null,
  pronunciation text not null,
  uzbek_translation text not null,
  example_sentence_ko text not null,
  example_sentence_uz text not null,
  synonym text,
  antonym text,
  part_of_speech text not null check (part_of_speech in ('noun','verb','adjective','adverb','expression')),
  audio_url text,
  image_url text,
  topic text,
  "order" int not null
);
create index on vocabulary_words (set_id);

-- ── Spaced repetition progress (per student, per word) ──────────────────
create table vocabulary_progress (
  student_id uuid not null references profiles(id) on delete cascade,
  word_id text not null references vocabulary_words(id) on delete cascade,
  mastery_level int not null default 0 check (mastery_level between 0 and 4),
  correct_count int not null default 0,
  wrong_count int not null default 0,
  times_seen int not null default 0,
  confidence real not null default 0,
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null default now(),
  primary key (student_id, word_id)
);
create index on vocabulary_progress (student_id, next_review_at);

-- ── Exams ────────────────────────────────────────────────────────────────
create table exam_attempts (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  set_id text not null references vocabulary_sets(id),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  total_questions int not null,
  correct_count int not null default 0,
  wrong_count int not null default 0,
  skipped_count int not null default 0
);

create table exam_answers (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid not null references exam_attempts(id) on delete cascade,
  word_id text not null references vocabulary_words(id),
  question_type text not null check (question_type in ('kr_to_uz','uz_to_kr','typing','listening','context')),
  is_correct boolean not null,
  student_answer text
);
create index on exam_answers (attempt_id);

-- ── Teacher panel ────────────────────────────────────────────────────────
create table groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  teacher_id uuid not null references profiles(id) on delete cascade
);

create table group_members (
  group_id uuid not null references groups(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  primary key (group_id, student_id)
);

create table assignments (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups(id) on delete cascade,
  set_id text not null references vocabulary_sets(id),
  deadline timestamptz not null,
  minimum_mastery int not null default 70
);

-- ── Daily activity (for streaks / dashboard chart) ──────────────────────
create table daily_activity (
  student_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  new_words int not null default 0,
  reviewed_words int not null default 0,
  xp_earned int not null default 0,
  primary key (student_id, date)
);

-- ── Row Level Security ───────────────────────────────────────────────────
alter table profiles enable row level security;
alter table vocabulary_progress enable row level security;
alter table exam_attempts enable row level security;
alter table exam_answers enable row level security;
alter table daily_activity enable row level security;

create policy "own profile" on profiles for select using (auth.uid() = id);
create policy "own progress" on vocabulary_progress for all using (auth.uid() = student_id);
create policy "own exam attempts" on exam_attempts for all using (auth.uid() = student_id);
create policy "own daily activity" on daily_activity for all using (auth.uid() = student_id);

-- Teachers can read progress of students in their groups:
create policy "teacher reads group progress" on vocabulary_progress for select using (
  exists (
    select 1 from group_members gm
    join groups g on g.id = gm.group_id
    where gm.student_id = vocabulary_progress.student_id
      and g.teacher_id = auth.uid()
  )
);

-- vocabulary_sets / vocabulary_words are public read (no RLS needed unless
-- you want to restrict by subscription tier).
