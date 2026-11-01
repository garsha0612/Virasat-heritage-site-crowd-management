"use client";
import { useEffect, useState } from "react";
export default function Loader({ onDone }) {
  const [p, setP] = useState(0);
  const [out, setOut] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setP((v) => Math.min(100, v + Math.random() * 6 + 2)), 110);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (p >= 100) { setOut(true); const t = setTimeout(onDone, 1100); return () => clearTimeout(t); }
  }, [p, onDone]);
  return (
    <div className={`loader ${out ? "loader-out" : ""}`}>
      <div className="loader-door l" /><div className="loader-door r" />
      <div className="loader-core">
        <svg viewBox="0 0 200 220" className="arch">
          <path className="d" d="M20 210V100Q20 40 100 10Q180 40 180 100V210" />
          <path className="d d2" d="M45 210V105Q45 62 100 38Q155 62 155 105V210" />
          <path className="d d3" d="M100 10V0M96 0h8" />
          <circle className="d d3" cx="100" cy="125" r="22" />
          <path className="d d3" d="M100 103V147M78 125H122M84 109L116 141M116 109L84 141" />
        </svg>
        <h1 className="loader-title">VIRASAT</h1>
        <p className="loader-sub">Unveiling the legacy of centuries…</p>
        <div className="bar"><i style={{ width: `${p}%` }} /></div>
        <span className="pct">{Math.floor(p)}%</span>
      </div>
    </div>
  );
}
