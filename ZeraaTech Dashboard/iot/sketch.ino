/*
 * ZeraaTech Smart Agriculture — ESP32 IoT Firmware
 * Wokwi simulation: ESP32 + DHT22 + potentiometer + 3 LEDs
 *
 * Sensors:
 *   - DHT22  → temperature (°C) + humidity (%)
 *   - POT 1  → soil moisture (0–100%)
 *   - POT 2  → pH (4.0–9.0)   [map second pot or share one]
 *
 * LEDs:
 *   - GREEN  → readings normal, last POST succeeded
 *   - YELLOW (Blue LED) → anomaly detected / warning
 *   - RED    → POST failed or critical threshold
 *
 * Sends JSON to POST /api/sensors/ingest every 60 s.
 * Header: x-api-key: zeraatech-iot-secret-key
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHTesp.h>
#include <ArduinoJson.h>

// ── Pin definitions ───────────────────────────────────────────────────────────
#define DHT_PIN       33      // DHT22 data pin
#define POT_MOISTURE  34      // Potentiometer → soil moisture (ADC1)
#define POT_PH        35      // Potentiometer → pH (ADC1)
#define LED_GREEN     25
#define LED_YELLOW    26      // Blue LED on circuit = warning
#define LED_RED       27

// ── Config ────────────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "Wokwi-GUEST";   // Wokwi built-in WiFi
const char* WIFI_PASSWORD = "";

// ⚠️  Change SERVER_URL to your machine's local IP when running Wokwi
// e.g. "http://192.168.1.10:4000/api/sensors/ingest"
// localhost won't work from Wokwi — use your real LAN IP
const char* SERVER_URL    = "http://YOUR_LOCAL_IP:4000/api/sensors/ingest";
const char* API_KEY       = "zeraatech-iot-secret-key";

// Replace with the real MongoDB farm _id from your dashboard
const char* FARM_ID       = "YOUR_FARM_ID_HERE";
const char* DEVICE_ID     = "esp32-wokwi-farm1";

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

// ── LED helpers ───────────────────────────────────────────────────────────────
void setLed(bool green, bool yellow, bool red) {
  digitalWrite(LED_GREEN,  green  ? HIGH : LOW);
  digitalWrite(LED_YELLOW, yellow ? HIGH : LOW);
  digitalWrite(LED_RED,    red    ? HIGH : LOW);
}

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

// ── WiFi connection ───────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected. IP: %s\n", WiFi.localIP().toString().c_str());
    setLed(true, false, false);
  } else {
    Serial.println("\n[WiFi] FAILED — running offline");
    setLed(false, false, true);
  }
}

// ── Read sensors ─────────────────────────────────────────────────────────────
float readMoisture() {
  int raw = analogRead(POT_MOISTURE);          // 0–4095
  return map(raw, 0, 4095, 0, 100);           // 0–100 %
}

float readPh() {
  int raw = analogRead(POT_PH);               // 0–4095
  return 4.0 + (raw / 4095.0) * 5.0;         // 4.0–9.0
}

// ── POST to backend ──────────────────────────────────────────────────────────
bool postReading(float temp, float hum, float moisture, float ph) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[POST] WiFi not connected, skipping");
    return false;
  }

  StaticJsonDocument<256> doc;
  doc["farm"]        = FARM_ID;
  doc["deviceId"]    = DEVICE_ID;
  doc["temperature"] = temp;
  doc["humidity"]    = hum;
  doc["moisture"]    = moisture;
  doc["ph"]          = ph;
  doc["rainfall"]    = 0;        // no rain sensor in simulation
  doc["source"]      = "iot";

  char body[256];
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(8000);

  int code = http.POST(body);
  Serial.printf("[POST] %s → HTTP %d\n", SERVER_URL, code);

  if (code > 0) {
    Serial.printf("[POST] Response: %s\n", http.getString().c_str());
  } else {
    Serial.printf("[POST] Error: %s\n", http.errorToString(code).c_str());
  }

  http.end();
  return (code == 200 || code == 201);
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(LED_GREEN,  OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED,    OUTPUT);
  setLed(false, false, false);

  dht.setup(DHT_PIN, DHTesp::DHT22);
  Serial.println("[DHT] DHT22 initialised");

  connectWiFi();
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
    setLed(false, false, true);
    return;
  }

  float moisture = readMoisture();
  float ph       = readPh();

  Serial.printf("[Sensors] Temp=%.1f°C  Hum=%.1f%%  Moisture=%.1f%%  pH=%.2f\n",
                temp, hum, moisture, ph);

  // Outlier detection
  int histLen = historyFull ? 10 : historyIndex;
  bool tempOutlier = isOutlier(temp, tempHistory, histLen);
  bool humOutlier  = isOutlier(hum,  humHistory,  histLen);

  if (tempOutlier || humOutlier) {
    Serial.println("[Outlier] Anomaly detected — switching to burst mode (10s)");
    postInterval = BURST_INTERVAL;
    setLed(false, true, false);
  } else {
    postInterval = NORMAL_INTERVAL;
  }

  // Update rolling history
  tempHistory[historyIndex] = temp;
  humHistory[historyIndex]  = hum;
  historyIndex = (historyIndex + 1) % 10;
  if (historyIndex == 0) historyFull = true;

  // POST to backend
  bool ok = postReading(temp, hum, moisture, ph);

  if (ok) {
    setLed(true, false, false);   // green = success
  } else {
    setLed(false, false, true);   // red = failed
  }
}
