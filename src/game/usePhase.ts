"use client";

import { useSyncExternalStore } from "react";
import { phaseAt, type Phase } from "./habitat";

const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 60_000);
  return () => clearInterval(id);
};

// Device-clock phase. The server render assumes day; the client corrects it on hydration.
export function usePhase(): Phase {
  return useSyncExternalStore(subscribe, () => phaseAt(new Date().getHours()), () => "day");
}
