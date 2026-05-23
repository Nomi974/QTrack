"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type ScanCallback = (serial: string) => void;

export function Scanner({ onResult, paused }: { onResult: ScanCallback; paused?: boolean }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<Html5Qrcode | null>(null);
  const [state, setState] = useState<"idle" | "starting" | "scanning" | "error" | "denied">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    if (!elRef.current) return;
    if (instanceRef.current) return;
    setState("starting");
    setErr(null);
    try {
      const instance = new Html5Qrcode("qtrack-scanner", { verbose: false });
      instanceRef.current = instance;
      await instance.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decoded) => {
          onResult(decoded);
        },
        () => { /* swallow ‒ frequent decode failures are normal */ },
      );
      setState("scanning");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
      setState(msg.toLowerCase().includes("permission") ? "denied" : "error");
    }
  }

  async function stop() {
    try {
      const i = instanceRef.current;
      if (i && i.isScanning) await i.stop();
      i?.clear();
    } catch {}
    instanceRef.current = null;
    setState("idle");
  }

  useEffect(() => {
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (paused) stop();
  }, [paused]);

  return (
    <div className="flex flex-col items-stretch gap-3">
      <div
        id="qtrack-scanner"
        ref={elRef}
        className="w-full aspect-square max-w-[420px] mx-auto rounded-xl overflow-hidden bg-black border border-[var(--color-border)]"
      />
      <div className="flex justify-center gap-2">
        {state === "scanning" ? (
          <button
            onClick={stop}
            className="px-4 py-2 rounded-md bg-rose-500/80 text-white text-sm font-medium"
          >Stop camera</button>
        ) : (
          <button
            onClick={start}
            className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent)]/90"
          >
            {state === "starting" ? "Starting…" : "Start camera"}
          </button>
        )}
      </div>
      {state === "denied" && (
        <p className="text-xs text-amber-300 text-center">
          Camera permission denied. Use the manual entry below.
        </p>
      )}
      {state === "error" && err && (
        <p className="text-xs text-rose-300 text-center">Scanner error: {err}</p>
      )}
    </div>
  );
}
