const COLORS = { good: "#22c55e", water: "#0ea5e9", spray: "#ef4444", shade: "#f59e0b" };
const ICONS = { good: "✓", water: "💧", spray: "🧪", shade: "☂" };

const PLANT_NAMES = {
  Tomato: { en: "Tomato", ar: "طماطم" },
  Potato: { en: "Potato", ar: "بطاطس" },
  Pepper: { en: "Pepper", ar: "فلفل" },
  Wheat: { en: "Wheat", ar: "قمح" },
};

const HINTS = {
  "10m": { en: "10m", ar: "10 دقائق" },
  today: { en: "today", ar: "اليوم" },
  noon: { en: "noon", ar: "الظهر" },
};

export default function RecommendationTile({ img, plant, status, hint, lang = "en" }) {
  const color = COLORS[status] || "#9ca3af";
  const icon = ICONS[status] || "•";

  const nameMap = PLANT_NAMES[plant];
  const name = nameMap ? nameMap[lang] || nameMap.en : plant;

  const hintMap = hint ? HINTS[hint] : null;
  const hintText = hintMap ? hintMap[lang] || hintMap.en : hint;

  return (
    <div className="rec">
      <img src={img} alt={name} />
      <div className="rec-bar">
        <span className="pill" style={{ background: color }}>
          {icon}
        </span>
        <div className="rec-name">{name}</div>
        {hintText ? <div className="rec-hint">{hintText}</div> : null}
      </div>
    </div>
  );
}

