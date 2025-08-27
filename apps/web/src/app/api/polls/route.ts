// src/app/api/polls/route.ts
import { NextResponse } from "next/server";
import { redis } from "../../../lib/redis";

type Counts = { Yes: number; No: number; Unsure: number };

const POLL_KEY = "poll:parks";
const VALID = new Set<keyof Counts>(["Yes", "No", "Unsure"]);

function normalizeCounts(c: Record<string, string> | null): Counts {
  const base: Counts = { Yes: 0, No: 0, Unsure: 0 };
  if (!c) return base;
  return {
    Yes: Number(c.Yes ?? 0),
    No: Number(c.No ?? 0),
    Unsure: Number(c.Unsure ?? 0),
  };
}

export async function GET() {
  try {
    // ❌ do NOT use hgetall<T>() here
    // ✅ call without generic and cast the result
    const raw = (await redis.hgetall(POLL_KEY)) as Record<string, string> | null;
    const counts = normalizeCounts(raw);
    return NextResponse.json(counts);
  } catch {
    return NextResponse.json({ error: "Failed to load counts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { choice?: string };
    const choice = body?.choice as keyof Counts | undefined;

    if (!choice || !VALID.has(choice)) {
      return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
    }

    await redis.hincrby(POLL_KEY, choice, 1);

    // Same fix here
    const raw = (await redis.hgetall(POLL_KEY)) as Record<string, string> | null;
    const counts = normalizeCounts(raw);
    return NextResponse.json(counts);
  } catch {
    return NextResponse.json({ error: "Failed to submit vote" }, { status: 500 });
  }
}
