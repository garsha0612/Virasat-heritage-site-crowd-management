import Link from "next/link";
import { SITES, level } from "../lib/data";
export default function SiteExplorer({ site, setId, nowIdx = 4 }) {
  const [lvl, col] = level(site.crowd[nowIdx]);
  return (
    <section id="sites" className="sec">
      <h2 className="title">Choose a Monument</h2>
      <div className="tabs">{SITES.map((s) => (
        <button key={s.id} className={s.id === site.id ? "tab on" : "tab"} onClick={() => setId(s.id)}>{s.name}<small>{s.city}</small></button>))}
      </div>
      <div className="card grid2" key={site.id}>
        <div className="fade">
          <p className="eyebrow">Built {site.built}</p>
          <h3 className="big">{site.name}</h3>
          <p className="txt">{site.blurb}</p>
          <ul className="facts">{site.facts.map((f) => <li key={f}>{f}</li>)}</ul>
          <p className="txt dim">Open: {site.hours}</p>
          <Link className="btn" href={`/sites/${site.id}`}>Full Details</Link>
        </div>
        <div className="fade now" style={{ "--c": col }}>
          <p className="eyebrow">Right now</p>
          <div className="ring"><span>{site.crowd[nowIdx]}%</span></div>
          <p className="lvl" style={{ color: col }}>{lvl} crowd</p>
        </div>
      </div>
    </section>
  );
}
