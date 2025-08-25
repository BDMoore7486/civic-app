// apps/web/src/app/api/polls/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redis } from "../../../lib/redis";

const POLL_KEY = "poll:parks";
const VALID = new Set(["Yes", "No", "Unsure"]);
const VOTE_COOKIE = "parks_voted";

// Normalize Redis values -> numbers
function normalizeCounts(c: any) {
  const base = { Yes: 0, No: 0, Unsure: 0 };
  if (!c) return base;
  return {
    Yes: Number(c.Yes ?? 0),
    No: Number(c.No ?? 0),
    Unsure: Number(c.Unsure ?? 0),
  };
}

export async function GET() {
  const counts = normalizeCounts(await redis.hgetall(POLL_KEY));
  return NextResponse.json(counts);
}

export async function POST(req: Request) {
  const { choice } = await req.json();

  if (!VALID.has(choice)) {
    return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
  }

  const store = cookies();
  const already = store.get(VOTE_COOKIE);

  // If this browser already has the vote cookie, don't increment again
  if (already) {
    const counts = normalizeCounts(await redis.hgetall(POLL_KEY));
    return NextResponse.json({ ...counts, alreadyVoted: true }, { status: 409 });
  }

  await redis.hincrby(POLL_KEY, choice, 1);

  const counts = normalizeCounts(await redis.hgetall(POLL_KEY));
  const res = NextResponse.json(counts);

  // Set a long-lived cookie so this browser can't vote again
  res.cookies.set(VOTE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return res;
}
