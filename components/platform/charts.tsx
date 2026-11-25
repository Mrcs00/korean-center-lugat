"use client";

import { useId } from "react";

// Small dependency-free SVG charts.

export function BarChart({
  data,
  height = 180,
  format = (n: number) => String(n),
  color = "var(--brand)",
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  format?: (n: number) => string;
  color?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / Math.max(1, data.length);
  const H = height / 4;
  return (
    <div>
      <svg viewBox={`0 0 100 ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id={`bar-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2="100" y1={H - g * (H - 6)} y2={H - g * (H - 6)} stroke="var(--border)" strokeWidth="0.3" strokeDasharray="1.5 1.5" vectorEffect="non-scaling-stroke" />
        ))}
        {data.map((d, i) => {
          const h = (d.value / max) * (H - 6);
          return (
            <rect key={i} x={i * w + w * 0.18} y={H - h} width={w * 0.64} height={Math.max(h, d.value > 0 ? 0.8 : 0)} rx="1.2" fill={d.color ?? `url(#bar-${uid})`}>
              <title>{`${d.label}: ${format(d.value)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex mt-1.5">
        {data.map((d, i) => (
          <div key={i} className="text-[10px] font-semibold text-muted text-center truncate" style={{ width: `${w}%` }} title={d.label}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineChart({
  data,
  height = 180,
  color = "var(--brand-darker)",
  format = (n: number) => String(n),
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  format?: (n: number) => string;
}) {
  const uid = useId().replace(/:/g, "");
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const H = height / 4;
  const step = data.length > 1 ? 100 / (data.length - 1) : 100;
  const pts = data.map((d, i) => [data.length > 1 ? i * step : 50, H - 4 - (d.value / max) * (H - 10)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;
  return (
    <div>
      <svg viewBox={`0 0 100 ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2="100" y1={H - 4 - g * (H - 10)} y2={H - 4 - g * (H - 10)} stroke="var(--border)" strokeWidth="0.3" strokeDasharray="1.5 1.5" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill={`url(#area-${uid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.3" fill="var(--surface)" stroke={color} strokeWidth="0.9" vectorEffect="non-scaling-stroke">
            <title>{`${data[i].label}: ${format(data[i].value)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between mt-1.5">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] font-semibold text-muted truncate">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Donut({ data, size = 140 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 15.9155;
  let offset = 25;
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg viewBox="0 0 42 42" width={size} height={size} role="img">
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--border)" strokeWidth="4.5" />
        {total > 0 &&
          data.map((d, i) => {
            const len = (d.value / total) * 100;
            const el = (
              <circle key={i} cx="21" cy="21" r={r} fill="none" stroke={d.color} strokeWidth="4.5" strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={offset}>
                <title>{`${d.label}: ${d.value}`}</title>
              </circle>
            );
            offset -= len;
            return el;
          })}
        <text x="21" y="22.5" textAnchor="middle" fontSize="7" fontWeight="800" fill="var(--foreground)">
          {total}
        </text>
      </svg>
      <ul className="text-sm flex flex-col gap-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
            <span className="text-muted">{d.label}</span>
            <span className="font-extrabold ml-1 tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
