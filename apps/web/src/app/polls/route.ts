import { NextResponse } from "next/server";
import { redis } from "@/src/lib/redis"; // path from /src/app/polls to /src/lib/redis.ts

const POLL_KEY = "poll:parks";
const VALID = new Set(["Yes", "No", "Unsure"]);

function normalize(raw?: Record<string, string>) {
  return {
    Yes: Number(raw?.Yes ?? 0),
    No: Number(raw?.No ?? 0),
    Unsure: Number(raw?.Unsure ?? 0),
  };
}

// GET /polls  -> returns counts
export async function GET() {
  const data = await redis.hgetall<Record<string, string>>(POLL_KEY);
  return NextResponse.json({ counts: normalize(data) }, { headers: { "Cache-Control": "no-store" } });
}

// POST /polls { choice: "Yes" | "No" | "Unsure" } -> increments one
export async function POST(req: Request) {
  try {
    const { choice } = await req.json();
    if (!VALID.has(choice)) {
      return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
    }
    await redis.hincrby(POLL_KEY, choice, 1);
    const data = await redis.hgetall<Record<string, string>>(POLL_KEY);
    return NextResponse.json({ counts: normalize(data) });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

