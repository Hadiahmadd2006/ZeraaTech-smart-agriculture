export const fallbackGauges = [
  { id: "health", label: "Health", value: 82 },
  { id: "water", label: "Water", value: 45 },
  { id: "soil", label: "Soil", value: 67 },
];

export const fallbackRecs = [
  { id: 1, plant: "Tomato", img: "/img/tomato.jpg", status: "water", hint: "10m" },
  { id: 2, plant: "Potato", img: "/img/potato.jpg", status: "spray", hint: "today" },
  { id: 3, plant: "Pepper", img: "/img/pepper.jpg", status: "good", hint: "" },
  { id: 4, plant: "Wheat", img: "/img/wheat.jpg", status: "shade", hint: "noon" },
];

export const fallbackCrops = [
  {
    id: "tomato-field",
    name: "Tomato Greenhouse",
    location: "North field",
    crop: "Tomato",
    areaHectares: 1.2,
    moisture: 48,
    status: "Needs watering soon",
    pumpStatus: "Off",
  },
  {
    id: "potato-plot",
    name: "Potato Plot",
    location: "East field",
    crop: "Potato",
    areaHectares: 2.5,
    moisture: 63,
    status: "Healthy",
    pumpStatus: "Auto",
  },
  {
    id: "pepper-house",
    name: "Pepper Tunnel",
    location: "South greenhouse",
    crop: "Pepper",
    areaHectares: 0.8,
    moisture: 55,
    status: "Monitor temperature",
    pumpStatus: "Off",
  },
  {
    id: "wheat-block",
    name: "Wheat Block",
    location: "West field",
    crop: "Wheat",
    areaHectares: 5.0,
    moisture: 40,
    status: "Drying slightly",
    pumpStatus: "Irrigated yesterday",
  },
];
