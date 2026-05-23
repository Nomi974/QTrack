import { NextRequest } from "next/server";
import { recordScan, type ScanInput } from "@/lib/scan";

export async function POST(req: NextRequest) {
  let body: ScanInput;
  try {
    body = (await req.json()) as ScanInput;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.serialNo && !body.assetId) {
    return Response.json({ ok: false, error: "serialNo or assetId required" }, { status: 400 });
  }
  if (!body.source) {
    return Response.json({ ok: false, error: "source required" }, { status: 400 });
  }
  const result = await recordScan(body);
  const status = result.ok ? 200 : 400;
  return Response.json(result, { status });
}
