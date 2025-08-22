"use client";

import { useState } from "react";

const question =
  "Should Congress pass a bill requiring full donor transparency for all federal campaigns?";

export default function PollsPage() {
  const [choice, setChoice] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Hot Topic Polls</h1>
      <p style={{ color: "#555", marginBottom: 16 }}>
        Vote on timely civic questions. (MVP demo—local only, no account needed.)
      </p>

      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>{question}</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Yes", "No", "Unsure"].map((opt) => (
            <button
              key={opt}
              onClick={() => setChoice(opt)}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #ccc",
                background: choice === opt ? "#0366d6" : "#fff",
                color: choice === opt ? "#fff" : "#111",
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
      </div>

      <p style={{ fontSize: 12, color: "#777" }}>
        Next: we’ll hook this up to an API route and a database so results persist.
      </p>
    </div>
  );
}
