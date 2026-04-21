import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { fetchSensorHistory } from "../api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function SensorHistoryChart({ farmId, type, lang = "en" }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const { data, minThreshold, maxThreshold } = await fetchSensorHistory(farmId, type, 24);
        if (!active) return;
        
        if (!data || data.length === 0) {
          setChartData(null);
          return;
        }

        const labels = [];
        const datasetValues = [];

        data.forEach((d) => {
          const date = new Date(d.recordedAt);
          const timeString = date.toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
          labels.push(timeString);
          
          let val = null;
          if (type === "water") val = d.moisture;
          else if (type === "soil") val = d.ph;
          else if (type === "health") {
            // Simplified approximation for historical health score
            const moistureScore = Math.max(0, 100 - Math.abs((d.moisture || 50) - 50) * 2);
            const tempScore = Math.max(0, 100 - Math.abs((d.temperature || 25) - 25) * 3);
            const phScore = Math.max(0, 100 - Math.abs((d.ph || 6.5) - 6.5) * 20);
            val = Math.round((moistureScore + tempScore + phScore) / 3);
          }
          datasetValues.push(val);
        });

        const datasets = [
          {
            label: type === "water" ? (lang === "ar" ? "الرطوبة" : "Moisture") 
                 : type === "soil" ? (lang === "ar" ? "درجة الحموضة" : "pH") 
                 : (lang === "ar" ? "الصحة العامة" : "Health Score"),
            data: datasetValues,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            tension: 0.3,
            fill: true,
            pointRadius: 0,
          },
        ];

        // Add threshold lines as separate datasets if they exist
        if (minThreshold !== null) {
          datasets.push({
            label: lang === "ar" ? "الحد الأدنى" : "Min Threshold",
            data: labels.map(() => minThreshold),
            borderColor: "rgba(255, 99, 132, 0.7)",
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            borderWidth: 1,
          });
        }
        
        if (maxThreshold !== null) {
          datasets.push({
            label: lang === "ar" ? "الحد الأقصى" : "Max Threshold",
            data: labels.map(() => maxThreshold),
            borderColor: "rgba(255, 99, 132, 0.7)",
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            borderWidth: 1,
          });
        }

        setChartData({
          labels,
          datasets,
        });
      } catch (error) {
        console.error("Error loading history data", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    
    loadData();
    return () => { active = false; };
  }, [farmId, type, lang]);

  if (loading) return <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>...</div>;
  if (!chartData) return <div className="muted" style={{ textAlign: "center", margin: "20px 0" }}>{lang === "ar" ? "لا توجد بيانات" : "No trend data"}</div>;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        ticks: {
          maxTicksLimit: 8
        }
      },
      y: {
        display: true,
        suggestedMin: type === "soil" ? 0 : 0,
        suggestedMax: type === "soil" ? 14 : 100,
      },
    },
  };

  return (
    <div style={{ height: "250px", width: "100%", marginTop: "20px" }} dir="ltr">
      <Line data={chartData} options={options} />
    </div>
  );
}
