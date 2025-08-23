import { NextResponse } from "next/server";
// NOTE: your redis.ts is under app/src/lib/redis.ts, so we go up twice from /api/polls/
import { redis } from "../../src/lib/redis";

const POLL_KEY = "poll:parks";
const VALID = new Set(["Yes", "No", "Unsure"]);

function normalize(raw: Record<string, string> | null) {
  return {
    Yes: Number(raw?.Yes ?? 0),
    No: Number(raw?.No ?? 0),
    Unsure: Number(raw?.Unsure ?? 0),
  };
}

export async function GET() {
  const data = await redis.hgetall<Record<string, string>>(POLL_KEY);
  return NextResponse.json({ counts: normalize(data) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const { choice } = await req.json();
    if (!VALID.has(choice)) {
      return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
    }

    // increment the field in a hash, e.g. HINCRBY poll:parks "Yes" 1
    await redis.hincrby(POLL_KEY, choice, 1);

    const data = await redis.hgetall<Record<string, string>>(POLL_KEY);
    return NextResponse.json({ counts: normalize(data) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

