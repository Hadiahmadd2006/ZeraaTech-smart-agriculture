#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>

// --- Network Setup ---
const char *WIFI_SSID = "YOUR_WIFI_NAME_HERE";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD_HERE";

// Replace this with your ngrok URL or your laptop's local IP address
// Example: "http://192.168.1.50:4000/api/sensors/ingest"
const char *SERVER_URL = "http://REPLACE_ME/api/sensors/ingest";
const char *API_KEY = "zeraatech-iot-secret-key";

// --- Sensor Setup ---
// The ESP32 pin connected to the DHT22 DATA (Middle) pin
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// The ESP32 pin connected to the A0 pin on the moisture sensor
#define SOIL_MOISTURE_PIN 34

// --- System Config ---
const char *FARM_ID = "69d01a19cdfb068a97883344"; // South Farm
const char *DEVICE_ID = "esp32-real-hardware";

unsigned long lastPostTime = 0;
// Send data every 60 seconds (60000 ms)
const unsigned long postInterval = 60000;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\nStarting ZeraaTech Sensor Node...");

  dht.begin();
  // Turn on the ESP32's internal pull-up resistor for the DHT22
  pinMode(DHTPIN, INPUT_PULLUP);

  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Use millis() to non-blockingly check if it's time to send data
  if (millis() - lastPostTime >= postInterval || lastPostTime == 0) {
    lastPostTime = millis();

    // 1. Read Sensors
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();
    int soilRaw = analogRead(SOIL_MOISTURE_PIN);

    // Validate DHT reading
    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("Failed to read from DHT sensor! Check your wiring.");
      return; // Skip the rest of this loop and try again later
    }

    Serial.printf("Sensors -> Temp: %.1f°C | Hum: %.1f%% | Soil Raw: %d\n",
                  temperature, humidity, soilRaw);

    // Convert raw soil moisture to percentage (0-100%)
    // NOTE: You may need to calibrate these 'dry' and 'wet' values
    int dryValue = 3500;
    int wetValue = 1500;
    float moisturePercent = map(soilRaw, dryValue, wetValue, 0, 100);
    if (moisturePercent < 0)
      moisturePercent = 0;
    if (moisturePercent > 100)
      moisturePercent = 100;

    // 2. Transmit to Backend
    if (WiFi.status() == WL_CONNECTED) {
      StaticJsonDocument<256> doc;
      doc["farm"] = FARM_ID;
      doc["deviceId"] = DEVICE_ID;
      doc["temperature"] = temperature;
      doc["humidity"] = humidity;
      doc["moisture"] = moisturePercent;
      doc["ph"] = 6.5; // Default pH
      doc["rainfall"] = 0;
      doc["source"] = "iot";

      char body[256];
      serializeJson(doc, body);

      Serial.print("Transmitting: ");
      Serial.println(body);

      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("x-api-key", API_KEY);
      // Optional: Helpful if using Ngrok to bypass their warning screen
      http.addHeader("bypass-tunnel-reminder", "true");

      int httpResponseCode = http.POST(body);

      if (httpResponseCode > 0) {
        Serial.printf("HTTP Response code: %d\n", httpResponseCode);
        String response = http.getString();
        Serial.println(response);
      } else {
        Serial.printf("Error code: %d\n", httpResponseCode);
      }

      http.end();
    } else {
      Serial.println("WiFi Disconnected. Reconnecting...");
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
  }

  // A short delay to prevent the loop from running uncontrollably fast
  delay(100);
}