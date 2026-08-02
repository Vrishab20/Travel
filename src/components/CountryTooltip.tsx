"use client";

import type { MousePosition } from "@/types/travel";

type CountryTooltipProps = {
  name: string | null;
  position: MousePosition | null;
  visible: boolean;
};

export function CountryTooltip({ name, position, visible }: CountryTooltipProps) {
  if (!visible || !name || !position) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-[140%] rounded-md border border-white/15 bg-[#0c1218]/92 px-3 py-1.5 text-sm text-[#f3efe6] shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-md"
      style={{ left: position.x, top: position.y }}
      role="status"
      aria-live="polite"
    >
      {name}
    </div>
  );
}
