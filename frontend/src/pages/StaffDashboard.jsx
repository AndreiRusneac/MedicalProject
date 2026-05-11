import { useEffect, useState } from "react";
import { dischargePatient, getStaffDashboard, startTreatment } from "../api";

const STATUS_LABELS = {
  waiting: "Așteptare",
  in_treatment: "În tratament",
  discharged: "Externat",
};

const TRIAGE_COLORS = {
  1: "#c0392b",
  2: "#e67e22",
  3: "#f1c40f",
  4: "#27ae60",
  5: "#2980b9",
};

export default function StaffDashboard() {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function refresh() {
    try {
      const data = await getStaffDashboard();
      setPatients(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, []);

  async function handleAction(fn) {
    setActionError(null);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard personal medical</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {actionError && <p style={{ color: "red" }}>{actionError}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #ccc" }}>
            <th style={{ padding: "0.5rem" }}>Triaj</th>
            <th style={{ padding: "0.5rem" }}>Status</th>
            <th style={{ padding: "0.5rem" }}>Sosire</th>
            <th style={{ padding: "0.5rem" }}>Așteptare est.</th>
            <th style={{ padding: "0.5rem" }}>Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.5rem" }}>
                <span style={{
                  backgroundColor: TRIAGE_COLORS[p.triage_level],
                  color: p.triage_level === 3 ? "#333" : "#fff",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontWeight: "bold",
                }}>
                  N{p.triage_level}
                </span>
              </td>
              <td style={{ padding: "0.5rem" }}>{STATUS_LABELS[p.status] ?? p.status}</td>
              <td style={{ padding: "0.5rem" }}>
                {new Date(p.arrival_time + "Z").toLocaleTimeString("ro-RO")}
              </td>
              <td style={{ padding: "0.5rem" }}>~{p.estimated_wait_minutes} min</td>
              <td style={{ padding: "0.5rem" }}>
                {p.status === "waiting" && (
                  <button onClick={() => handleAction(() => startTreatment(p.id))}>
                    Cheamă
                  </button>
                )}
                {p.status === "in_treatment" && (
                  <button onClick={() => handleAction(() => dischargePatient(p.id))}>
                    Externează
                  </button>
                )}
              </td>
            </tr>
          ))}
          {patients.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "1rem", textAlign: "center", color: "#888" }}>
                Nu există pacienți activi.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}