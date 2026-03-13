import type { MaterialType, CalculationResult, CutLine, BoreHolePosition } from "@/types";
import { needsCutFromBothSides, calculateSegmentWeight, MAX_SEGMENT_WEIGHT } from "./common";
import { suggestBladeDiameter } from "./blade-suggestion";
import { estimateWallSawTime } from "./time-estimation";

export function calculateRectangularOpening(
  widthMm: number,
  heightMm: number,
  wallThickness: number,
  material: MaterialType,
  bladeDiameter: number,
  _bladeOverlap: number = 20,
  maxSegmentWeight: number = MAX_SEGMENT_WEIGHT
): CalculationResult {
  const suggestedBladeSize = suggestBladeDiameter(wallThickness);
  const effectiveBlade = Math.max(bladeDiameter, suggestedBladeSize);
  const cutFromBothSides = needsCutFromBothSides(wallThickness, effectiveBlade);

  // Base cuts: 2 horizontal (top + bottom) + 2 vertical (left + right)
  let horizontalCuts = 2;
  let verticalCuts = 2;

  // Check if segmentation is needed based on maxSegmentWeight
  const totalWeight = calculateSegmentWeight(widthMm, heightMm, wallThickness, material);
  let segments = 1;

  if (totalWeight > maxSegmentWeight) {
    segments = Math.ceil(totalWeight / maxSegmentWeight);
    // Add intermediate horizontal cuts for segmentation
    horizontalCuts += segments - 1;
  }

  const totalCuts = horizontalCuts + verticalCuts;

  // Linear meters calculation
  const horizontalLm = (horizontalCuts * widthMm) / 1000;
  const verticalLm = (verticalCuts * heightMm) / 1000;
  let totalLinearMeters = horizontalLm + verticalLm;

  // Double if cutting from both sides
  const sideFactor = cutFromBothSides ? 2 : 1;
  totalLinearMeters *= sideFactor;

  // Corner bore holes (4 corners - saw blade can't reach)
  const cornerBoreHoles = 4;

  // Time estimation
  const estimatedMinutes = estimateWallSawTime(totalLinearMeters, material) +
    cornerBoreHoles * 5; // ~5 min per bore hole

  // Generate cut lines for SVG preview
  const cutLines: CutLine[] = [];

  // Top cut
  cutLines.push({ x1: 0, y1: 0, x2: widthMm, y2: 0, label: "Oben", side: "front" });
  // Bottom cut
  cutLines.push({ x1: 0, y1: heightMm, x2: widthMm, y2: heightMm, label: "Unten", side: "front" });
  // Left cut
  cutLines.push({ x1: 0, y1: 0, x2: 0, y2: heightMm, label: "Links", side: "front" });
  // Right cut
  cutLines.push({ x1: widthMm, y1: 0, x2: widthMm, y2: heightMm, label: "Rechts", side: "front" });

  // Segmentation cuts
  if (segments > 1) {
    const segHeight = heightMm / segments;
    for (let i = 1; i < segments; i++) {
      cutLines.push({
        x1: 0,
        y1: segHeight * i,
        x2: widthMm,
        y2: segHeight * i,
        label: `Teilung ${i}`,
        side: "front",
      });
    }
  }

  if (cutFromBothSides) {
    cutLines.forEach((line) => {
      cutLines.push({ ...line, side: "back" as const });
    });
  }

  // Bore hole positions (at corners)
  const drillDiam = 50; // default corner drill diameter
  const boreHolePositions: BoreHolePosition[] = [
    { x: 0, y: 0, diameter: drillDiam, label: "Ecke OL" },
    { x: widthMm, y: 0, diameter: drillDiam, label: "Ecke OR" },
    { x: 0, y: heightMm, diameter: drillDiam, label: "Ecke UL" },
    { x: widthMm, y: heightMm, diameter: drillDiam, label: "Ecke UR" },
  ];

  return {
    horizontalCuts,
    verticalCuts,
    totalCuts,
    totalLinearMeters: Math.round(totalLinearMeters * 100) / 100,
    cornerBoreHoles,
    estimatedMinutes,
    suggestedBladeSize: effectiveBlade,
    cutFromBothSides,
    segments,
    cutLines,
    boreHolePositions,
    totalWeight: Math.round(totalWeight * 10) / 10,
    segmentWeight: Math.round((totalWeight / segments) * 10) / 10,
  };
}
