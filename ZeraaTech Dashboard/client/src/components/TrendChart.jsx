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
    const date = new Date(item.timestamp || Date.now());
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: "Temperature",
        data: safeData.map((item) => Number(item.temperature || 0)),
      },
      {
        label: "Humidity",
        data: safeData.map((item) => Number(item.humidity || 0)),
      },
      {
        label: "Moisture",
        data: safeData.map((item) => Number(item.moisture || 0)),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
  };

  return (
    <div style={{ height: "250px", width: "100%" }}>
      <Line data={chartData} options={options} />
    </div>
  );
}