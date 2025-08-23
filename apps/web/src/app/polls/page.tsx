"use client";

import { useEffect, useState } from "react";

type Counts = { Yes: number; No: number; Unsure: number };

const QUESTION = "Do you support the new parks initiative?";
const CHOICES = ["Yes", "No", "Unsure"] as const;

export default function PollsPage() {
  const [choice, setChoice] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts>({ Yes: 0, No: 0, Unsure: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const total = counts.Yes + counts.No + counts.Unsure;

  // Load current results on first render
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/polls", { cache: "no-store" });
        const data = await res.json();
        setCounts({
          Yes: Number(data.counts?.Yes ?? 0),
          No: Number(data.counts?.No ?? 0),
          Unsure: Number(data.counts?.Unsure ?? 0),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Submit a vote
  const vote = async (opt: (typeof CHOICES)[number]) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice: opt }),
      });
      const data = await res.json();
      setCounts({
        Yes: Number(data.counts?.Yes ?? 0),
        No: Number(data.counts?.No ?? 0),
        Unsure: Number(data.counts?.Unsure ?? 0),
      });
      setChoice(opt);
    } catch (err) {
      console.error(err);
      alert("Sorry, something went wrong submitting your vote.");
    } finally {
      setSubmitting(false);
    }
  };

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
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>{QUESTION}</h2>

      {/* Choice buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {CHOICES.map((opt) => (
          <button
            key={opt}
            onClick={() => vote(opt)}
            disabled={submitting}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: choice === opt ? "#e3f2fd" : "#fff",
              color: choice === opt ? "#0366d6" : "#111",
              cursor: "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Selected message */}
      {choice && (
        <p style={{ marginTop: 12 }}>
          You chose: <strong>{choice}</strong>
        </p>
      )}

      {/* Results */}
      <div style={{ marginTop: 16 }}>
        <h3 style={{ margin: "16px 0 8px" }}>Results</h3>
        {loading ? (
          <p style={{ color: "#777", fontSize: 13 }}>Loading results…</p>
        ) : total === 0 ? (
          <p style={{ color: "#777", fontSize: 13 }}>No votes yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {CHOICES.map((opt) => {
              const count = counts[opt];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={opt}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    <span>{opt}</span>
                    <span>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 10,
                      background: "#f2f2f2",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "#0366d6",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: 12, color: "#777" }}>Total votes: {total}</div>
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#777", marginTop: 16 }}>
        Votes persist using Upstash Redis via a Next.js API Route.
      </p>
    </div>
  );
}
