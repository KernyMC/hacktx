const SEGMENTS = 16;

export default function XPBar({ value, max, label = "XP" }: { value: number; max: number; label?: string }) {
  const filled = Math.round((Math.min(value, max) / max) * SEGMENTS);
  return (
    <div
      className="px-panel px-[18px] py-[12px]"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className="mb-[6px] flex justify-between font-display text-[14px]">
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <div className="flex gap-[3px]">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <div
            key={i}
            className="h-[12px] flex-1"
            style={
              i < filled
                ? { background: "var(--accent)", boxShadow: "inset 0 3px 0 var(--accent-shine)" }
                : { background: "var(--panel-dark)" }
            }
          />
        ))}
      </div>
    </div>
  );
}
