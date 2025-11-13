import { fallbackGauges, fallbackRecs } from "./data";

// Fetches gauge data; falls back to local static data if backend is offline.
export async function fetchGauges() {
  try {
    const res = await fetch("http://localhost:4000/api/gauges");
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback gauges:", err.message);
    return fallbackGauges;
  }
}

// Fetches crop recommendations; falls back to static data if backend fails.
export async function fetchRecs() {
  try {
    const res = await fetch("http://localhost:4000/api/recommendations");
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback recommendations:", err.message);
    return fallbackRecs;
  }
}

// Optional: Fetches sensor data from the backend (if Arduino integration added)
export async function fetchSensors() {
  try {
    const res = await fetch("http://localhost:4000/api/sensors");
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch sensor data:", err.message);
    return null;
  }
}

