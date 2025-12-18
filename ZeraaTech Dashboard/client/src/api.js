import { fallbackGauges, fallbackRecs, fallbackCrops } from "./data";

export async function fetchGauges() {
  try {
    const res = await fetch("http://localhost:4000/api/gauges", { credentials: "include" });
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback gauges:", err.message);
    return fallbackGauges;
  }
}

export async function fetchRecs() {
  try {
    const res = await fetch("http://localhost:4000/api/recommendations", { credentials: "include" });
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback recommendations:", err.message);
    return fallbackRecs;
  }
}

export async function fetchSensors() {
  try {
    const res = await fetch("http://localhost:4000/api/sensors", { credentials: "include" });
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch sensor data:", err.message);
    return null;
  }
}

export async function fetchCrops() {
  try {
    const res = await fetch("http://localhost:4000/api/crops", { credentials: "include" });
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch crops, using fallback crops:", err.message);
    return fallbackCrops;
  }
}

export async function fetchSettings() {
  try {
    const res = await fetch("http://localhost:4000/api/settings", { credentials: "include" });
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch settings:", err.message);
    return [];
  }
}

export async function updateSetting(key, value) {
  try {
    const res = await fetch(`http://localhost:4000/api/settings/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Could not update setting:", err.message);
    throw err;
  }
}
