import type { CalculationResult, Dimensions, OpeningShape } from "../../types";
import { estimateRectangularTime, estimateDrillingTime } from "./time-estimation";
import { generateCutLines } from "./rectangular";
import { generateBoreHolePositions } from "./ueberschnitt";

/**
 * Recalculates derived values (totalCuts, totalLinearMeters, estimatedMinutes)
 * after the user manually changes horizontalCuts, verticalCuts, or cornerBoreHoles.
 */
export function recalculateFromEdit(
  calc: CalculationResult,
  field: keyof CalculationResult,
  value: number,
  dimensions: Dimensions,
  shape: OpeningShape
): CalculationResult {
  const updated = { ...calc, [field]: value };

  // Recalculate derived values
  updated.totalCuts = updated.horizontalCuts + updated.verticalCuts;

  if (shape === "rectangular") {
    const w = dimensions.width ?? 0;
    const h = dimensions.height ?? 0;
    const ds = dimensions.disabledSides;
    const disabledH = (ds?.top ? 1 : 0) + (ds?.bottom ? 1 : 0);
    const disabledV = (ds?.left ? 1 : 0) + (ds?.right ? 1 : 0);

    const hLm = (updated.horizontalCuts * w) / 1000;
    const vLm = (updated.verticalCuts * h) / 1000;
    const disabledHLm = disabledH * w / 1000;
    const disabledVLm = disabledV * h / 1000;
    const sideFactor = updated.cutFromBothSides ? 2 : 1;
    updated.totalLinearMeters = Math.round((hLm + vLm - disabledHLm - disabledVLm) * sideFactor * 100) / 100;

    updated.totalCuts = updated.horizontalCuts + updated.verticalCuts - disabledH - disabledV;

    // Segments = rows × columns (horizontal and vertical both contribute)
    updated.segments = Math.max(1, (updated.horizontalCuts - 1) * (updated.verticalCuts - 1));

    // Recalculate segment weight
    updated.segmentWeight = updated.totalWeight > 0
      ? Math.round((updated.totalWeight / updated.segments) * 10) / 10
      : 0;

    // Schnittfläche neu berechnen
    const activeCutLength = (updated.horizontalCuts - disabledH) * w + (updated.verticalCuts - disabledV) * h;
    updated.cutSurfaceArea = Math.round(
      activeCutLength * dimensions.wallThickness / 1_000_000 * 100
    ) / 100;

    // Regenerate cut lines and bore hole positions for SVG
    updated.cutLines = generateCutLines(w, h, updated.horizontalCuts, updated.verticalCuts, updated.cutFromBothSides, ds);
    updated.boreHolePositions = generateBoreHolePositions({
      widthMm: w,
      heightMm: h,
      horizontalCuts: updated.horizontalCuts,
      verticalCuts: updated.verticalCuts,
      ueberschnitt: updated.ueberschnitt,
      boreHoleDiameter: dimensions.boreHoleDiameter ?? 200,
      disabledSides: ds,
    });

    // Auto-update bore holes from generated positions
    if (field === "horizontalCuts" || field === "verticalCuts") {
      updated.cornerBoreHoles = updated.boreHolePositions.length;
    }

    updated.estimatedMinutes = estimateRectangularTime(updated.cutSurfaceArea, updated.totalCuts, updated.cornerBoreHoles);
  } else if (shape === "circular") {
    updated.estimatedMinutes = estimateDrillingTime(updated.segments);
  }

  return updated;
}
