/*
 * ZeraaTech Smart Agriculture — ESP32 IoT Firmware (LoRa Node)
 * Hardware: ESP32 + DHT22 + Capacitive Soil Moisture Sensor + LoRa Module
 *
 * Sensors:
 *   - DHT22  → temperature (°C) + humidity (%)
 *   - SOIL   → real soil moisture (inverted ADC reading)
 *
 * Transmits JSON payload via LoRa radio every 60 s.
 * Requires a separate LoRa Gateway to receive and forward to the internet.
 */

#include <SPI.h>
#include <LoRa.h>
#include <DHTesp.h>
#include <ArduinoJson.h>

// ── Pin definitions ───────────────────────────────────────────────────────────
#define DHT_PIN          33      // DHT22 data pin
#define SOIL_SENSOR_PIN  34      // Real capacitive soil moisture sensor (ADC1)

// ── LoRa Config ───────────────────────────────────────────────────────────────
// Adjust these SPI pins to match your ESP32-to-LoRa module wiring
#define ss 5
#define rst 14
#define dio0 2
// Adjust the band for your region (433E6 for Asia/Europe, 868E6 for Europe, 915E6 for NA)
#define BAND 433E6 

// ── System Config ─────────────────────────────────────────────────────────────
const char* FARM_ID       = "69d01a19cdfb068a97883344";  // South Farm
const char* DEVICE_ID     = "esp32-lora-node-farm1";

// Intervals
const unsigned long NORMAL_INTERVAL = 60000;  // 60 s
const unsigned long BURST_INTERVAL  = 10000;  // 10 s when anomaly detected

// ── Globals ───────────────────────────────────────────────────────────────────
DHTesp dht;
unsigned long lastPost = 0;
unsigned long postInterval = NORMAL_INTERVAL;

// Rolling history for outlier detection (last 10 readings)
float tempHistory[10];
float humHistory[10];
int   historyIndex = 0;
bool  historyFull  = false;

// ── Outlier check (simple 2-sigma) ───────────────────────────────────────────
bool isOutlier(float value, float* history, int len) {
  if (len < 5) return false;
  float sum = 0;
  for (int i = 0; i < len; i++) sum += history[i];
  float avg = sum / len;
  float varSum = 0;
  for (int i = 0; i < len; i++) varSum += pow(history[i] - avg, 2);
  float stdDev = sqrt(varSum / len);
  if (stdDev == 0) return false;
  return abs(value - avg) > 2 * stdDev;
}

// ── Read sensors ─────────────────────────────────────────────────────────────
float readMoisture() {
  int raw = analogRead(SOIL_SENSOR_PIN);
  
  // Capacitive soil sensors typically read HIGH when dry and LOW when wet.
  // Example calibration: 3500 (completely dry), 1500 (submerged in water)
  // You must test your specific sensor and update these values!
  int dryValue = 3500;
  int wetValue = 1500;
  
  float moisture = map(raw, dryValue, wetValue, 0, 100);
  
  // Clamp values between 0% and 100%
  if (moisture < 0) moisture = 0;
  if (moisture > 100) moisture = 100;
  
  return moisture;
}

// ── LoRa Transmission ────────────────────────────────────────────────────────
bool transmitReading(float temp, float hum, float moisture) {
  StaticJsonDocument<256> doc;
  doc["farm"]        = FARM_ID;
  doc["deviceId"]    = DEVICE_ID;
  doc["temperature"] = temp;
  doc["humidity"]    = hum;
  doc["moisture"]    = moisture;
  doc["ph"]          = 6.5;      // Hardcoded default (pH sensor removed)
  doc["rainfall"]    = 0;        // no rain sensor
  doc["source"]      = "iot-lora";

  char body[256];
  serializeJson(doc, body);

  Serial.printf("[LoRa] Transmitting: %s\n", body);

  LoRa.beginPacket();
  LoRa.print(body);
  int status = LoRa.endPacket();

  if (status) {
    Serial.println("[LoRa] Packet sent successfully.");
    return true;
  } else {
    Serial.println("[LoRa] Packet transmission failed.");
    return false;
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);

  dht.setup(DHT_PIN, DHTesp::DHT22);
  Serial.println("[DHT] DHT22 initialised");

  // Initialize LoRa
  LoRa.setPins(ss, rst, dio0);
  if (!LoRa.begin(BAND)) {
    Serial.println("[LoRa] Initialization failed! Check your wiring.");
    while (1); // Halt execution if LoRa module is not found
  }
  Serial.println("[LoRa] Initialized successfully.");
}

// ── Loop ──────────────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  if (now - lastPost < postInterval) return;
  lastPost = now;

  // Read DHT22
  TempAndHumidity reading = dht.getTempAndHumidity();
  float temp = reading.temperature;
  float hum  = reading.humidity;

  // Validate DHT reading
  if (isnan(temp) || isnan(hum)) {
    Serial.println("[DHT] NaN reading — sensor disconnected or not ready");
    return;
  }

  // Read Soil Moisture
  float moisture = readMoisture();

  Serial.printf("[Sensors] Temp=%.1f°C  Hum=%.1f%%  Moisture=%.1f%%\n",
                temp, hum, moisture);

  // Outlier detection
  int histLen = historyFull ? 10 : historyIndex;
  bool tempOutlier = isOutlier(temp, tempHistory, histLen);
  bool humOutlier  = isOutlier(hum,  humHistory,  histLen);

  if (tempOutlier || humOutlier) {
    Serial.println("[Outlier] Anomaly detected — switching to burst mode (10s)");
    postInterval = BURST_INTERVAL;
  } else {
    postInterval = NORMAL_INTERVAL;
  }

  // Update rolling history
  tempHistory[historyIndex] = temp;
  humHistory[historyIndex]  = hum;
  historyIndex = (historyIndex + 1) % 10;
  if (historyIndex == 0) historyFull = true;

  // Transmit via LoRa
  transmitReading(temp, hum, moisture);
}
