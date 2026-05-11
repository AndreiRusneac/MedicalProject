import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import NurseCheckIn from "./pages/NurseCheckIn";
import PatientStatus from "./pages/PatientStatus";
import PublicDisplay from "./pages/PublicDisplay";
import StaffDashboard from "./pages/StaffDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc", display: "flex", gap: "1.5rem" }}>
        <Link to="/">Înregistrare</Link>
        <Link to="/public">Ecran public</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <Routes>
        <Route path="/" element={<NurseCheckIn />} />
        <Route path="/public" element={<PublicDisplay />} />
        <Route path="/dashboard" element={<StaffDashboard />} />
        <Route path="/patient/:id" element={<PatientStatus />} />
      </Routes>
    </BrowserRouter>
  );
}