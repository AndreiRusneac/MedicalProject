import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPatientStatus } from "../api";

const STATUS_LABELS = {
  waiting: "În așteptare",
  in_treatment: "În tratament",
  discharged: "Externat",
};

export default function PatientStatus() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState(null);

  async function refresh() {
    try {
      const data = await getPatientStatus(id);
      setPatient(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [id]);

  if (error) return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;
  if (!patient) return <div style={{ padding: "2rem" }}>Se încarcă...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "400px" }}>
      <h1>Statusul tău</h1>
      <p><strong>Status:</strong> {STATUS_LABELS[patient.status] ?? patient.status}</p>
      {patient.status === "waiting" && (
        <>
          <p><strong>Poziție în coadă:</strong> {patient.queue_position}</p>
          <p><strong>Timp estimat de așteptare:</strong> ~{patient.estimated_wait_minutes} min</p>
        </>
      )}
      <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "2rem" }}>
        Actualizare automată la 30s.
      </p>
    </div>
  );
}