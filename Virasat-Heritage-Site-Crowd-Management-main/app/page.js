"use client";
import { useState } from "react";
import Loader from "../components/Loader";
import Hero from "../components/Hero";
import SiteExplorer from "../components/SiteExplorer";
import CrowdChart from "../components/CrowdChart";
import Booking from "../components/Booking";
import LiveStats from "../components/LiveStats";
import useLive from "../lib/useLive";
import { SITES } from "../lib/data";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [id, setId] = useState("taj");
  const site = SITES.find((s) => s.id === id);
  const live = useLive(id);
  return (
    <>
      {!ready && <Loader onDone={() => setReady(true)} />}
      <main className={ready ? "show" : ""}>
        <Hero />
        <SiteExplorer site={site} setId={setId} />
        <CrowdChart site={site} />
        <Booking key={id} site={site} />
        <LiveStats live={live} />
        <footer>© Virasat · Preserve the past, manage the present.</footer>
      </main>
    </>
  );
}
