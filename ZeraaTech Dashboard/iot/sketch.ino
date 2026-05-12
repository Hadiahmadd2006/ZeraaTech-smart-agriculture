#include <DHT.h>

// --- DHT22 Setup ---
// The ESP32 pin connected to the DHT22 DATA (Middle) pin
#define DHTPIN 4

// We are using the DHT22 (not the blue DHT11)
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// --- Soil Moisture Setup ---
// The ESP32 pin connected to the A0 pin on the moisture sensor
#define SOIL_MOISTURE_PIN 34

void setup() {
  // Start the serial monitor so we can see the data
  Serial.begin(115200);
  Serial.println("Starting ZeraaTech Sensor Node...");

  // Wake up the DHT sensor
  dht.begin();

  // Turn on the ESP32's internal pull-up resistor for the DHT22
  // This is required since you are using a bare 4-pin sensor without a physical
  // resistor
  pinMode(DHTPIN, INPUT_PULLUP);
}

void loop() {
  // 1. Read the Temperature and Humidity
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature(); // Reads Celsius by default

  // Check if the DHT22 failed to read (usually means a loose wire)
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor! Check your wiring.");
  } else {
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.print(" °C  |  Humidity: ");
    Serial.print(humidity);
    Serial.print(" %  |  ");
  }

  // 2. Read the Soil Moisture (Raw Analog Value)
  // This reads the voltage from the sensor and gives a number between 0 and
  // 4095
  int soilRaw = analogRead(SOIL_MOISTURE_PIN);
  Serial.print("Soil Moisture (Raw): ");
  Serial.println(soilRaw);

  // The DHT22 is a slow sensor. It NEEDS at least 2 seconds between readings.
  delay(2000);
}