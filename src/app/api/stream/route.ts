// Server-Sent Events: streams asset/alert/request updates from the in-process
// bus to all open browser tabs. Each tab maintains a single EventSource so all
// open dashboards stay live without polling.

import { bus, type BusEvent } from "@/lib/events-bus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();
  let close = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* controller closed */
        }
      };
      const listener = (ev: BusEvent) => send(ev);
      bus.on("event", listener);

      send({ kind: "hello", at: Date.now() });
      const tick = setInterval(() => send({ kind: "tick", at: Date.now() }), 20_000);

      close = () => {
        bus.off("event", listener);
        clearInterval(tick);
        try {
          controller.close();
        } catch {}
      };
    },
    cancel() {
      close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
