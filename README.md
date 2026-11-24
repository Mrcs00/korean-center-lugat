# Korean Center Lug'at

Next.js 14 + TypeScript + Tailwind MVP, built from the product brief. Uses local
state (localStorage) for progress right now; the data layer is isolated so it
can be swapped for real Supabase without touching any UI code.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. `/` is the landing page, `/dashboard` is the
student home (skip login — it's a demo account: "Ali Valiyev").
`/teacher` is the teacher panel (uses separate mock roster data, since the
demo only tracks one real student in localStorage).

## Where things live

```
lib/types.ts                     ← every domain type (mirrors the SQL schema)
lib/data/seed.ts                 ← ★ YOUR VOCABULARY GOES HERE ★
lib/data/teacherMock.ts          ← demo roster for the teacher panel only
lib/services/
  vocabularyService.ts           ← reads vocabulary (swap for Supabase queries)
  spacedRepetition.ts            ← the review-interval algorithm, isolated
  quizService.ts                 ← generates quiz questions (5 types)
  statsService.ts                ← dashboard/stats aggregations
lib/store/progressStore.tsx      ← React context + localStorage persistence
                                    (swap the body of each function for
                                    supabase.from(...) calls when ready)
components/study/                ← WordCard, Flashcard, QuizEngine
components/layout/                ← AppShell (student nav), TeacherShell
app/                              ← one folder per route (see below)
docs/database-schema.sql          ← full Supabase/Postgres schema + RLS
```

## Adding your real vocabulary

Everything reads from two exports in `lib/data/seed.ts`:

```ts
export const VOCAB_SETS: VocabularySet[] = ...
export const VOCAB_WORDS: VocabularyWord[] = ...
```

Replace the sample arrays with your real data (however you generate it —
hand-written, imported from CSV/JSON, etc.) and keep the same two export
names and shapes (documented at the top of that file). Dashboard, vocabulary
list, flashcards, quiz, exam and statistics all pick it up automatically for
any number of sets/words — nothing else needs to change.

## Routes implemented

Student: `/`, `/login`, `/register`, `/dashboard`, `/vocabulary`,
`/vocabulary/[setId]`, `/flashcards`, `/quiz`, `/review` (spaced-repetition
queue), `/exam`, `/exam/[setId]` (timed), `/result/[attemptId]`,
`/wrong-words`, `/statistics`, `/profile`.

Teacher: `/teacher`, `/teacher/students`, `/teacher/students/[id]`,
`/teacher/groups`, `/teacher/exams`, `/teacher/analytics`.

## Auth & registration (already wired up)

`/register` and `/login` use real Supabase Auth — username + password
(email/password under the hood, using a synthesized `@users.*.local`
address since there's no real email involved). Setup, one time:

1. Create a Supabase project at supabase.com.
2. **Authentication → Sign In / Providers → Email → turn OFF "Confirm
   email"** — required, since there's no real inbox to click a
   confirmation link in.
3. **SQL Editor → New query** → paste and run `docs/auth-schema.sql`, then
   `docs/progress-schema.sql` (in that order). Together these create
   `profiles`, `groups` (seeded with 3 sample groups), `group_members`,
   `vocabulary_progress`, `exam_attempts`, `exam_answers`,
   `daily_activity`, an auto-profile-creation trigger, and RLS policies so
   every row is only readable/writable by its own student.
4. Copy **Project Settings → API → Project URL** and the **anon/publishable
   key** into `.env.local` (already scaffolded — just replace the values):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```
5. `npm run dev`, then open `/register` — sign up with a name, username,
   password, and group. You'll land on `/dashboard` logged in.

**What's fully synced to Supabase now:** vocabulary progress (mastery per
word, spaced-repetition scheduling), XP, level, daily goal, exam history
(attempts + per-question answers), and daily activity (which drives a real,
computed streak — no more hardcoded number). Log in from any device and
it's all there.

**Still local-only:** `lib/store/assignmentStore.tsx` (teacher-created
homework) and the teacher panel's roster (`lib/data/teacherMock.ts`) —
those need real teacher accounts and an `assignments` table, following the
exact same pattern as the store above, as the next step.

**Offline/demo fallback:** if nobody is logged in (e.g. clicking "Demo
ko'rish" on the landing page without registering), the app transparently
falls back to the original localStorage-based demo profile — nothing
breaks, it just isn't synced anywhere.

## Notes on this MVP vs. the full spec

This build covers the core **student study flow** (dashboard → vocabulary →
flashcards → quiz → spaced repetition review → timed exam → result → wrong
words → statistics → profile) end-to-end, plus a functional **teacher panel**
(overview, students, student detail, groups, assignments, analytics) using
demo roster data. Not yet wired: real Supabase Auth/DB, payments/subscription
tiers, notifications, and the admin content-management screens described in
the brief — the architecture (typed services + isolated data layer) is set
up so each of those can be added incrementally without refactoring existing
pages.

## Platform: Admin / Ustoz / O'quvchi

The site is an o'quv markaz platform with three panels:

- `/admin` — groups, students, teachers, courses, attendance, homework, payments,
  statistics, announcements, branches, settings.
- `/teacher` — only the teacher's own groups: attendance, homework + grading,
  schedule, announcements, statistics.
- `/student` — home, courses, homework, attendance, schedule, payments, contact,
  plus the vocabulary tools (flashcards, review, tests, exams).

Public sign-up is closed. The admin creates student and teacher accounts
(login is shown as `name@kc.uz`; it is only a login name, not a mailbox).

### Setup / upgrade
1. Supabase → Database → Backups: take a backup.
2. Supabase → SQL Editor: run `docs/platform-upgrade.sql` (safe to run again).
   If more than one teacher account existed before, promote yourself to admin:
   `update profiles set role = 'admin' where username = 'YOUR_LOGIN';`
3. Vercel → Settings → Environment Variables: `SUPABASE_SERVICE_ROLE_KEY`
   (the Supabase *secret* key, never `NEXT_PUBLIC_`). Redeploy.
4. Supabase → Authentication → Sign In / Providers: turn OFF
   "Allow new users to sign up".

Access rules live in the database (Row Level Security), not in the pages:
a teacher sees only the groups they teach, a student only their own data, the
admin everything. Files (homework, submissions, materials) go to the private
bucket `homework-files`, readable only by the people allowed to see them.
