// apps/web/src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis"; // adjust alias if needed, e.g. "../../../lib/redis"

/**
 * Health endpoint:
 * - Always returns 200 with `status: "ok"` or `"degraded"`
 * - Includes Redis check result + latency
 * - Keeps your app "up" even if Redis is temporarily unavailable
 */
export async function GET() {
  const nowIso = new Date().toISOString();

  let redisOk = false;
  let redisLatencyMs: number | null = null;
  let redisError: string | null = null;

  try {
    const t0 = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();

    // Prefer a cheap PING if available; otherwise fall back to SET/GET with a 5s TTL
    try {
      // Some versions of @upstash/redis support ping()
      // @ts-expect-error - ping may not be typed on older versions
      const pong = await redis.ping?.();
      if (pong) {
        redisOk = String(pong).toUpperCase() === "PONG" || pong === true;
      } else {
        // Fallback: SET/GET round-trip
        const key = `health:check:${Math.random().toString(36).slice(2)}`;
        await redis.set(key, "1", { ex: 5 });
        const val = await redis.get<string>(key);
        redisOk = val === "1";
      }
    } catch {
      // If ping failed, try the fallback anyway
      const key = `health:check:${Math.random().toString(36).slice(2)}`;
      await redis.set(key, "1", { ex: 5 });
      const val = await redis.get<string>(key);
      redisOk = val === "1";
    }

    const t1 = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    redisLatencyMs = Math.round(t1 - t0);
  } catch (err: unknown) {
    redisOk = false;
    redisError = err instanceof Error ? err.message : "Unknown Redis error";
  }

  // Overall status – keep 200 so uptime monitors don’t mark the site down just because Redis hiccupped.
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
