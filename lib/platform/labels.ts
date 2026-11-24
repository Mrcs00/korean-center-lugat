import type { AttendanceStatus, GroupStatus, HomeworkType, PaymentMethod, SubmissionStatus } from "./types";

export const WEEKDAYS_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
export const WEEKDAYS_FULL = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
export const MONTHS_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

export const GROUP_STATUS: Record<GroupStatus, { label: string; tone: Tone }> = {
  new: { label: "Yangi", tone: "blue" },
  active: { label: "Faol", tone: "green" },
  finished: { label: "Tugagan", tone: "gray" },
  cancelled: { label: "Bekor qilingan", tone: "red" },
};

export const ATTENDANCE: Record<AttendanceStatus, { label: string; short: string; tone: Tone }> = {
  present: { label: "Keldi", short: "K", tone: "green" },
  late: { label: "Kechikdi", short: "Kd", tone: "amber" },
  absent: { label: "Kelmadi", short: "Kz", tone: "red" },
  excused: { label: "Sababli", short: "S", tone: "blue" },
};

export const SUBMISSION: Record<SubmissionStatus | "new" | "overdue", { label: string; tone: Tone }> = {
  new: { label: "Yangi", tone: "blue" },
  draft: { label: "Bajarilmoqda", tone: "amber" },
  submitted: { label: "Topshirilgan", tone: "gray" },
  reviewing: { label: "Tekshirilmoqda", tone: "amber" },
  needs_revision: { label: "Qayta ishlash kerak", tone: "red" },
  graded: { label: "Baholangan", tone: "green" },
  overdue: { label: "Muddati o'tgan", tone: "red" },
};

export const HOMEWORK_TYPES: Record<HomeworkType, string> = {
  written: "Yozma",
  file: "Fayl topshirish",
  reading: "O'qish",
  other: "Boshqa",
};

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  cash: "Naqd",
  click: "Click",
  payme: "Payme",
  bank: "Bank o'tkazmasi",
  other: "Boshqa",
};

export type Tone = "green" | "amber" | "red" | "blue" | "gray" | "brand";
