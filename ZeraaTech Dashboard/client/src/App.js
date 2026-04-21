import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Farms from "./pages/Farms";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import CropInsights from "./pages/CropInsights";
import DiseaseDetect from "./pages/DiseaseDetect";
import InviteResponse from "./pages/InviteResponse";
import Landing from "./pages/Landing";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/farms" element={<Farms />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/crop/:cropName" element={<CropInsights />} />
        <Route path="/disease-detect" element={<DiseaseDetect />} />
        <Route path="/invite/:token" element={<InviteResponse />} />
      </Routes>
    </Router>
  );
}

export default App;
