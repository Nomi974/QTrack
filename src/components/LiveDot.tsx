"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function LiveDot({ className }: { className?: string }) {
  const [state, setState] = useState<"connecting" | "live" | "offline">("connecting");

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onopen = () => setState("live");
    es.onerror = () => setState("offline");
    return () => es.close();
  }, []);

  const color =
    state === "live" ? "bg-emerald-400" :
    state === "connecting" ? "bg-amber-400" : "bg-rose-400";

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)]", className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", color, state === "live" && "q-pulse")} />
      {state}
    </span>
  );
}
