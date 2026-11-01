import { level } from "../lib/data";
export default function LiveStats({ live }) {
  const occ = live ? Math.round((live.entered / live.capacity) * 100) : 0;
  return (
    <section id="live" className="sec">
      <h2 className="title">Live Entry Statistics</h2>
      <div className="card stats">
        {!live ? <p>Connecting to sensors…</p> : (<>
          <div><span className="pulse" /> <small>Entered today</small><h3 className="big">{live.entered.toLocaleString()}</h3></div>
          <div><small>Capacity used</small><h3 className="big">{occ}%</h3><div className="mini"><i style={{ width: `${occ}%`, background: level(occ)[1] }} /></div></div>
          {live.gates.map((g, i) => (<div key={i}><small>Gate {i + 1} load</small><h3 className="big">{g}%</h3><div className="mini"><i style={{ width: `${g}%`, background: level(g)[1] }} /></div></div>))}
        </>)}
      </div>
    </section>
  );
}
