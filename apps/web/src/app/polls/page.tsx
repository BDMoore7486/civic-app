"use client";

import { useState, useEffect } from "react";

export default function PollsPage() {
  const [choice, setChoice] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ Yes: number; No: number; Unsure: number }>({
    Yes: 0,
    No: 0,
    Unsure: 0,
  });

  const question = "Do you support the new parks initiative?";

  // Load current poll results
  useEffect(() => {
    fetch("/api/polls")
      .then((res) => res.json())
      .then((data) => setCounts(data.counts));
  }, []);

  // When user selects a choice
  async function handleVote(opt: string) {
    setChoice(opt);
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice: opt }),
    });
    const data = await res.json();
    setCounts(data.counts);
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: 16,
        border: "1px solid #eee",
        borderRadius: 10,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>{question}</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {["Yes", "No", "Unsure"].map((opt) => (
          <button
            key={opt}
            onClick={() => handleVote(opt)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: choice === opt ? "#e3f2fd" : "#fff",
              color: choice === opt ? "#0366d6" : "#111",
              cursor: "pointer",
            }}
          >
            {opt} ({counts[opt as keyof typeof counts]})
          </button>
        ))}
      </div>

      {choice && (
        <p style={{ marginTop: 12 }}>
          You chose: <strong>{choice}</strong>
        </p>
      )}
    </div>
  );
}
