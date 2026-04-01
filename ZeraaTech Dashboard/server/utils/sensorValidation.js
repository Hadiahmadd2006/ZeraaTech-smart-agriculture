export const SENSOR_RANGES = {
  moisture: { min: 0, max: 100 },
  ph: { min: 0, max: 14 },
  temperature: { min: -10, max: 60 },
  humidity: { min: 0, max: 100 },
  rainfall: { min: 0, max: 300 },
};

export function validateSensorPayload(payload) {
  const errors = [];

  const requiredFields = ["moisture", "temperature", "humidity", "ph", "rainfall"];
  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null) {
      errors.push(`${field} is required`);
    }
  }

  for (const [field, range] of Object.entries(SENSOR_RANGES)) {
    const value = Number(payload[field]);
    if (!Number.isNaN(value)) {
      if (value < range.min || value > range.max) {
        errors.push(`${field} must be between ${range.min} and ${range.max}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
export function isOutlier(value, history = []) {
  if (!history.length) return false;
  if (history.length < 5) return false;

  const avg = history.reduce((sum, x) => sum + x, 0) / history.length;
  const variance =
    history.reduce((sum, x) => sum + Math.pow(x - avg, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return false;

  return Math.abs(value - avg) > 2 * stdDev;
}