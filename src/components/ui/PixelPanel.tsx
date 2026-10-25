import type { ReactNode } from "react";

export default function PixelPanel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`px-panel p-[15px] ${className}`}>{children}</div>;
}
