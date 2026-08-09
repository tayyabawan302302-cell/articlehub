"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs px-3 py-1.5 rounded-full border border-line hover:border-ink"
    >
      Print Magazine
    </button>
  );
}
