import mongoose from "mongoose";
import dotenv from "dotenv";
import SensorReading from "./models/SensorReading.js";
import Farm from "./models/Farm.js";

dotenv.config();

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Fetch the first available farm
    const farm = await Farm.findOne();
    if (!farm) {
      console.log("No farm found. Create a farm first.");
      process.exit(1);
    }

    console.log(`Generating data for Farm: ${farm.name} (${farm._id})`);

    // Clean up old sensor data for this farm to ensure a clean chart
    await SensorReading.deleteMany({ farm: farm._id });
    console.log("Cleared old sensor readings");

    const readings = [];
    const now = new Date();
    // 24 hours of data, 1 reading every 10 minutes = 144 readings
    const totalPoints = 144;
    
    // Starting values
    let currentMoisture = 60; // Starts at 60%
    
    for (let i = 0; i < totalPoints; i++) {
      // Calculate timestamp from oldest to newest
      const minutesAgo = (totalPoints - 1 - i) * 10;
      const recordedAt = new Date(now.getTime() - minutesAgo * 60000);
      
      // Simulate diurnal temperature cycle using a sine wave
      // Assume a 24 hour cycle. 
      // Offset by some phase so it's hottest in the afternoon
      const phase = (i / totalPoints) * Math.PI * 2;
      const baseTemp = 25; // average temp
      const tempVariation = 8; // +/- 8 degrees
      // Adding a small random noise
      const temperature = baseTemp + Math.sin(phase - Math.PI/2) * tempVariation + (Math.random() * 1.5 - 0.75);
      
      // Humidity is inversely correlated to temperature
      const baseHum = 50;
      const humVariation = 15;
      const humidity = baseHum - Math.sin(phase - Math.PI/2) * humVariation + (Math.random() * 4 - 2);
      
      // Moisture gradually decreases, then a sharp spike (irrigation event)
      currentMoisture -= (Math.random() * 0.5 + 0.1); // Evaporation
      if (i === 100) { // Irrigate somewhere in the middle
        currentMoisture = 85;
      }
      
      readings.push({
        farm: farm._id,
        deviceId: "esp32-demo-generator",
        temperature: parseFloat(temperature.toFixed(1)),
        humidity: parseFloat(humidity.toFixed(1)),
        moisture: parseFloat(currentMoisture.toFixed(1)),
        ph: 6.5,
        rainfall: 0,
        source: "seed",
        recordedAt: recordedAt,
      });
    }

    await SensorReading.insertMany(readings);
    console.log(`Successfully inserted ${readings.length} fake sensor readings!`);
    
    process.exit(0);
  } catch (err) {
    console.error("Error seeding data:", err);
    process.exit(1);
  }
}

seedData();
