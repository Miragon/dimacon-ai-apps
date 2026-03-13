import { useMemo } from "react";
import type { Position, CalculationResult } from "@/types";
import { calculatePosition } from "@/lib/calculations";

export function useCalculation(position: Position | null): CalculationResult | null {
  return useMemo(() => {
    if (!position) return null;
    try {
      return calculatePosition(position);
    } catch {
      return null;
    }
  }, [position]);
}
