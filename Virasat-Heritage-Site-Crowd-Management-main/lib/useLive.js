"use client";
import { useEffect, useState } from "react";
// Polls /api/crowd every 2s for live entry stats of the chosen site.
export default function useLive(siteId) {
  const [d, setD] = useState(null);
  useEffect(() => {
    let on = true;
    const pull = () => fetch(`/api/crowd?site=${siteId}`).then((r) => r.json()).then((j) => on && setD(j)).catch(() => {});
    setD(null); pull();
    const t = setInterval(pull, 2000);
    return () => { on = false; clearInterval(t); };
  }, [siteId]);
  return d;
}
