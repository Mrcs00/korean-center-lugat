"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar, EmptyState, ErrorNote, Field, Input, Panel, Select, Spinner, Badge } from "@/components/platform/ui";
import { useToast } from "@/components/platform/Toast";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getAttendance, listLessons, listMembers, saveAttendance, setLessonTopic, listAttendance, attendanceRate, type GroupFull, type Member } from "@/lib/platform/api";
import { ATTENDANCE } from "@/lib/platform/labels";
import { formatDate, timeRange } from "@/lib/platform/format";
import { isoWeekday, shiftDateKey, tashkentDateKey } from "@/lib/utils/dates";
import type { AttendanceStatus } from "@/lib/platform/types";
import { useLoad } from "@/components/platform/ui";

type Marks = Record<string, { status: AttendanceStatus | null; note: string }>;
const STATUSES = Object.keys(ATTENDANCE) as AttendanceStatus[];

const TONE_ON: Record<string, string> = {
  green: "bg-green text-white border-green",
  amber: "bg-amber text-white border-amber",
  red: "bg-red text-white border-red",
  blue: "bg-blue text-white border-blue",
};

// Mark who came to a lesson. Works for one group at a time.
export function AttendanceView({ groups, fixedGroupId }: { groups: GroupFull[]; fixedGroupId?: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const today = tashkentDateKey();
  const [groupId, setGroupId] = useState(fixedGroupId ?? groups[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [marks, setMarks] = useState<Marks>({});
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);

  const group = groups.find((g) => g.id === groupId);

  const members = useLoad(() => (groupId ? listMembers(groupId) : Promise.resolve([] as Member[])), [groupId]);
  const saved = useLoad(() => (groupId ? getAttendance(groupId, date) : Promise.resolve({ lesson: null, rows: [] })), [groupId, date]);
  const history = useLoad(() => (groupId ? listLessons([groupId], shiftDateKey(today, -60), today) : Promise.resolve([])), [groupId]);
  const stats = useLoad(() => (groupId ? listAttendance({ groupIds: [groupId], from: shiftDateKey(today, -60) }) : Promise.resolve([])), [groupId]);

  // when the group or date changes, load what was saved
  useEffect(() => {
    if (!saved.data || !members.data) return;
    const next: Marks = {};
    members.data.forEach((m) => {
      const row = saved.data!.rows.find((r) => r.student_id === m.student_id);
      next[m.student_id] = { status: row?.status ?? null, note: row?.note ?? "" };
    });
    setMarks(next);
    setTopic(saved.data.lesson?.topic ?? "");
  }, [saved.data, members.data]);

  const list = members.data ?? [];
  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = { present: 0, late: 0, absent: 0, excused: 0 };
    Object.values(marks).forEach((m) => m.status && c[m.status]++);
    return c;
  }, [marks]);
  const marked = Object.values(marks).filter((m) => m.status).length;

  const isLessonDay = group ? group.lesson_days.includes(isoWeekday(date)) : false;

  const setStatus = (id: string, status: AttendanceStatus) => setMarks((p) => ({ ...p, [id]: { note: p[id]?.note ?? "", status } }));
  const markAll = (status: AttendanceStatus) => setMarks((p) => Object.fromEntries(list.map((m) => [m.student_id, { note: p[m.student_id]?.note ?? "", status }])));

  const save = async () => {
    if (!group || !user) return;
    setBusy(true);
    try {
      const entries = list.filter((m) => marks[m.student_id]?.status).map((m) => ({ student_id: m.student_id, status: marks[m.student_id].status as AttendanceStatus, note: marks[m.student_id].note.trim() || null }));
      await saveAttendance(group, date, entries, user.id);
      if (topic.trim() !== (saved.data?.lesson?.topic ?? "")) await setLessonTopic(group, date, topic, user.id);
      toast.success("Davomat saqlandi.");
      saved.reload();
      history.reload();
      stats.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (groups.length === 0) return <EmptyState icon={CalendarCheck} title="Guruh yo'q" text="Davomat belgilash uchun sizga guruh biriktirilishi kerak." />;

  const lessonDates = new Set((history.data ?? []).map((l) => l.lesson_date));
  const rate = attendanceRate(stats.data ?? []);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Panel>
          <div className="grid sm:grid-cols-3 gap-4 mb-5">
            {!fixedGroupId && (
              <Field label="Guruh">
                <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Sana">
              <Input type="date" value={date} max={shiftDateKey(today, 30)} onChange={(e) => e.target.value && setDate(e.target.value)} />
            </Field>
            <Field label="Dars mavzusi">
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Masalan: 4-dars" />
            </Field>
          </div>

          {group && (
            <p className="text-xs text-muted mb-4">
              {isLessonDay ? `Bu kun dars kuni (${timeRange(group.start_time, group.end_time) || "vaqti belgilanmagan"}).` : "Bu kun guruhning odatiy dars kuni emas, lekin davomat belgilashingiz mumkin."}
            </p>
          )}

          {members.error && <ErrorNote message={members.error} />}
          {members.loading || saved.loading ? (
            <Spinner />
          ) : list.length === 0 ? (
            <EmptyState title="Guruhda o'quvchi yo'q" />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Button size="sm" variant="secondary" onClick={() => markAll("present")}>
                  <Check size={14} /> Hammasi keldi
                </Button>
                <span className="text-xs text-muted">
                  Belgilangan: {marked}/{list.length}
                </span>
              </div>

              <div className="flex flex-col">
                {list.map((m) => {
                  const mark = marks[m.student_id];
                  return (
                    <div key={m.student_id} className="flex flex-wrap items-center gap-3 py-3 border-b border-border last:border-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1 basis-48">
                        <Avatar name={m.profile?.full_name ?? "?"} size={36} />
                        <p className="font-semibold text-sm truncate">{m.profile?.full_name}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {STATUSES.map((s) => {
                          const on = mark?.status === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setStatus(m.student_id, s)}
                              title={ATTENDANCE[s].label}
                              className={`h-9 min-w-[2.6rem] px-2.5 rounded-lg border text-xs font-bold transition-colors ${on ? TONE_ON[ATTENDANCE[s].tone] : "border-border text-muted hover:border-border-strong"}`}
                            >
                              {ATTENDANCE[s].short}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <Badge key={s} tone={ATTENDANCE[s].tone}>
                      {ATTENDANCE[s].label}: {counts[s]}
                    </Badge>
                  ))}
                </div>
                <Button onClick={save} disabled={busy || marked === 0}>
                  <Save size={16} /> {busy ? "Saqlanmoqda..." : "Davomatni saqlash"}
                </Button>
              </div>
            </>
          )}
        </Panel>
      </div>

      <div className="flex flex-col gap-6">
        <Panel title="Oxirgi 60 kun">
          <p className="text-3xl font-extrabold">{stats.data?.length ? `${rate}%` : "—"}</p>
          <p className="text-xs text-muted">o&apos;rtacha davomat</p>
        </Panel>
        <Panel title="O'tkazilgan darslar">
          {(history.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">Hali dars belgilanmagan.</p>
          ) : (
            <div className="flex flex-col">
              {[...(history.data ?? [])].reverse().slice(0, 12).map((l) => (
                <button key={l.id} onClick={() => setDate(l.lesson_date)} className={`flex items-center justify-between gap-2 py-2.5 border-b border-border last:border-0 text-left text-sm ${l.lesson_date === date ? "font-bold" : ""}`}>
                  <span>{formatDate(l.lesson_date)}</span>
                  <span className="text-xs text-muted truncate">{l.topic ?? ""}</span>
                </button>
              ))}
            </div>
          )}
          {lessonDates.size > 0 && <p className="text-[11px] text-muted-soft mt-3">Sanani bosing, davomatni tahrirlash mumkin.</p>}
        </Panel>
      </div>
    </div>
  );
}
