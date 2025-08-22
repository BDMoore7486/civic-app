"use client";

import { useState } from "react";

export default function PollsPage() {
  const [choice, setChoice] = useState<string | null>(null);
  const question = "Do you support the new parks initiative?";

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
            onClick={() => setChoice(opt)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: choice === opt ? "#e3f2fd" : "#fff",
              color: choice === opt ? "#0366d6" : "#111",
              cursor: "pointer",
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

      <p style={{ fontSize: 12, color: "#777", marginTop: 16 }}>
        Next: we’ll hook this up to an API route and a database so results persist.
      </p>
    </div>
  );
}
