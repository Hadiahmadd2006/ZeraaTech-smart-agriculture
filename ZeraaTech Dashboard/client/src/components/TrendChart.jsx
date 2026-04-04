import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function TrendChart({ data = [] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div>No trend data</div>;
  }

  const safeData = data.filter((item) => item && typeof item === "object");

  if (safeData.length === 0) {
    return <div>No trend data</div>;
  }

  const labels = safeData.map((item) => {
    const date = new Date(item.recordedAt || item.timestamp || Date.now());
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: safeData.map((item) => item.temperature ?? null),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.1)",
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: "Humidity (%)",
        data: safeData.map((item) => item.humidity ?? null),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.1)",
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: "Moisture (%)",
        data: safeData.map((item) => item.moisture ?? null),
        borderColor: "#16a34a",
        backgroundColor: "rgba(22,163,74,0.1)",
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: "pH",
        data: safeData.map((item) => item.ph ?? null),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.1)",
        tension: 0.3,
        pointRadius: 3,
        yAxisID: "yPh",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      y: {
        type: "linear",
        position: "left",
        title: { display: true, text: "°C / %" },
        min: 0,
        max: 100,
      },
      yPh: {
        type: "linear",
        position: "right",
        title: { display: true, text: "pH" },
        min: 0,
        max: 14,
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div style={{ height: "250px", width: "100%" }}>
      <Line data={chartData} options={options} />
    </div>
  );
}