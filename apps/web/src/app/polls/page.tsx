"use client";

import { useEffect, useState } from "react";

type Counts = { Yes: number; No: number; Unsure: number };

export default function PollsPage() {
  const [choice, setChoice] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(false);
  const question = "Do you support the new parks initiative?";

  async function loadCounts() {
    const res = await fetch("/api/polls", { cache: "no-store" });
    const data = await res.json();
    setCounts(data);
  }

  useEffect(() => {
    loadCounts();
  }, []);

  async function vote(opt: string) {
    setLoading(true);
    setChoice(opt);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice: opt }),
      });
      const data = await res.json();
      setCounts(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, border: "1px solid #eee", borderRadius: 10 }}>
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>{question}</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {["Yes", "No", "Unsure"].map((opt) => (
          <button
            key={opt}
            onClick={() => vote(opt)}
            disabled={loading}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: choice === opt ? "#e3f2fd" : "#fff",
              color: choice === opt ? "#0366d6" : "#111",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {choice && (
        <p style={{ marginTop: 12 }}>
          You chose: <strong>{choice}</strong>
        </p>
      )}

      <div style={{ marginTop: 16, fontSize: 14 }}>
        <strong>Current totals</strong>
        <div>Yes: {counts?.Yes ?? 0}</div>
        <div>No: {counts?.No ?? 0}</div>
        <div>Unsure: {counts?.Unsure ?? 0}</div>
      </div>

      <p style={{ fontSize: 12, color: "#777", marginTop: 16 }}>
        (This page fetches `/api/polls` for counts and posts votes to the same path.)
      </p>
    </div>
  );
}
