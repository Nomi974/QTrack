"use client";

export function PrintButton({ children = "Print" }: { children?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-3 py-2 text-sm rounded-md border border-[var(--color-border)] hover:border-white/20"
    >
      {children}
    </button>
  );
}
