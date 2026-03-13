import type { MaterialType, CalculationResult } from "@/types";
import { estimateCoreDrillTime } from "./time-estimation";

const MAX_CROWN_DIAMETER = 500; // mm

export function calculateCircularOpening(
  diameterMm: number,
  wallThickness: number,
  material: MaterialType
): CalculationResult {
  const linearMeters = wallThickness / 1000;

  if (diameterMm <= MAX_CROWN_DIAMETER) {
    // Single core drill
    const estimatedMinutes = estimateCoreDrillTime(linearMeters, material);
    return {
      horizontalCuts: 0,
      verticalCuts: 0,
      totalCuts: 0,
      totalLinearMeters: Math.round(linearMeters * 100) / 100,
      cornerBoreHoles: 0,
      estimatedMinutes,
      suggestedBladeSize: diameterMm,
      cutFromBothSides: false,
      segments: 1,
      cutLines: [],
      boreHolePositions: [
        { x: diameterMm / 2, y: diameterMm / 2, diameter: diameterMm, label: "Kernbohrung" },
      ],
    };
  }

  // Multiple holes around circumference for large openings
  const circumference = Math.PI * diameterMm;
  const holesNeeded = Math.ceil(circumference / (MAX_CROWN_DIAMETER * 0.8));
  const totalLm = (holesNeeded * wallThickness) / 1000;
  const estimatedMinutes = estimateCoreDrillTime(totalLm, material);

  const boreHolePositions = [];
  const radius = diameterMm / 2;
  for (let i = 0; i < holesNeeded; i++) {
    const angle = (2 * Math.PI * i) / holesNeeded;
    boreHolePositions.push({
      x: radius + radius * Math.cos(angle),
      y: radius + radius * Math.sin(angle),
      diameter: MAX_CROWN_DIAMETER,
      label: `Bohrung ${i + 1}`,
    });
  }

  return {
    horizontalCuts: 0,
    verticalCuts: 0,
    totalCuts: 0,
    totalLinearMeters: Math.round(totalLm * 100) / 100,
    cornerBoreHoles: 0,
    estimatedMinutes,
    suggestedBladeSize: MAX_CROWN_DIAMETER,
    cutFromBothSides: false,
    segments: holesNeeded,
    cutLines: [],
    boreHolePositions,
  };
}
