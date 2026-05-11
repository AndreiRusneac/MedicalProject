import { useEffect, useState } from "react";
import { getQueuePublic } from "../api";

const TRIAGE_COLORS = {
  1: "#c0392b",
  2: "#e67e22",
  3: "#f1c40f",
  4: "#27ae60",
  5: "#2980b9",
};

const TRIAGE_LABELS = {
  1: "Imediat",
  2: "Urgent",
  3: "Semi-urgent",
  4: "Mai puțin urgent",
  5: "Neurgent",
};

export default function PublicDisplay() {
  const [queue, setQueue] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  async function refresh() {
    try {
      const data = await getQueuePublic();
      setQueue(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  // Poll every 30 seconds — no WebSockets needed at this scale.
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Timp de așteptare estimat</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem" }}>
        {queue.map((entry) => (
          <div
            key={entry.triage_level}
            style={{
              backgroundColor: TRIAGE_COLORS[entry.triage_level],
              color: entry.triage_level === 3 ? "#333" : "#fff",
              padding: "1.5rem 1rem",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: "bold" }}>Nivel {entry.triage_level}</div>
            <div style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              {TRIAGE_LABELS[entry.triage_level]}
            </div>
            <div style={{ fontSize: "2.5rem", fontWeight: "bold", lineHeight: 1 }}>
              {entry.waiting_count}
            </div>
            <div style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>pacienți</div>
            <div style={{ fontWeight: "bold" }}>~{entry.avg_wait_minutes} min</div>
          </div>
        ))}
      </div>
      {lastUpdated && (
        <p style={{ color: "#888", marginTop: "1rem", fontSize: "0.8rem" }}>
          Actualizat la {lastUpdated.toLocaleTimeString("ro-RO")} · reîmprospătare automată la 30s
        </p>
      )}
    </div>
  );
}