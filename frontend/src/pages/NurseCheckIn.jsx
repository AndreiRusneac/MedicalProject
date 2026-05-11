import { useState } from "react";
import { checkInPatient } from "../api";

const TRIAGE_LABELS = {
  1: "Nivel 1 — Imediat (Roșu)",
  2: "Nivel 2 — Urgent (Portocaliu)",
  3: "Nivel 3 — Semi-urgent (Galben)",
  4: "Nivel 4 — Mai puțin urgent (Verde)",
  5: "Nivel 5 — Neurgent (Albastru)",
};

export default function NurseCheckIn() {
  const [triageLevel, setTriageLevel] = useState(3);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const patient = await checkInPatient(triageLevel);
      setResult(patient);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "480px" }}>
      <h1>Înregistrare pacient</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="triage">Nivel de triaj:</label>
        <select
          id="triage"
          value={triageLevel}
          onChange={(e) => setTriageLevel(Number(e.target.value))}
          style={{ display: "block", margin: "0.5rem 0 1rem", width: "100%", padding: "0.4rem" }}
        >
          {Object.entries(TRIAGE_LABELS).map(([level, label]) => (
            <option key={level} value={level}>{label}</option>
          ))}
        </select>
        <button type="submit" disabled={loading}>
          {loading ? "Se înregistrează..." : "Înregistrează pacientul"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "6px" }}>
          <p><strong>Pacient înregistrat.</strong></p>
          <p>Poziție în coadă: <strong>{result.queue_position}</strong></p>
          <p>Timp estimat de așteptare: <strong>~{result.estimated_wait_minutes} min</strong></p>
          <p style={{ fontSize: "0.8rem", color: "#888", wordBreak: "break-all" }}>
            ID: {result.id}
          </p>
        </div>
      )}
    </div>
  );
}
