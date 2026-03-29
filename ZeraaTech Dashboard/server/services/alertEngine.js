import Alert from "../models/Alert.js";
import AlertLog from "../models/AlertLog.js";
import Threshold from "../models/Threshold.js";
import Farm from "../models/Farm.js";
import { buildBilingualAlertMessage, sendSms } from "../utils/sms.js";

function getSeverity(value, min, max) {
  if (min != null && value < min) {
    const diff = (min - value) / min;
    if (diff > 0.4) return "Critical";
    if (diff > 0.2) return "High";
    return "Medium";
  }

  if (max != null && value > max) {
    const diff = (value - max) / max;
    if (diff > 0.4) return "Critical";
    if (diff > 0.2) return "High";
    return "Medium";
  }

  return null;
}

async function isDuplicateAlert(farmId, sensorType, min, max) {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const existing = await Alert.findOne({
    farm: farmId,
    sensorType,
    thresholdMin: min,
    thresholdMax: max,
    createdAt: { $gte: fifteenMinutesAgo },
    status: { $ne: "Closed" },
  });

  return !!existing;
}

async function canSendMoreSms(recipient) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const count = await AlertLog.countDocuments({
    recipient,
    channel: "sms",
    createdAt: { $gte: oneHourAgo },
  });

  return count < 10;
}

export async function checkThresholdsAndCreateAlerts(sensorReading) {
  const thresholds = await Threshold.find();
  const farm = await Farm.findById(sensorReading.farm).populate("owner");

  if (!farm) return;

  const sensorMap = {
    moisture: { minKey: "soilMoistureMin", maxKey: "soilMoistureMax" },
    temperature: { minKey: "temperatureMin", maxKey: "temperatureMax" },
    humidity: { minKey: "humidityMin", maxKey: "humidityMax" },
    light: { minKey: "lightMin", maxKey: "lightMax" },
    ph: { minKey: "phMin", maxKey: "phMax" },
  };

  for (const sensorType of Object.keys(sensorMap)) {
    const value = sensorReading[sensorType];
    if (value == null) continue;

    const minThreshold = thresholds.find((t) => t.key === sensorMap[sensorType].minKey);
    const maxThreshold = thresholds.find((t) => t.key === sensorMap[sensorType].maxKey);

    const min = minThreshold?.value;
    const max = maxThreshold?.value;

    const severity = getSeverity(value, min, max);
    if (!severity) continue;

    const duplicate = await isDuplicateAlert(sensorReading.farm, sensorType, min, max);
    if (duplicate) continue;

    const message = `${sensorType} value ${value} is outside safe range (${min} - ${max})`;

    const alert = await Alert.create({
      farm: sensorReading.farm,
      sensorReading: sensorReading._id,
      type: "Threshold Breach",
      sensorType,
      measuredValue: value,
      thresholdMin: min,
      thresholdMax: max,
      message,
      severity,
      dedupeKey: `${sensorReading.farm}-${sensorType}-${min}-${max}`,
    });

    const smsBody = buildBilingualAlertMessage({
      farmName: farm.name,
      sensorType,
      value,
      min,
      max,
      severity,
    });

    const recipient = farm.owner?.phone || "no-phone";
    let deliveryStatus = "failed";
    let providerMessageSid = undefined;
    let errorMessage = "No phone number";
    let channel = "sms";

    if (severity === "High" || severity === "Critical") {
      if (farm.owner?.phone) {
        const smsAllowed = await canSendMoreSms(farm.owner.phone);

        if (!smsAllowed) {
          deliveryStatus = "rate_limited";
          errorMessage = "SMS rate limit exceeded";
        } else {
          const result = await sendSms(farm.owner.phone, smsBody);
          deliveryStatus = result.success ? result.status || "sent" : "failed";
          providerMessageSid = result.sid;
          errorMessage = result.error;
        }
      }
    } else {
      deliveryStatus = "queued";
      errorMessage = "SMS not required for this severity";
    }

    await AlertLog.create({
      alert: alert._id,
      farm: sensorReading.farm,
      recipient,
      channel,
      language: "both",
      messageBody: smsBody,
      deliveryStatus,
      provider: "twilio",
      providerMessageSid,
      errorMessage,
      severity,
      sensorType,
    });
  }
}