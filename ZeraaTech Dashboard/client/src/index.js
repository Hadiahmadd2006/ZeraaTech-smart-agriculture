import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./App.css";
import { applyThemeFromStorage } from "./theme";

applyThemeFromStorage();

createRoot(document.getElementById("root")).render(<App />);
