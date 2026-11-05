import { supabase } from "../supabase/client";

// Reliable saving for the student's progress and exam results.
//
// Before: every answered word sent its own request, and if one failed (flaky
// internet) the app only wrote to the console — the student studied but the
// teacher panel showed nothing. Now every change is first written to this
// device (localStorage) and then sent in batches; anything that fails stays in
// the queue and is retried (later, when the connection is back, or on the next
// visit). Nothing is lost silently.

export interface ProgressRowOut {
  student_id: string;
  word_id: string;
  mastery_level: number;
  correct_count: number;
  wrong_count: number;
  times_seen: number;
  confidence: number;
  last_reviewed_at: string | null;
  next_review_at: string;
  verified_level: number;
  verified_next_at: string;
  verified_correct_at: string | null;
}

export interface QueuedAttempt {
  attempt: {
    id: string;
    set_id: string;
    started_at: string;
    submitted_at: string | null;
    total_questions: number;
    correct_count: number;
    wrong_count: number;
    skipped_count: number;
  };
  answers: {
    word_id: string;
    question_type: string;
    is_correct: boolean;
    student_answer: string | null;
  }[];
  attemptSaved: boolean; // the attempt row is in; only answers may be left
}

const progressKey = (uid: string) => `progress-queue-v1:${uid}`;
const attemptKey = (uid: string) => `attempt-queue-v1:${uid}`;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / blocked — we still try to send right away
  }
}

const isMissingColumn = (message: string) => /verified_|column|schema cache/i.test(message);

let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryDelay = 5000;

function hasPending(uid: string): boolean {
  return (
    Object.keys(read<Record<string, ProgressRowOut>>(progressKey(uid), {})).length > 0 ||
    read<QueuedAttempt[]>(attemptKey(uid), []).length > 0
  );
}

/** Puts one word's latest progress in the queue and schedules a send. */
export function enqueueProgress(uid: string, row: ProgressRowOut): void {
  const queue = read<Record<string, ProgressRowOut>>(progressKey(uid), {});
  queue[row.word_id] = row; // the newest state of a word replaces older ones
  write(progressKey(uid), queue);
  scheduleFlush(uid, 1500);
}

/** Puts a finished exam in the queue and sends it soon. */
export function enqueueAttempt(uid: string, item: QueuedAttempt): void {
  const queue = read<QueuedAttempt[]>(attemptKey(uid), []);
  queue.push(item);
  write(attemptKey(uid), queue);
  scheduleFlush(uid, 300);
}

export function scheduleFlush(uid: string, delay: number): void {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    void flushQueues(uid);
  }, delay);
}

/** Sends everything waiting. Safe to call at any time. */
export async function flushQueues(uid: string): Promise<void> {
  if (flushing) return;
  flushing = true;
  let ok = true;
  try {
    ok = (await flushAttempts(uid)) && (await flushProgress(uid));
  } finally {
    flushing = false;
  }
  if (ok) {
    retryDelay = 5000;
  } else if (hasPending(uid)) {
    // Try again later, waiting a bit longer each time (max 1 minute).
    retryDelay = Math.min(retryDelay * 2, 60000);
    scheduleFlush(uid, retryDelay);
  }
}

// Exams first: an attempt row must exist before its answers can be saved.
async function flushAttempts(uid: string): Promise<boolean> {
  let queue = read<QueuedAttempt[]>(attemptKey(uid), []);
  for (const item of [...queue]) {
    if (!item.attemptSaved) {
      const { error } = await supabase
        .from("exam_attempts")
        .upsert({ ...item.attempt, student_id: uid }, { onConflict: "id", ignoreDuplicates: true });
      if (error) {
        console.error("exam attempt sync failed", error);
        return false;
      }
      item.attemptSaved = true;
      write(attemptKey(uid), queue);
    }

    if (item.answers.length > 0) {
      const { error } = await supabase.from("exam_answers").insert(
        item.answers.map((a) => ({ ...a, attempt_id: item.attempt.id, student_id: uid }))
      );
      if (error) {
        console.error("exam answers sync failed", error);
        return false;
      }
    }

    queue = read<QueuedAttempt[]>(attemptKey(uid), []).filter((q) => q.attempt.id !== item.attempt.id);
    write(attemptKey(uid), queue);
  }
  return true;
}

async function flushProgress(uid: string): Promise<boolean> {
  const rows = Object.values(read<Record<string, ProgressRowOut>>(progressKey(uid), {}));
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);

    let { error } = await supabase.from("vocabulary_progress").upsert(chunk);
    if (error && isMissingColumn(error.message)) {
      // The logic-upgrade SQL has not been run yet: save the old columns only.
      const legacy = chunk.map((row) => {
        const rest: Partial<ProgressRowOut> = { ...row };
        delete rest.verified_level;
        delete rest.verified_next_at;
        delete rest.verified_correct_at;
        return rest;
      });
      ({ error } = await supabase.from("vocabulary_progress").upsert(legacy));
    }
    if (error) {
      console.error("progress sync failed", error);
      return false;
    }

    // Remove only what was sent — unless the word changed again meanwhile.
    const current = read<Record<string, ProgressRowOut>>(progressKey(uid), {});
    for (const row of chunk) {
      const now = current[row.word_id];
      if (now && now.times_seen === row.times_seen && now.last_reviewed_at === row.last_reviewed_at) {
        delete current[row.word_id];
      }
    }
    write(progressKey(uid), current);
  }
  return true;
}

/**
 * Starts background sending for a logged-in student: sends leftovers from the
 * last visit, and sends again whenever the connection returns or the page is
 * being hidden/closed. Returns a cleanup function.
 */
export function startSync(uid: string): () => void {
  const flush = () => void flushQueues(uid);
  const onVisibility = () => {
    if (document.visibilityState === "hidden") flush();
  };
  window.addEventListener("online", flush);
  document.addEventListener("visibilitychange", onVisibility);
  flush();
  return () => {
    window.removeEventListener("online", flush);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
