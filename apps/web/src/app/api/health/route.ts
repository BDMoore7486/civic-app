// apps/web/src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis"; // if your alias isn't configured, use: "../../../lib/redis"

type PingCapable = {
  ping?: () => Promise<string | boolean>;
};

export async function GET() {
  const nowIso = new Date().toISOString();

  let redisOk = false;
  let redisLatencyMs: number | null = null;
  let redisError: string | null = null;

  try {
    const t0 =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();

    // Try ping() if the client exposes it; otherwise fall back to a SET/GET round-trip.
    const maybePing = (redis as unknown as PingCapable).ping;

    if (typeof maybePing === "function") {
      const pong = await maybePing();
      redisOk = String(pong).toUpperCase() === "PONG" || pong === true;
    } else {
      const key = `health:check:${Math.random().toString(36).slice(2)}`;
      await redis.set(key, "1", { ex: 5 });
      const val = await redis.get<string>(key);
      redisOk = val === "1";
    }

    const t1 =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    redisLatencyMs = Math.round(t1 - t0);
  } catch (err) {
    redisOk = false;
    redisError = err instanceof Error ? err.message : "Unknown Redis error";
  }

  const overall = redisOk ? "ok" : "degraded";

  return NextResponse.json({
    status: overall,
    timestamp: nowIso,
    redis: {
      ok: redisOk,
      latencyMs: redisLatencyMs,
      error: redisError,
    },
  });
}
