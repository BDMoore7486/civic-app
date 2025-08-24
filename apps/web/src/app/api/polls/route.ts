// apps/web/src/app/api/polls/route.ts
import { NextResponse } from "next/server";
import { redis } from "../../lib/redis";

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
  return NextResponse.json(
    { counts: normalize(data) },
    { headers: { "Cache-Control": "no-store" } }
  );
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
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
