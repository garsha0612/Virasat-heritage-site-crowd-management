import { NextResponse } from "next/server";
import { SITES } from "../../../lib/data";
export async function POST(req) {
  const { site, slot, qty } = await req.json();
  const s = SITES.find((x) => x.id === site);
  if (!s || typeof slot !== "number") return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
  const total = Object.entries(qty || {}).reduce((a, [k, n]) => a + (s.tickets[k] || 0) * Math.max(0, +n || 0), 0);
  const id = "VIR-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  return NextResponse.json({ id, site, slot, total, people: Object.values(qty).reduce((a, b) => a + b, 0) });
}
