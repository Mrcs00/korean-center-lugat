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
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / Math.max(1, data.length);
  return (
    <div>
      <svg viewBox={`0 0 100 ${height / 4}`} className="w-full" style={{ height }} preserveAspectRatio="none" role="img">
        {data.map((d, i) => {
          const h = (d.value / max) * (height / 4 - 6);
          return (
            <rect key={i} x={i * w + w * 0.18} y={height / 4 - h} width={w * 0.64} height={Math.max(h, d.value > 0 ? 0.8 : 0)} rx="1.2" fill={d.color ?? color}>
              <title>{`${d.label}: ${format(d.value)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex mt-1.5">
        {data.map((d, i) => (
          <div key={i} className="text-[10px] text-muted text-center truncate" style={{ width: `${w}%` }} title={d.label}>
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
        <path d={area} fill="var(--brand)" opacity="0.28" />
        <path d={line} fill="none" stroke={color} strokeWidth="0.9" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.1" fill={color}>
            <title>{`${data[i].label}: ${format(data[i].value)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between mt-1.5">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-muted truncate">
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
    <div className="flex items-center gap-5 flex-wrap">
      <svg viewBox="0 0 42 42" width={size} height={size} role="img">
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        {total > 0 &&
          data.map((d, i) => {
            const len = (d.value / total) * 100;
            const el = (
              <circle key={i} cx="21" cy="21" r={r} fill="none" stroke={d.color} strokeWidth="5" strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={offset}>
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
      <ul className="text-sm flex flex-col gap-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-muted">{d.label}</span>
            <span className="font-bold ml-1">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
