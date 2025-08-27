import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redis } from "../../../lib/redis";

const POLL_KEY = "poll:parks";
const VOTERS_KEY = "poll:parks:voters";

type Counts = { Yes: number; No: number; Unsure: number };
type RawCounts = Record<string, string> | null;

function normalize(raw: RawCounts): Counts {
  return {
    Yes: Number(raw?.Yes ?? 0),
    No: Number(raw?.No ?? 0),
    Unsure: Number(raw?.Unsure ?? 0),
  };
}

export async function GET() {
  const raw = await redis.hgetall<RawCounts>(POLL_KEY);
  return NextResponse.json(normalize(raw));
}

export async function POST(req: Request) {
  const body = (await req.json()) as { choice: keyof Counts };
  const choice = body?.choice;

  if (!["Yes", "No", "Unsure"].includes(String(choice))) {
    return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
  }

  // 1) Identify voter by cookie
  const jar = cookies();
  let voterId = jar.get("voter_id")?.value;
  let setCookie = false;
  if (!voterId) {
    voterId = crypto.randomUUID();
    setCookie = true;
  }

  // 2) Allow exactly one vote per voterId
  // SADD returns 1 if added (first vote), 0 if already present (duplicate)
  const added = await redis.sadd(VOTERS_KEY, voterId);
  if (added === 0) {
    const raw = await redis.hgetall<RawCounts>(POLL_KEY);
    return NextResponse.json(
      { error: "Already voted", counts: normalize(raw) },
      { status: 409 }
    );
  }

  // 3) Count the vote
  await redis.hincrby(POLL_KEY, choice, 1);

  const raw = await redis.hgetall<RawCounts>(POLL_KEY);
  const res = NextResponse.json(normalize(raw));

  // 4) Set voter cookie so the next request is recognized
  if (setCookie) {
    res.cookies.set({
      name: "voter_id",
      value: voterId,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }

  return res;
}
