const COLORS = { good:"#22c55e", water:"#0ea5e9", spray:"#ef4444", shade:"#f59e0b" };
const ICONS  = { good:"✅", water:"💧", spray:"🧴", shade:"⛱️" };

export default function RecommendationTile({ img, plant, status, hint }) {
  const color = COLORS[status] || "#9ca3af";
  const icon  = ICONS[status]  || "ℹ️";
  return (
    <div className="rec">
      <img src={img} alt={plant} />
      <div className="rec-bar">
        <span className="pill" style={{background:color}}>{icon}</span>
        <div className="rec-name">{plant}</div>
        {hint ? <div className="rec-hint">{hint}</div> : null}
      </div>
    </div>
  );
}