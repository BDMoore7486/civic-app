// apps/web/src/app/polls/page.tsx
"use client";

import { useEffect, useState } from "react";

type Counts = { Yes: number; No: number; Unsure: number };

export default function PollsPage() {
  const [choice, setChoice] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const question = "Do you support the new parks initiative?";

  function total(c: Counts | null) {
    if (!c) return 0;
    return (c.Yes ?? 0) + (c.No ?? 0) + (c.Unsure ?? 0);
  }

  function pct(n: number, t: number) {
    if (!t) return 0;
    return Math.round((n / t) * 100);
  }

  async function loadCounts() {
    try {
      setError(null);
      const res = await fetch("/api/polls", { cache: "no-store" });
      if (!res.ok) throw new Error(`GET /api/polls failed (${res.status})`);
      const data: Counts = await res.json();
      setCounts(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load counts");
    }
  }

  useEffect(() => {
    // Soft client hint so buttons start disabled if we’ve already voted
    setHasVoted(document.cookie.includes("parks_voted="));
    loadCounts();
  }, []);

  async function vote(opt: string) {
    if (hasVoted) {
      setError("You’ve already voted on this poll.");
      return;
    }

    setLoading(true);
    setChoice(opt);
    try {
      setError(null);
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice: opt }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Server says you already voted — reflect that in the UI
        setHasVoted(true);
        setError("You’ve already voted on this poll.");
        setCounts({
          Yes: data.Yes ?? 0,
          No: data.No ?? 0,
          Unsure: data.Unsure ?? 0,
        });
        return;
      }

      if (!res.ok) throw new Error(`POST /api/polls failed (${res.status})`);
      setCounts(data as Counts);
      setHasVoted(true); // we’ll also get the server cookie
    } catch (e: any) {
      setError(e?.message || "Failed to submit vote");
    } finally {
      setLoading(false);
    }
  }

  const t = total(counts);

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
            onClick={() => vote(opt)}
            disabled={loading || hasVoted}
            title={hasVoted ? "You already voted" : ""}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: choice === opt ? "#e3f2fd" : "#fff",
              color: choice === opt ? "#0366d6" : "#111",
              cursor: loading || hasVoted ? "not-allowed" : "pointer",
              opacity: loading || hasVoted ? 0.7 : 1,
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {choice && (
        <p style={{ marginTop: 8 }}>
          You chose: <strong>{choice}</strong>
        </p>
      )}

      {error && (
        <p style={{ color: "crimson", marginTop: 8 }}>
          {error}
        </p>
      )}

      <div style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6 }}>
        <strong>Current totals</strong>
        <div>
          Yes: {counts?.Yes ?? 0} {t ? `(${pct(counts?.Yes ?? 0, t)}%)` : ""}
        </div>
        <div>
          No: {counts?.No ?? 0} {t ? `(${pct(counts?.No ?? 0, t)}%)` : ""}
        </div>
        <div>
          Unsure: {counts?.Unsure ?? 0} {t ? `(${pct(counts?.Unsure ?? 0, t)}%)` : ""}
        </div>
        <div style={{ color: "#666", marginTop: 6 }}>
          Total votes: {t}
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#777", marginTop: 16 }}>
        (This page fetches <code>/api/polls</code> for counts and posts votes to the same path.)
      </p>
    </div>
  );
}
