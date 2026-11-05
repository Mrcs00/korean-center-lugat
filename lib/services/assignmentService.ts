import { supabase } from "../supabase/client";
import { bookExamSetId } from "../utils/examSets";

export type AssignmentKind = "set" | "book_exam";

export interface RealAssignment {
  id: string;
  groupId: string;
  groupName: string;
  setId: string;
  deadline: string | null;
  minimumMastery: number; // for a book exam: the pass score in %
  kind: AssignmentKind;
  wordFrom: number | null; // 1-based; null = whole set
  wordTo: number | null;
  bookId: string | null; // only for kind "book_exam"
  questionCount: number | null; // only for kind "book_exam"
  maxAttempts: number; // how many times a book exam may be taken
  createdAt: string | null; // when the teacher sent it
}

const FULL_COLUMNS =
  "id, group_id, set_id, deadline, minimum_mastery, kind, word_from, word_to, book_id, question_count, max_attempts, created_at, groups(name)";
const LEGACY_COLUMNS = "id, group_id, set_id, deadline, minimum_mastery, created_at, groups(name)";

const UPGRADE_HINT =
  "Supabase'da docs/assignments-upgrade.sql ni ishga tushirganingizni tekshiring.";

function mapRow(a: Record<string, unknown>): RealAssignment {
  return {
    id: a.id as string,
    groupId: a.group_id as string,
    groupName: (a.groups as { name: string } | null)?.name ?? (a.group_id as string),
    setId: a.set_id as string,
    deadline: (a.deadline as string | null) ?? null,
    minimumMastery: a.minimum_mastery as number,
    kind: ((a.kind as AssignmentKind | undefined) ?? "set") as AssignmentKind,
    wordFrom: (a.word_from as number | null | undefined) ?? null,
    wordTo: (a.word_to as number | null | undefined) ?? null,
    bookId: (a.book_id as string | null | undefined) ?? null,
    questionCount: (a.question_count as number | null | undefined) ?? null,
    maxAttempts: (a.max_attempts as number | null | undefined) ?? 2,
    createdAt: (a.created_at as string | null | undefined) ?? null,
  };
}

// Reads assignments with the newer columns; if the upgrade SQL has not been
// run yet, falls back to the old columns so the page keeps working.
async function readAssignments(groupId?: string): Promise<RealAssignment[]> {
  const run = async (columns: string) => {
    let q = supabase.from("assignments").select(columns);
    if (groupId) q = q.eq("group_id", groupId);
    return q.order("created_at", { ascending: false });
  };

  let { data, error } = await run(FULL_COLUMNS);
  if (error) {
    ({ data, error } = await run(LEGACY_COLUMNS));
  }
  if (error) throw error;
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapRow);
}

/** For the teacher panel — every assignment across every group. */
export async function fetchAllAssignments(): Promise<RealAssignment[]> {
  return readAssignments();
}

/** For a student — only assignments given to the group they belong to. */
export async function fetchAssignmentsForGroup(groupId: string): Promise<RealAssignment[]> {
  return readAssignments(groupId);
}

export async function createAssignment(input: {
  groupId: string;
  kind?: AssignmentKind;
  setId?: string; // for kind "set"
  wordFrom?: number | null;
  wordTo?: number | null;
  bookId?: string; // for kind "book_exam"
  questionCount?: number;
  maxAttempts?: number;
  deadline: string | null;
  minimumMastery: number;
}): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  const kind = input.kind ?? "set";

  const row: Record<string, unknown> = {
    group_id: input.groupId,
    set_id: kind === "book_exam" ? bookExamSetId(input.bookId ?? "") : input.setId,
    deadline: input.deadline,
    minimum_mastery: input.minimumMastery,
    created_by: userId,
  };

  // New columns are only sent when needed, so ordinary whole-set assignments
  // keep working even before the upgrade SQL has been run.
  if (kind === "book_exam") {
    row.kind = "book_exam";
    row.book_id = input.bookId;
    row.question_count = input.questionCount ?? 50;
    row.max_attempts = input.maxAttempts ?? 2;
  } else if (input.wordFrom && input.wordTo) {
    row.word_from = input.wordFrom;
    row.word_to = input.wordTo;
  }

  const { error } = await supabase.from("assignments").insert(row);
  if (error) {
    if (/column|schema cache/i.test(error.message)) throw new Error(`${error.message}. ${UPGRADE_HINT}`);
    throw error;
  }
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) throw error;
}
