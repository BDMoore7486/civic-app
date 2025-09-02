// apps/web/src/app/api/polls/route.ts
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
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

/** Hash a caller’s best-effort identity (IP + UA) without storing raw IP. */
function ipFingerprint(req: NextRequest): string {
  // Prefer standard proxy headers if present (Vercel/edge/CDN aware)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";

  const ua = req.headers.get("user-agent") || "unknown";
  const raw = `${ip}::${ua}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function GET() {
  const raw = await redis.hgetall<RawMap>(POLL_KEY);
  return NextResponse.json(normalize(raw ?? null));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { choice?: string };
    const choice = body.choice;

    if (!choice || !["Yes", "No", "Unsure"].includes(choice)) {
      return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
    }

    // --- soft IP-based lock (24h) + cookie check ---
    const ipHash = ipFingerprint(req);
    const ipLockKey = `poll:parks:ip:${ipHash}`;

    // Try to set a one-day lock if it doesn’t exist yet (NX)
    // If it returns null, the key already existed => repeat voter
    const setRes = await redis.set(ipLockKey, "1", { nx: true, ex: 60 * 60 * 24 });

    const jar = await cookies();
    const alreadyViaCookie = jar.get(COOKIE_NAME)?.value === "1";

    // Always send back current counts
    const current = normalize((await redis.hgetall<RawMap>(POLL_KEY)) ?? null);

    if (alreadyViaCookie || setRes === null) {
      // “You already voted” — either cookie present or IP lock already existed
      return NextResponse.json({ counts: current }, { status: 409 });
    }
    // ------------------------------------------------

    // First vote from this browser/IP in the last 24h: increment and set cookie
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
