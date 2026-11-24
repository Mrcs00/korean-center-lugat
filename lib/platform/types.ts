export type Role = "admin" | "teacher" | "student";

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  role: Role;
  status: "active" | "inactive";
  branch_id: string | null;
  created_at: string;
}

export interface ProfileDetails {
  id: string;
  phone: string | null;
  birth_date: string | null;
}

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  active: boolean;
}

export interface Course {
  id: string;
  name: string;
  level: string | null;
  description: string | null;
  duration_weeks: number | null;
  image_url: string | null;
  monthly_price: number;
  vocab_book: string | null;
  active: boolean;
}

export type GroupStatus = "new" | "active" | "finished" | "cancelled";

export interface Group {
  id: string;
  name: string;
  course_id: string | null;
  teacher_id: string | null;
  branch_id: string | null;
  level: string | null;
  lesson_days: number[]; // 1 = Monday … 7 = Sunday
  start_time: string | null; // "HH:MM:SS"
  end_time: string | null;
  start_date: string | null;
  end_date: string | null;
  status: GroupStatus;
  monthly_price: number | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  group_id: string;
  lesson_date: string;
  start_time: string | null;
  end_time: string | null;
  topic: string | null;
  status: "planned" | "done" | "cancelled";
}

export type AttendanceStatus = "present" | "late" | "absent" | "excused";

export interface AttendanceRow {
  id: string;
  lesson_id: string;
  student_id: string;
  status: AttendanceStatus;
  note: string | null;
}

export interface FileRef {
  name: string;
  path: string;
  type?: string;
  size?: number;
}

export type HomeworkType = "written" | "file" | "reading" | "other";

export interface Homework {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  type: HomeworkType;
  points: number;
  assigned_at: string;
  due_at: string | null;
  attachments: FileRef[];
  student_ids: string[] | null;
  created_by: string | null;
  created_at: string;
}

export type SubmissionStatus = "draft" | "submitted" | "reviewing" | "needs_revision" | "graded";

export interface Submission {
  id: string;
  homework_id: string;
  student_id: string;
  answer: string | null;
  attachments: FileRef[];
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
  mistakes: string | null;
  attempt: number;
  submitted_at: string | null;
  graded_at: string | null;
}

export interface Material {
  id: string;
  group_id: string | null;
  course_id: string | null;
  title: string;
  kind: "link" | "file";
  url: string | null;
  path: string | null;
  created_at: string;
}

export type PaymentMethod = "cash" | "click" | "payme" | "bank" | "other";

export interface Payment {
  id: string;
  student_id: string;
  group_id: string | null;
  amount: number;
  paid_at: string;
  method: PaymentMethod;
  status: "paid" | "pending";
  period: string; // "YYYY-MM"
  note: string | null;
  created_at: string;
}

export type AnnouncementAudience = "all_students" | "group" | "teachers" | "everyone";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  audience: AnnouncementAudience;
  group_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}
