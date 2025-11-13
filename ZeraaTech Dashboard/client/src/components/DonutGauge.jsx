export default function DonutGauge({ value=0, size=160, stroke=14 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamp = Math.max(0, Math.min(100, value));
  const pct = clamp / 100;
  const dash = c * pct;
  const gap = c - dash;
  const color = clamp >= 85 ? "#22c55e" : clamp >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--line)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fontSize="28" fontWeight="700" fill="var(--text)">{clamp}%</text>
    </svg>
  );
}
