// apps/web/src/app/api/polls/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redis } from "../../../lib/redis";

const POLL_KEY = "poll:parks";
const COOKIE_NAME = "voted_parks"; // marks that this browser already voted

type Counts = { Yes: number; No: number; Unsure: number };
type RawMap = Record<string, string>;

/** Convert Upstash hash map into the shape the UI expects. */
function normalize(raw: RawMap | null): Counts {
  return {
    Yes: Number(raw?.Yes ?? 0),
    No: Number(raw?.No ?? 0),
    Unsure: Number(raw?.Unsure ?? 0),
  };
}

export async function GET() {
  // NOTE: the generic must be a non-null Record
  const raw = await redis.hgetall<RawMap>(POLL_KEY);
  return NextResponse.json(normalize(raw ?? null));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { choice?: string };
    const choice = body.choice;

    if (!choice || !["Yes", "No", "Unsure"].includes(choice)) {
      return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
    }

    const jar = await cookies();
    const already = jar.get(COOKIE_NAME)?.value === "1";

    // always send back current counts
    const current = normalize((await redis.hgetall<RawMap>(POLL_KEY)) ?? null);

    if (already) {
      // Client can show “You already voted.”
      return NextResponse.json({ counts: current }, { status: 409 });
    }

    // First vote from this browser: increment and set cookie
    await redis.hincrby(POLL_KEY, choice, 1);

    jar.set(COOKIE_NAME, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    const after = normalize((await redis.hgetall<RawMap>(POLL_KEY)) ?? null);
    return NextResponse.json(after);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
