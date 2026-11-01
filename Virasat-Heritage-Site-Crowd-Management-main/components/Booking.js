"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SLOTS } from "../lib/data";
export default function Booking({ site }) {
  const router = useRouter();
  const [qty, setQty] = useState({ Indian: 1, Foreigner: 0, Child: 0 });
  const [slot, setSlot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const seed = useMemo(() => SLOTS.map((_, i) => 20 + ((site.name.length * 13 + i * 37) % 60)), [site]);
  const total = Object.entries(qty).reduce((s, [k, n]) => s + n * site.tickets[k], 0);
  const people = Object.values(qty).reduce((a, b) => a + b, 0);

  async function reserve() {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site: site.id, slot, qty }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      router.push(`/booking/${j.id}?site=${j.site}&slot=${j.slot}&total=${j.total}&people=${j.people}`);
    } catch (e) { setErr(e.message || "Booking failed"); setBusy(false); }
  }
  return (
    <section id="book" className="sec">
      <h2 className="title">Tickets & Time Slots</h2>
      <div className="card grid2">
        <div>
          <h4 className="sub">Select Slot</h4>
          <div className="slots">{SLOTS.map((s, i) => { const left = 100 - seed[i]; const full = left < 25; return (
            <button key={s} disabled={full} className={`slot ${slot === i ? "on" : ""}`} onClick={() => setSlot(i)}>
              {s}<small>{full ? "Almost full" : `${left}% available`}</small></button>); })}</div>
        </div>
        <div>
          <h4 className="sub">Visitors</h4>
          {Object.keys(site.tickets).map((k) => (
            <div className="row" key={k}><span>{k} <small>₹{site.tickets[k]}</small></span>
              <div className="qty"><button onClick={() => setQty({ ...qty, [k]: Math.max(0, qty[k] - 1) })}>−</button><b>{qty[k]}</b><button onClick={() => setQty({ ...qty, [k]: qty[k] + 1 })}>+</button></div>
            </div>))}
          <div className="total">Total <b>₹{total}</b></div>
          {err && <p className="err">{err}</p>}
          <button className="btn full" disabled={slot === null || people === 0 || busy} onClick={reserve}>{busy ? "Reserving…" : "Reserve Slot"}</button>
        </div>
      </div>
    </section>
  );
}
