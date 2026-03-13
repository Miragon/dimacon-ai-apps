import type { MaterialType, CalculationResult, CutLine, BoreHolePosition } from "@/types";
import { needsCutFromBothSides, calculateSegmentWeight, calculateOverlap, MAX_SEGMENT_WEIGHT } from "./common";
import { suggestBladeDiameter } from "./blade-suggestion";
import { estimateWallSawTime } from "./time-estimation";

/** Generate cut lines for SVG preview based on cut counts. */
export function generateCutLines(
  widthMm: number,
  heightMm: number,
  horizontalCuts: number,
  verticalCuts: number,
  cutFromBothSides: boolean
): CutLine[] {
  const lines: CutLine[] = [];
  const rows = Math.max(1, horizontalCuts - 1);
  const cols = Math.max(1, verticalCuts - 1);

  // Horizontal lines (top, intermediate, bottom)
  for (let i = 0; i <= rows; i++) {
    const y = (heightMm * i) / rows;
    const label = i === 0 ? "Oben" : i === rows ? "Unten" : `H-Teilung ${i}`;
    lines.push({ x1: 0, y1: y, x2: widthMm, y2: y, label, side: "front" });
  }

  // Vertical lines (left, intermediate, right)
  for (let i = 0; i <= cols; i++) {
    const x = (widthMm * i) / cols;
    const label = i === 0 ? "Links" : i === cols ? "Rechts" : `V-Teilung ${i}`;
    lines.push({ x1: x, y1: 0, x2: x, y2: heightMm, label, side: "front" });
  }

  if (cutFromBothSides) {
    const frontLines = [...lines];
    for (const line of frontLines) {
      lines.push({ ...line, side: "back" });
    }
  }

  return lines;
}

/** Generate bore hole positions at all cut intersection points. */
export function generateBoreHolePositions(
  widthMm: number,
  heightMm: number,
  horizontalCuts: number,
  verticalCuts: number
): BoreHolePosition[] {
  const positions: BoreHolePosition[] = [];
  const drillDiam = 50;
  const rows = Math.max(1, horizontalCuts - 1);
  const cols = Math.max(1, verticalCuts - 1);

  for (let hi = 0; hi <= rows; hi++) {
    for (let vi = 0; vi <= cols; vi++) {
      // Nur Rand-Positionen – interne Kreuzungen brauchen keine Bohrung
      if (hi > 0 && hi < rows && vi > 0 && vi < cols) continue;
      const y = (heightMm * hi) / rows;
      const x = (widthMm * vi) / cols;
      let label: string;
      if (hi === 0 && vi === 0) label = "Ecke OL";
      else if (hi === 0 && vi === cols) label = "Ecke OR";
      else if (hi === rows && vi === 0) label = "Ecke UL";
      else if (hi === rows && vi === cols) label = "Ecke UR";
      else label = `Bohrung ${positions.length + 1}`;
      positions.push({ x, y, diameter: drillDiam, label });
    }
  }

  return positions;
}

export function calculateRectangularOpening(
  widthMm: number,
  heightMm: number,
  wallThickness: number,
  material: MaterialType,
  bladeDiameter: number,
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
    const totalSegmentsNeeded = Math.ceil(totalWeight / maxSegmentWeight);
    const rows = Math.ceil(Math.sqrt(totalSegmentsNeeded));
    const cols = Math.ceil(totalSegmentsNeeded / rows);
    horizontalCuts = 2 + (rows - 1);
    verticalCuts = 2 + (cols - 1);
    segments = rows * cols;
  }

  const totalCuts = horizontalCuts + verticalCuts;

  // Linear meters calculation
  const horizontalLm = (horizontalCuts * widthMm) / 1000;
  const verticalLm = (verticalCuts * heightMm) / 1000;
  let totalLinearMeters = horizontalLm + verticalLm;

  // Double if cutting from both sides
  const sideFactor = cutFromBothSides ? 2 : 1;
  totalLinearMeters *= sideFactor;

  // Bore holes only at edge intersection points (not internal crossings)
  const rows = horizontalCuts - 1;
  const cols = verticalCuts - 1;
  const cornerBoreHoles = (rows + 1) * (cols + 1) - Math.max(0, rows - 1) * Math.max(0, cols - 1);

  // Überlappung aus Wandstärke und Blattdurchmesser berechnen
  const overlap = Math.round(calculateOverlap(wallThickness, effectiveBlade) * 10) / 10;

  // Time estimation
  const estimatedMinutes = estimateWallSawTime(totalLinearMeters, material) +
    cornerBoreHoles * 5; // ~5 min per bore hole

  // Generate cut lines and bore hole positions for SVG preview
  const cutLines = generateCutLines(widthMm, heightMm, horizontalCuts, verticalCuts, cutFromBothSides);
  const boreHolePositions = generateBoreHolePositions(widthMm, heightMm, horizontalCuts, verticalCuts);

  // Schnittfläche: Gesamtlänge aller Schnittlinien × Wandstärke
  const cutSurfaceArea = Math.round(
    (horizontalCuts * widthMm + verticalCuts * heightMm) * wallThickness / 1_000_000 * 100
  ) / 100;

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
    overlap,
    cutSurfaceArea,
  };
}
