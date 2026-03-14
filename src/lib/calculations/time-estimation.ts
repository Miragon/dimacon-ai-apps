import { MINUTES_PER_M2_CUT_SURFACE, MINUTES_PER_CUT_RETOOLING, MINUTES_PER_DRILLING } from "./common";

export function estimateRectangularTime(cutSurfaceArea: number, totalCuts: number, boreHoles: number): number {
  return Math.round(
    cutSurfaceArea * MINUTES_PER_M2_CUT_SURFACE +
    totalCuts * MINUTES_PER_CUT_RETOOLING +
    boreHoles * MINUTES_PER_DRILLING
  );
}

export function estimateDrillingTime(holeCount: number): number {
  return Math.round(holeCount * MINUTES_PER_DRILLING);
}
