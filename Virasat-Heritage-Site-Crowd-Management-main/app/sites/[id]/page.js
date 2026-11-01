import Link from "next/link";
import { notFound } from "next/navigation";
import { SITES, HOURS, SLOTS, level } from "../../../lib/data";
export function generateStaticParams() { return SITES.map((s) => ({ id: s.id })); }
export function generateMetadata({ params }) { const s = SITES.find((x) => x.id === params.id); return { title: s ? `${s.name} — Virasat` : "Not found" }; }
export default function SitePage({ params }) {
  const s = SITES.find((x) => x.id === params.id);
  if (!s) notFound();
  const best = HOURS[s.crowd.indexOf(Math.min(...s.crowd))], worst = HOURS[s.crowd.indexOf(Math.max(...s.crowd))];
  return (
    <main className="show detail sec">
      <Link href="/#sites" className="crumb">← All monuments</Link>
      <p className="eyebrow">{s.city} · Built {s.built}</p>
      <h1 className="dtitle">{s.name}</h1>
      <p className="txt lead2">{s.blurb}</p>
      <div className="card grid2">
        <div>
          <h4 className="sub">Did you know</h4>
          <ul className="facts">{s.facts.map((f) => <li key={f}>{f}</li>)}</ul>
          <h4 className="sub">Visitor Info</h4>
          <p className="txt">Hours: {s.hours}<br />Daily capacity: {s.capacity.toLocaleString()}<br />Quietest around <b>{best}</b>, busiest around <b>{worst}</b></p>
        </div>
        <div>
          <h4 className="sub">Ticket Prices</h4>
          {Object.entries(s.tickets).map(([k, v]) => <div className="row" key={k}><span>{k}</span><b>{v ? `₹${v}` : "Free"}</b></div>)}
          <h4 className="sub" style={{ marginTop: 24 }}>Hourly crowd</h4>
          <div className="heat">{s.crowd.map((v, i) => <span key={i} style={{ background: level(v)[1] }} title={`${HOURS[i]}: ${v}%`}>{HOURS[i]}</span>)}</div>
          <Link className="btn full" href="/#book" style={{ textAlign: "center", marginTop: 24 }}>Book a Slot</Link>
        </div>
      </div>
    </main>
  );
}
