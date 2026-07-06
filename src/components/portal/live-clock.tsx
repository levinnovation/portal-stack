"use client";

import { useEffect, useState } from "react";

export function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
    const tick = () => setTime(fmt());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return <span suppressHydrationWarning>{time || "—"}</span>;
}
