import type { ReactNode } from "react";

// Hard-banded glow behind legendary pets (no smooth gradients, per SPEC.md).
export default function Aura({ color, size, children }: { color: string; size: number; children: ReactNode }) {
  return (
    <div className="relative grid place-items-center">
      <div
        aria-hidden
        className="absolute animate-pulse"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color}66 0 30%, ${color}40 30% 45%, ${color}22 45% 60%, transparent 60%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
