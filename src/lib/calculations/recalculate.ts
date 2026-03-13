import type { CalculationResult, Dimensions, MaterialType, PositionType, OpeningShape } from "@/types";
import { estimateWallSawTime, estimateCoreDrillTime } from "./time-estimation";

/**
 * Recalculates derived values (totalCuts, totalLinearMeters, estimatedMinutes)
 * after the user manually changes horizontalCuts, verticalCuts, or cornerBoreHoles.
 */
export function recalculateFromEdit(
  calc: CalculationResult,
  field: keyof CalculationResult,
  value: number,
  dimensions: Dimensions,
  material: MaterialType,
  _positionType: PositionType,
  shape: OpeningShape
): CalculationResult {
  const updated = { ...calc, [field]: value };

  // Recalculate derived values
  updated.totalCuts = updated.horizontalCuts + updated.verticalCuts;

  if (shape === "rectangular") {
    const w = dimensions.width ?? 0;
    const h = dimensions.height ?? 0;
    const hLm = (updated.horizontalCuts * w) / 1000;
    const vLm = (updated.verticalCuts * h) / 1000;
    const sideFactor = updated.cutFromBothSides ? 2 : 1;
    updated.totalLinearMeters = Math.round((hLm + vLm) * sideFactor * 100) / 100;

    // Segments from extra horizontal cuts beyond the base 2 (top + bottom)
    updated.segments = Math.max(1, updated.horizontalCuts - 1);

    // Recalculate segment weight
    updated.segmentWeight = updated.totalWeight > 0
      ? Math.round((updated.totalWeight / updated.segments) * 10) / 10
      : 0;

    updated.estimatedMinutes =
      estimateWallSawTime(updated.totalLinearMeters, material) +
      updated.cornerBoreHoles * 5;
  } else if (shape === "circular") {
    updated.estimatedMinutes = estimateCoreDrillTime(updated.totalLinearMeters, material);
  }

  return updated;
}
