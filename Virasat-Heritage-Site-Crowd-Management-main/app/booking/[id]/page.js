import Link from "next/link";
import { notFound } from "next/navigation";
import { SITES, SLOTS } from "../../../lib/data";
export const metadata = { title: "Booking Confirmed — Virasat" };
export default function Confirmed({ params, searchParams }) {
  const s = SITES.find((x) => x.id === searchParams.site);
  const slot = SLOTS[+searchParams.slot];
  if (!s || !slot) notFound();
  return (
    <main className="show sec">
      <div className="card ticket">
        <p className="eyebrow">✦ Booking Confirmed ✦</p>
        <h1 className="dtitle">{s.name}</h1>
        <p className="txt">{s.city}</p>
        <div className="row"><span>Booking ID</span><b>{params.id}</b></div>
        <div className="row"><span>Time slot</span><b>{slot}</b></div>
        <div className="row"><span>Visitors</span><b>{searchParams.people}</b></div>
        <div className="row"><span>Amount</span><b>₹{searchParams.total}</b></div>
        <p className="txt dim">Show this ID at the entry gate. Please arrive 15 minutes early.</p>
        <Link className="btn" href="/">Back to Home</Link>
      </div>
    </main>
  );
}
