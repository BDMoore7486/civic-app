// apps/web/src/app/api/polls/route.ts
import { NextResponse } from "next/server";
import { redis } from "../../lib/redis";

const POLL_KEY = "poll:parks";
const VALID = new Set(["Yes", "No", "Unsure"]);

export async function GET() {
  const counts = await redis.hgetall(POLL_KEY);
  return NextResponse.json(counts || { Yes: 0, No: 0, Unsure: 0 });
}

export async function POST(req: Request) {
  const { choice } = await req.json();

  if (!VALID.has(choice)) {
    return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
  }

  await redis.hincrby(POLL_KEY, choice, 1);

  const counts = await redis.hgetall(POLL_KEY);
  return NextResponse.json(counts);
}
