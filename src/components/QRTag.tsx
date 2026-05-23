// QSTP-branded QR tag. The plate is intended to be laser-engraved on metal,
// epoxy-coated, and riveted to the asset — removing it visibly damages the
// item (tamper-evident). Rendering it as SVG means we can print at any size.

import QRCode from "qrcode";

export async function QRTag({
  serialNo,
  size = 256,
}: {
  serialNo: string;
  size?: number;
}) {
  const dataUrl = await QRCode.toString(serialNo, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 1,
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });
  // QRCode.toString returns a full <svg>...</svg> string — embed directly.
  return (
    <div
      className="inline-flex flex-col items-stretch bg-white text-black rounded-md overflow-hidden border-2 border-black"
      style={{ width: size }}
    >
      <div className="flex items-center gap-2 bg-black text-white px-3 py-1.5">
        <span className="inline-grid place-items-center w-5 h-5 rounded bg-gradient-to-br from-[#6ea8ff] to-[#b18bff] text-black font-black text-[10px]">
          Q
        </span>
        <div className="leading-none">
          <div className="text-[10px] uppercase tracking-widest">QSTP</div>
          <div className="text-[8px] opacity-70 -mt-0.5">Asset Tag</div>
        </div>
      </div>
      <div
        className="p-2 bg-white"
        dangerouslySetInnerHTML={{ __html: dataUrl }}
      />
      <div className="px-3 py-1.5 text-center font-mono text-[12px] font-semibold border-t border-black/20 tracking-tight">
        {serialNo}
      </div>
      <div className="px-3 pb-1.5 text-center text-[8px] uppercase tracking-widest opacity-60">
        Tamper-evident · do not remove
      </div>
    </div>
  );
}
