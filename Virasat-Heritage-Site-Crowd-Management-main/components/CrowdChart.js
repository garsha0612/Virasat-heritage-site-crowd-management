import { HOURS, level } from "../lib/data";
export default function CrowdChart({ site }) {
  return (
    <section id="crowd" className="sec">
      <h2 className="title">Expected Crowd · Today</h2>
      <div className="card chart">
        {site.crowd.map((v, i) => { const [l, c] = level(v); return (
          <div className="col" key={site.id + i} title={`${l} (${v}%)`}>
            <div className="bar2" style={{ height: `${v}%`, background: c, animationDelay: `${i * 70}ms` }}><em>{v}</em></div>
            <span>{HOURS[i]}</span>
          </div>); })}
      </div>
      <p className="txt dim center">Tip: arrive before 8 AM or after 3 PM for the calmest visit.</p>
    </section>
  );
}
