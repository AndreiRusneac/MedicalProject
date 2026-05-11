const API_BASE = "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.detail || "Eroare necunoscută.");
  }
  return body;
}

export function checkInPatient(triageLevel) {
  return request("/api/patients/check-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ triage_level: triageLevel }),
  });
}

export function startTreatment(patientId) {
  return request(`/api/patients/${patientId}/start-treatment`, { method: "POST" });
}

export function dischargePatient(patientId) {
  return request(`/api/patients/${patientId}/discharge`, { method: "POST" });
}

export function getQueuePublic() {
  return request("/api/queue/public");
}

export function getPatientStatus(patientId) {
  return request(`/api/patients/${patientId}/status`);
}

export function getStaffDashboard() {
  return request("/api/dashboard/staff");
}