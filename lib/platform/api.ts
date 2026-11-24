import { supabase } from "../supabase/client";
import { tashkentDateKey } from "../utils/dates";
import type {
  AppNotification, Announcement, AnnouncementAudience, AttendanceRow, AttendanceStatus, Branch, Course, FileRef, Group,
  Homework, HomeworkType, Lesson, Material, Payment, PaymentMethod, Profile, ProfileDetails, Role, Submission, SubmissionStatus,
} from "./types";

// Thin data layer: every function talks to Supabase directly. What a person may
// read or change is decided by the database rules (see docs/platform-upgrade.sql),
// never by this code.

type Result<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>;

export async function q<T>(p: Result<T>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

const PROFILE_COLS = "id, username, full_name, role, status, branch_id, created_at";

// ── People ──────────────────────────────────────────────────────────────────
export function listProfiles(role?: Role): Promise<Profile[]> {
  let query = supabase.from("profiles").select(PROFILE_COLS).order("full_name");
  if (role) query = query.eq("role", role);
  return q<Profile[]>(query);
}

export async function getProfile(id: string): Promise<Profile | null> {
  return q<Profile | null>(supabase.from("profiles").select(PROFILE_COLS).eq("id", id).maybeSingle());
}

export async function getDetailsMap(ids?: string[]): Promise<Record<string, ProfileDetails>> {
  let query = supabase.from("profile_details").select("id, phone, birth_date");
  if (ids && ids.length > 0) query = query.in("id", ids);
  const rows = await q<ProfileDetails[]>(query);
  return Object.fromEntries(rows.map((r) => [r.id, r]));
}

export async function updateProfile(id: string, patch: Partial<Pick<Profile, "full_name" | "status" | "branch_id">>): Promise<void> {
  await q(supabase.from("profiles").update(patch).eq("id", id));
}

export async function saveDetails(id: string, details: { phone?: string | null; birth_date?: string | null }): Promise<void> {
  await q(supabase.from("profile_details").upsert({ id, ...details, updated_at: new Date().toISOString() }));
}

// ── Server actions (need the service key, so they go through our API routes) ─
async function adminPost<T>(url: string, body: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessiya topilmadi. Qayta kiring.");
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(json.error ?? "Xatolik yuz berdi. Qayta urinib ko'ring.");
  return json;
}

export interface NewAccount {
  fullName: string;
  username?: string; // empty = generated from the name
  password?: string; // empty = generated
  phone?: string;
  birthDate?: string;
}
export interface CreatedAccount {
  index: number;
  fullName: string;
  username: string;
  password: string;
  group: string;
}

export function createAccounts(role: "student" | "teacher", accounts: NewAccount[], groupId?: string) {
  return adminPost<{ created: CreatedAccount[]; failed: { index: number; fullName: string; error: string }[] }>(
    "/api/admin/create-users",
    { role, groupId, accounts }
  );
}
export const resetPassword = (userId: string, password?: string) =>
  adminPost<{ username: string; fullName: string; password: string }>("/api/admin/reset-password", { userId, password });
export const setUserActive = (userId: string, active: boolean) => adminPost<{ ok: true }>("/api/admin/set-active", { userId, active });
export const deleteUsers = (userIds: string[]) => adminPost<{ deleted: number }>("/api/admin/delete-users", { userIds });

// ── Branches & courses ──────────────────────────────────────────────────────
export const listBranches = () => q<Branch[]>(supabase.from("branches").select("*").order("name"));
export const saveBranch = (b: Partial<Branch> & { name: string }) =>
  q(b.id ? supabase.from("branches").update(b).eq("id", b.id) : supabase.from("branches").insert(b));
export const deleteBranch = (id: string) => q(supabase.from("branches").delete().eq("id", id));

export const listCourses = () => q<Course[]>(supabase.from("courses").select("*").order("name"));
export const saveCourse = (c: Partial<Course> & { name: string }) =>
  q(c.id ? supabase.from("courses").update(c).eq("id", c.id) : supabase.from("courses").insert(c));
export const deleteCourse = (id: string) => q(supabase.from("courses").delete().eq("id", id));

// ── Groups ──────────────────────────────────────────────────────────────────
export interface GroupFull extends Group {
  course: Course | null;
  teacher: Pick<Profile, "id" | "full_name"> | null;
  memberCount: number;
}

export async function listGroups(): Promise<GroupFull[]> {
  const [groups, courses, members] = await Promise.all([
    q<Group[]>(supabase.from("groups").select("*").order("name")),
    listCourses(),
    q<{ group_id: string }[]>(supabase.from("group_members").select("group_id")),
  ]);
  const teacherIds = [...new Set(groups.map((g) => g.teacher_id).filter(Boolean))] as string[];
  const teachers = teacherIds.length
    ? await q<Pick<Profile, "id" | "full_name">[]>(supabase.from("profiles").select("id, full_name").in("id", teacherIds))
    : [];
  const counts = new Map<string, number>();
  members.forEach((m) => counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1));
  return groups.map((g) => ({
    ...g,
    lesson_days: g.lesson_days ?? [],
    course: courses.find((c) => c.id === g.course_id) ?? null,
    teacher: teachers.find((t) => t.id === g.teacher_id) ?? null,
    memberCount: counts.get(g.id) ?? 0,
  }));
}

export type GroupInput = Partial<Omit<Group, "created_at">> & { name: string };
export async function saveGroup(g: GroupInput): Promise<string> {
  const row = { ...g, monthly_price: g.monthly_price === undefined ? null : g.monthly_price };
  if (g.id) {
    await q(supabase.from("groups").update(row).eq("id", g.id));
    return g.id;
  }
  const created = await q<{ id: string }>(supabase.from("groups").insert(row).select("id").single());
  return created.id;
}
export const deleteGroup = (id: string) => q(supabase.from("groups").delete().eq("id", id));

export interface Member {
  student_id: string;
  joined_at: string;
  profile: Profile | null;
}

export async function listMembers(groupId: string): Promise<Member[]> {
  const rows = await q<{ student_id: string; joined_at: string }[]>(
    supabase.from("group_members").select("student_id, joined_at").eq("group_id", groupId)
  );
  if (rows.length === 0) return [];
  const profiles = await q<Profile[]>(supabase.from("profiles").select(PROFILE_COLS).in("id", rows.map((r) => r.student_id)));
  return rows
    .map((r) => ({ ...r, profile: profiles.find((p) => p.id === r.student_id) ?? null }))
    .sort((a, b) => (a.profile?.full_name ?? "").localeCompare(b.profile?.full_name ?? ""));
}

export const addMembers = (groupId: string, studentIds: string[]) =>
  q(supabase.from("group_members").upsert(studentIds.map((student_id) => ({ group_id: groupId, student_id })), { onConflict: "group_id,student_id", ignoreDuplicates: true }));
export const removeMember = (groupId: string, studentId: string) =>
  q(supabase.from("group_members").delete().eq("group_id", groupId).eq("student_id", studentId));

/** Moves a student from one group to another (adds first, so they are never left without a group). */
export async function moveStudent(studentId: string, fromGroupId: string | null, toGroupId: string): Promise<void> {
  await addMembers(toGroupId, [studentId]);
  if (fromGroupId && fromGroupId !== toGroupId) await removeMember(fromGroupId, studentId);
}

/** Every group membership: student_id -> group ids. */
export async function allMemberships(): Promise<{ group_id: string; student_id: string; joined_at: string }[]> {
  return q(supabase.from("group_members").select("group_id, student_id, joined_at"));
}

export async function myGroups(studentId: string): Promise<(GroupFull & { joined_at: string })[]> {
  const [groups, mem] = await Promise.all([listGroups(), q<{ group_id: string; joined_at: string }[]>(supabase.from("group_members").select("group_id, joined_at").eq("student_id", studentId))]);
  return mem.map((m) => ({ ...groups.find((g) => g.id === m.group_id)!, joined_at: m.joined_at })).filter((g) => g.id);
}

// ── Lessons & attendance ────────────────────────────────────────────────────
export const listLessons = (groupIds: string[], from: string, to: string) =>
  groupIds.length === 0
    ? Promise.resolve([] as Lesson[])
    : q<Lesson[]>(supabase.from("lessons").select("*").in("group_id", groupIds).gte("lesson_date", from).lte("lesson_date", to).order("lesson_date"));

/** Finds or creates the lesson row of a group on a day. */
export async function ensureLesson(group: Pick<Group, "id" | "start_time" | "end_time">, date: string, userId: string): Promise<Lesson> {
  const existing = await q<Lesson | null>(supabase.from("lessons").select("*").eq("group_id", group.id).eq("lesson_date", date).maybeSingle());
  if (existing) return existing;
  return q<Lesson>(
    supabase.from("lessons").insert({ group_id: group.id, lesson_date: date, start_time: group.start_time, end_time: group.end_time, created_by: userId }).select("*").single()
  );
}

export async function setLessonTopic(group: Pick<Group, "id" | "start_time" | "end_time">, date: string, topic: string, userId: string): Promise<void> {
  const lesson = await ensureLesson(group, date, userId);
  await q(supabase.from("lessons").update({ topic: topic.trim() || null }).eq("id", lesson.id));
}

export async function setLessonStatus(group: Pick<Group, "id" | "start_time" | "end_time">, date: string, status: Lesson["status"], userId: string): Promise<void> {
  const lesson = await ensureLesson(group, date, userId);
  await q(supabase.from("lessons").update({ status }).eq("id", lesson.id));
}

export async function getAttendance(groupId: string, date: string): Promise<{ lesson: Lesson | null; rows: AttendanceRow[] }> {
  const lesson = await q<Lesson | null>(supabase.from("lessons").select("*").eq("group_id", groupId).eq("lesson_date", date).maybeSingle());
  if (!lesson) return { lesson: null, rows: [] };
  const rows = await q<AttendanceRow[]>(supabase.from("attendance").select("id, lesson_id, student_id, status, note").eq("lesson_id", lesson.id));
  return { lesson, rows };
}

export async function saveAttendance(
  group: Pick<Group, "id" | "start_time" | "end_time">,
  date: string,
  entries: { student_id: string; status: AttendanceStatus; note?: string | null }[],
  userId: string
): Promise<void> {
  const lesson = await ensureLesson(group, date, userId);
  if (entries.length > 0) {
    await q(
      supabase.from("attendance").upsert(
        entries.map((e) => ({ lesson_id: lesson.id, student_id: e.student_id, status: e.status, note: e.note ?? null, marked_by: userId, marked_at: new Date().toISOString() })),
        { onConflict: "lesson_id,student_id" }
      )
    );
  }
  if (lesson.status !== "done") await q(supabase.from("lessons").update({ status: "done" }).eq("id", lesson.id));
}

export interface AttendanceWithLesson extends AttendanceRow {
  lesson: Pick<Lesson, "id" | "group_id" | "lesson_date" | "topic"> | null;
}

/** Attendance rows (with their lesson) for the given student/groups/date range. */
export async function listAttendance(opts: { studentId?: string; groupIds?: string[]; from?: string; to?: string }): Promise<AttendanceWithLesson[]> {
  if (opts.groupIds && opts.groupIds.length === 0) return [];
  let query = supabase
    .from("attendance")
    .select("id, lesson_id, student_id, status, note, lessons!inner(id, group_id, lesson_date, topic)");
  if (opts.studentId) query = query.eq("student_id", opts.studentId);
  if (opts.groupIds) query = query.in("lessons.group_id", opts.groupIds);
  if (opts.from) query = query.gte("lessons.lesson_date", opts.from);
  if (opts.to) query = query.lte("lessons.lesson_date", opts.to);
  type Raw = AttendanceRow & { lessons: AttendanceWithLesson["lesson"] | NonNullable<AttendanceWithLesson["lesson"]>[] };
  const rows = await q<Raw[]>(query as unknown as Result<Raw[]>);
  return rows.map(({ lessons, ...rest }) => ({ ...rest, lesson: Array.isArray(lessons) ? lessons[0] ?? null : lessons }));
}

export function attendanceRate(rows: { status: AttendanceStatus }[]): number {
  if (rows.length === 0) return 0;
  const good = rows.filter((r) => r.status === "present" || r.status === "late" || r.status === "excused").length;
  return Math.round((good / rows.length) * 100);
}

// ── Files (private bucket "homework-files") ─────────────────────────────────
const BUCKET = "homework-files";
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_EXT = ["pdf", "png", "jpg", "jpeg", "webp", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "mp3", "m4a", "wav", "zip"];

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return `"${file.name}" 10 MB dan katta.`;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(ext)) return `"${file.name}": bu fayl turi qabul qilinmaydi.`;
  return null;
}

export async function uploadFiles(prefix: string, files: File[]): Promise<FileRef[]> {
  const out: FileRef[] = [];
  for (const file of files) {
    const problem = validateFile(file);
    if (problem) throw new Error(problem);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const path = `${prefix}/${crypto.randomUUID()}-${safe}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined });
    if (error) throw new Error(error.message);
    out.push({ name: file.name, path, type: file.type, size: file.size });
  }
  return out;
}

export async function signedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
  if (error || !data) throw new Error(error?.message ?? "Faylni ochib bo'lmadi.");
  return data.signedUrl;
}

export async function removeFiles(paths: string[]): Promise<void> {
  if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);
}

// ── Homework ────────────────────────────────────────────────────────────────
const num = <T extends { points?: number }>(h: T) => h;

export const listHomework = (groupIds?: string[]) => {
  let query = supabase.from("homework").select("*").order("due_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  if (groupIds) {
    if (groupIds.length === 0) return Promise.resolve([] as Homework[]);
    query = query.in("group_id", groupIds);
  }
  return q<Homework[]>(query).then((rows) => rows.map(num));
};

export const getHomework = (id: string) => q<Homework | null>(supabase.from("homework").select("*").eq("id", id).maybeSingle());

export interface HomeworkInput {
  id?: string;
  group_id: string;
  title: string;
  description: string | null;
  type: HomeworkType;
  points: number;
  due_at: string | null;
  attachments: FileRef[];
  student_ids: string[] | null;
}

export async function saveHomework(h: HomeworkInput, userId: string): Promise<string> {
  if (h.id) {
    const { id, ...patch } = h;
    await q(supabase.from("homework").update(patch).eq("id", id));
    return id;
  }
  const created = await q<{ id: string }>(supabase.from("homework").insert({ ...h, created_by: userId }).select("id").single());
  return created.id;
}
export const deleteHomework = (id: string) => q(supabase.from("homework").delete().eq("id", id));

export const listSubmissions = (homeworkIds: string[]) =>
  homeworkIds.length === 0
    ? Promise.resolve([] as Submission[])
    : q<Submission[]>(supabase.from("homework_submissions").select("*").in("homework_id", homeworkIds));

export const mySubmissions = (studentId: string) => q<Submission[]>(supabase.from("homework_submissions").select("*").eq("student_id", studentId));

export async function saveSubmission(
  homeworkId: string,
  studentId: string,
  data: { answer: string; attachments: FileRef[]; status: Extract<SubmissionStatus, "draft" | "submitted"> }
): Promise<void> {
  await q(
    supabase.from("homework_submissions").upsert(
      { homework_id: homeworkId, student_id: studentId, answer: data.answer, attachments: data.attachments, status: data.status },
      { onConflict: "homework_id,student_id" }
    )
  );
}

export async function reviewSubmission(
  id: string,
  data: { status: Extract<SubmissionStatus, "reviewing" | "needs_revision" | "graded">; score?: number | null; feedback?: string | null; mistakes?: string | null }
): Promise<void> {
  await q(supabase.from("homework_submissions").update({ status: data.status, score: data.score ?? null, feedback: data.feedback ?? null, mistakes: data.mistakes ?? null }).eq("id", id));
}

// ── Materials ───────────────────────────────────────────────────────────────
export const listMaterials = (opts: { groupId?: string; courseId?: string }) => {
  let query = supabase.from("materials").select("*").order("created_at", { ascending: false });
  if (opts.groupId) query = query.eq("group_id", opts.groupId);
  if (opts.courseId) query = query.eq("course_id", opts.courseId);
  return q<Material[]>(query);
};
export const addMaterial = (m: { group_id?: string | null; course_id?: string | null; title: string; kind: "link" | "file"; url?: string | null; path?: string | null }, userId: string) =>
  q(supabase.from("materials").insert({ ...m, created_by: userId }));
export const deleteMaterial = (id: string) => q(supabase.from("materials").delete().eq("id", id));

// ── Payments ────────────────────────────────────────────────────────────────
export const listPayments = (studentId?: string) => {
  let query = supabase.from("payments").select("*").order("paid_at", { ascending: false }).order("created_at", { ascending: false });
  if (studentId) query = query.eq("student_id", studentId);
  return q<Payment[]>(query);
};
export const addPayment = (p: { student_id: string; group_id: string | null; amount: number; paid_at: string; method: PaymentMethod; status: "paid" | "pending"; period: string; note: string | null }, userId: string) =>
  q(supabase.from("payments").insert({ ...p, created_by: userId }));
export const deletePayment = (id: string) => q(supabase.from("payments").delete().eq("id", id));

// ── Announcements ───────────────────────────────────────────────────────────
export const listAnnouncements = (limit = 50) => q<Announcement[]>(supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(limit));
export const addAnnouncement = (a: { title: string; body: string; image_url?: string | null; audience: AnnouncementAudience; group_id?: string | null }, userId: string) =>
  q(supabase.from("announcements").insert({ ...a, image_url: a.image_url || null, created_by: userId }));
export const deleteAnnouncement = (id: string) => q(supabase.from("announcements").delete().eq("id", id));

// ── Notifications ───────────────────────────────────────────────────────────
export const listNotifications = (userId: string, limit = 25) =>
  q<AppNotification[]>(supabase.from("notifications").select("id, type, title, body, link, read, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit));
export const markNotificationsRead = (userId: string, ids?: string[]) => {
  let query = supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  if (ids) query = query.in("id", ids);
  return q(query);
};

// ── Settings ────────────────────────────────────────────────────────────────
export async function saveSettings(values: Record<string, unknown>): Promise<void> {
  await q(supabase.from("app_settings").upsert(Object.entries(values).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }))));
}

export const todayKey = () => tashkentDateKey();
