import type { MaterialType, CalculationResult } from "@/types";
import { estimateFloorSawTime, estimateWallSawTime } from "./time-estimation";
import { suggestBladeDiameter } from "./blade-suggestion";

export function calculateLinearCut(
  lengthMm: number,
  depthMm: number,
  material: MaterialType,
  isFloorSaw: boolean
): CalculationResult {
  const linearMeters = lengthMm / 1000;
  const suggestedBladeSize = suggestBladeDiameter(depthMm);
  const estimatedMinutes = isFloorSaw
    ? estimateFloorSawTime(linearMeters, material)
    : estimateWallSawTime(linearMeters, material);

  return {
    horizontalCuts: isFloorSaw ? 1 : 0,
    verticalCuts: isFloorSaw ? 0 : 1,
    totalCuts: 1,
    totalLinearMeters: Math.round(linearMeters * 100) / 100,
    cornerBoreHoles: 0,
    estimatedMinutes,
    suggestedBladeSize,
    cutFromBothSides: false,
    segments: 1,
    cutLines: [
      {
        x1: 0,
        y1: 0,
        x2: lengthMm,
        y2: 0,
        label: isFloorSaw ? "Bodenschnitt" : "Fugenschnitt",
        side: "front" as const,
      },
    ],
    boreHolePositions: [],
  };
}
