import { NextResponse } from "next/server";
import { SITES } from "../../../lib/data";
// Simulated sensor feed. Replace with DB / IoT / turnstile data in production.
export async function GET(req) {
  const id = new URL(req.url).searchParams.get("site") || "taj";
  const s = SITES.find((x) => x.id === id);
  if (!s) return NextResponse.json({ error: "Unknown site" }, { status: 404 });
  const t = Date.now() / 1000;
  const entered = Math.floor(s.capacity * (0.25 + 0.5 * ((t / 600) % 1)));
  const gates = [0, 1, 2].map((i) => Math.round(50 + 35 * Math.sin(t / 20 + i * 2) + Math.random() * 6));
  return NextResponse.json({ site: id, entered, capacity: s.capacity, gates, crowd: s.crowd, updated: new Date().toISOString() });
}
