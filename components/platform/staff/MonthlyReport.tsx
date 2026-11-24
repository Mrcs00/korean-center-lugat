"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorNote, Field, Select, Spinner, Textarea, useLoad } from "@/components/platform/ui";
import type { GroupFull } from "@/lib/platform/api";
import { loadMonthlyReport, type ReportHwStatus } from "@/lib/platform/monthlyReport";
import { ATTENDANCE } from "@/lib/platform/labels";
import { formatDate, formatPeriod } from "@/lib/platform/format";
import { shiftMonth, tashkentDateKey } from "@/lib/utils/dates";

const HW_LABEL: Record<ReportHwStatus, string> = {
  graded: "Baholangan",
  handed: "Topshirgan",
  revision: "Qayta ishlash kerak",
  missing: "Bajarmagan",
  pending: "Muddati kelmagan",
};

// Printed page only: everything else is hidden, so "Save as PDF" gives one clean report.
const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 12mm; }
  body * { visibility: hidden !important; }
  #kc-report, #kc-report * { visibility: visible !important; }
  #kc-report { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; padding: 0 !important; }
  #kc-report .kc-keep { break-inside: avoid; page-break-inside: avoid; }
  .kc-noprint { display: none !important; }
}
`;

const th = "text-left text-[11px] font-semibold text-neutral-500 py-1.5 pr-3 border-b border-neutral-300";
const td = "text-[13px] py-1.5 pr-3 border-b border-neutral-200 align-top";

export function MonthlyReport({ studentId, studentName, groups }: { studentId: string; studentName: string; groups: GroupFull[] }) {
  const thisMonth = tashkentDateKey().slice(0, 7);
  const [period, setPeriod] = useState(thisMonth);
  const [comment, setComment] = useState("");
  const months = Array.from({ length: 12 }, (_, i) => shiftMonth(thisMonth, -i));
  const key = groups.map((g) => g.id).join(",");
  const res = useLoad(() => loadMonthlyReport(studentId, groups, period), [studentId, period, key]);
  const d = res.data;

  const savePdf = () => {
    const old = document.title;
    document.title = `Hisobot - ${studentName} - ${period}`;
    try {
      window.print();
    } finally {
      document.title = old;
    }
  };

  const teachers = [...new Set(groups.map((g) => g.teacher?.full_name).filter(Boolean))].join(", ");

  return (
    <div className="flex flex-col gap-4">
      <style>{PRINT_CSS}</style>

      <div className="kc-noprint flex flex-wrap items-end gap-3">
        <Field label="Oy" className="w-48">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {months.map((m) => <option key={m} value={m}>{formatPeriod(m)}</option>)}
          </Select>
        </Field>
        <Button onClick={savePdf} disabled={!d}><Printer size={16} /> PDF saqlash</Button>
      </div>
      <Field label="Ustoz izohi (PDF'ga tushadi)" className="kc-noprint">
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="min-h-[44px]" placeholder="Ota-onaga ustoz fikri: o'quvchi qanday o'qiyapti, nimaga e'tibor berish kerak..." />
      </Field>
      <p className="kc-noprint text-xs text-muted">&quot;PDF saqlash&quot; bossangiz chop etish oynasi ochiladi. Printer joyida &quot;PDF sifatida saqlash&quot; (Save as PDF) ni tanlab saqlang.</p>

      {res.loading && <Spinner />}
      {res.error && <ErrorNote message={res.error} onRetry={res.reload} />}

      {d && (
        <div id="kc-report" className="bg-white text-black rounded-2xl border border-border p-6 sm:p-8 max-w-[800px] w-full mx-auto" style={{ colorScheme: "light" }}>
          <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-3 mb-4">
            <div>
              <p className="text-xl font-extrabold">Korean Center</p>
              <p className="text-xs text-neutral-600">O&apos;quvchining oylik hisoboti</p>
            </div>
            <p className="text-sm font-bold text-right">{formatPeriod(period)}</p>
          </div>

          <div className="mb-4">
            <p className="text-lg font-extrabold">{studentName}</p>
            <p className="text-xs text-neutral-600">
              Guruh: {groups.map((g) => g.name).join(", ") || "—"}{teachers ? ` · Ustoz: ${teachers}` : ""}
            </p>
          </div>

          <div className="kc-keep grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Davomat", value: d.attendance.rate === null ? "—" : `${d.attendance.rate}%`, hint: `${d.attendance.total} ta darsdan` },
              { label: "Uy vazifalari", value: d.hwStats.given ? `${d.hwStats.done}/${d.hwStats.given}` : "—", hint: d.hwStats.avgPct === null ? "o'rtacha ball yo'q" : `o'rtacha ${d.hwStats.avgPct}%` },
              { label: "Lug'at topshiriqlari", value: d.vocab.length ? `${d.vocab.filter((v) => v.done).length}/${d.vocab.length}` : "—", hint: "bajarilgan" },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-neutral-300 px-3 py-2.5">
                <p className="text-[11px] text-neutral-500">{c.label}</p>
                <p className="text-xl font-extrabold leading-tight">{c.value}</p>
                <p className="text-[11px] text-neutral-500">{c.hint}</p>
              </div>
            ))}
          </div>

          <section className="kc-keep mb-5">
            <h3 className="text-sm font-extrabold mb-1">Davomat</h3>
            {d.attendance.total === 0 ? (
              <p className="text-[13px] text-neutral-600">Bu oy davomat belgilanmagan.</p>
            ) : (
              <p className="text-[13px]">
                Keldi: <b>{d.attendance.present}</b> · Kechikdi: <b>{d.attendance.late}</b> · Sababli: <b>{d.attendance.excused}</b> · Kelmadi: <b>{d.attendance.absent}</b>
              </p>
            )}
          </section>

          <section className="mb-5">
            <h3 className="text-sm font-extrabold mb-1">O&apos;tilgan darslar</h3>
            {d.lessons.length === 0 ? (
              <p className="text-[13px] text-neutral-600">Bu oy o&apos;tilgan dars yo&apos;q.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead><tr><th className={th}>Sana</th><th className={th}>Mavzu</th><th className={th}>Davomat</th></tr></thead>
                <tbody>
                  {d.lessons.map((l, i) => (
                    <tr key={i} className="kc-keep">
                      <td className={`${td} whitespace-nowrap`}>{formatDate(l.date)}</td>
                      <td className={td}>{l.topic || <span className="text-neutral-400">—</span>}</td>
                      <td className={`${td} whitespace-nowrap`}>{l.status ? ATTENDANCE[l.status].label : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="mb-5">
            <h3 className="text-sm font-extrabold mb-1">Uy vazifalari</h3>
            {d.homework.length === 0 ? (
              <p className="text-[13px] text-neutral-600">Bu oy muddati tushgan vazifa yo&apos;q.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead><tr><th className={th}>Vazifa</th><th className={th}>Muddat</th><th className={th}>Holat</th><th className={th}>Ball</th></tr></thead>
                <tbody>
                  {d.homework.map((h) => (
                    <tr key={h.id} className="kc-keep">
                      <td className={td}>{h.title}</td>
                      <td className={`${td} whitespace-nowrap`}>{h.due ? formatDate(h.due.slice(0, 10)) : "—"}</td>
                      <td className={`${td} whitespace-nowrap`}>{HW_LABEL[h.status]}</td>
                      <td className={`${td} whitespace-nowrap font-bold`}>{h.status === "graded" ? `${h.score ?? "—"}/${h.points}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="mb-5">
            <h3 className="text-sm font-extrabold mb-1">Lug&apos;at topshiriqlari</h3>
            {d.vocab.length === 0 ? (
              <p className="text-[13px] text-neutral-600">Bu oy muddati tushgan lug&apos;at topshirig&apos;i yo&apos;q.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead><tr><th className={th}>Topshiriq</th><th className={th}>Muddat</th><th className={th}>Natija</th><th className={th}>Holat</th></tr></thead>
                <tbody>
                  {d.vocab.map((v) => (
                    <tr key={v.id} className="kc-keep">
                      <td className={td}>{v.title}<span className="block text-[11px] text-neutral-500">{v.detail}</span></td>
                      <td className={`${td} whitespace-nowrap`}>{formatDate(v.deadline)}</td>
                      <td className={`${td} whitespace-nowrap font-bold`}>{v.pct}%</td>
                      <td className={`${td} whitespace-nowrap`}>{v.done ? "Bajargan" : v.started ? "Jarayonda" : "Boshlamagan"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {comment.trim() && (
            <section className="kc-keep mb-5 rounded-xl border border-neutral-300 px-4 py-3">
              <h3 className="text-sm font-extrabold mb-1">Ustoz izohi</h3>
              <p className="text-[13px] whitespace-pre-line">{comment.trim()}</p>
            </section>
          )}

          <p className="text-[11px] text-neutral-500 border-t border-neutral-300 pt-2">Hisobot sanasi: {formatDate(tashkentDateKey())}</p>
        </div>
      )}
    </div>
  );
}
