import { useEffect, useMemo, useState } from "react";

function clampValue(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

export default function DonutGauge({ value = 0, severity, size = 160, stroke = 14 }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const safeValue = clampValue(value);

  useEffect(() => {
    let frameId;
    const startValue = animatedValue;
    const endValue = safeValue;
    const duration = 700;
    const startTime = performance.now();

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const currentValue = startValue + (endValue - startValue) * progress;
      setAnimatedValue(currentValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [safeValue]);

  const color = useMemo(() => {
    if (severity === "red") return "#ef4444";
    if (severity === "yellow") return "#f59e0b";
    if (severity === "green") return "#22c55e";
    return safeValue >= 85 ? "#22c55e" : safeValue >= 60 ? "#f59e0b" : "#ef4444";
  }, [severity, safeValue]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = animatedValue / 100;
  const dash = c * pct;
  const gap = c - dash;

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
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: "stroke 0.35s ease",
          filter:
            color === "#ef4444"
              ? "drop-shadow(0 0 6px rgba(239, 68, 68, 0.25))"
              : color === "#f59e0b"
              ? "drop-shadow(0 0 6px rgba(245, 158, 11, 0.25))"
              : "drop-shadow(0 0 6px rgba(34, 197, 94, 0.25))",
        }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="28"
        fontWeight="700"
        fill="var(--text)"
      >
        {Math.round(animatedValue)}%
      </text>
    </svg>
  );
}
