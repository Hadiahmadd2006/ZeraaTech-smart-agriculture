import twilio from "twilio";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are missing in .env");
  }

  return twilio(accountSid, authToken);
}

export function buildBilingualAlertMessage({
  farmName,
  sensorType,
  value,
  min,
  max,
  severity,
}) {
  const en = `ZeraaTech Alert: ${sensorType} on ${farmName} is ${value}. Allowed range: ${min}-${max}. Severity: ${severity}.`;
  const ar = `تنبيه ZeraaTech: قيمة ${sensorType} في ${farmName} هي ${value}. المدى الطبيعي هو من ${min} إلى ${max}. مستوى الخطورة: ${severity}.`;

  return `${en}\n${ar}`;
}

export async function sendSms(to, body) {
  try {
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!phoneNumber) {
      throw new Error("TWILIO_PHONE_NUMBER is missing in .env");
    }

    const client = getTwilioClient();

    const result = await client.messages.create({
      body,
      from: phoneNumber,
      to,
    });

    return {
      success: true,
      sid: result.sid,
      status: result.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}