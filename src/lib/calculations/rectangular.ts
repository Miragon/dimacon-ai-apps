import type { MaterialType, CalculationResult, CutLine, DisabledSides } from "@/types";
import { needsCutFromBothSides, calculateSegmentWeight, calculateOverlap, calculateMaxCutDepth, MAX_SEGMENT_WEIGHT } from "./common";
import { suggestBladeDiameter } from "./blade-suggestion";
import { estimateWallSawTime } from "./time-estimation";
import {
  generateBoreHolePositions,
  calculateUeberschnittA,
  calculateUeberschnittB,
  calculateEffectiveUeberschnitt,
  determineCornerVariant,
} from "./ueberschnitt";

const SIDE_LABEL_MAP: Record<string, keyof DisabledSides> = {
  "Oben": "top",
  "Unten": "bottom",
  "Links": "left",
  "Rechts": "right",
};

/** Generate cut lines for SVG preview based on cut counts. */
export function generateCutLines(
  widthMm: number,
  heightMm: number,
  horizontalCuts: number,
  verticalCuts: number,
  cutFromBothSides: boolean,
  disabledSides?: DisabledSides
): CutLine[] {
  const lines: CutLine[] = [];
  const rows = Math.max(1, horizontalCuts - 1);
  const cols = Math.max(1, verticalCuts - 1);

  // Horizontal lines (top, intermediate, bottom)
  for (let i = 0; i <= rows; i++) {
    const y = (heightMm * i) / rows;
    const label = i === 0 ? "Oben" : i === rows ? "Unten" : `H-Teilung ${i}`;
    const sideKey = SIDE_LABEL_MAP[label];
    const disabled = sideKey ? !!disabledSides?.[sideKey] : false;
    lines.push({ x1: 0, y1: y, x2: widthMm, y2: y, label, side: "front", disabled });
  }

  // Vertical lines (left, intermediate, right)
  for (let i = 0; i <= cols; i++) {
    const x = (widthMm * i) / cols;
    const label = i === 0 ? "Links" : i === cols ? "Rechts" : `V-Teilung ${i}`;
    const sideKey = SIDE_LABEL_MAP[label];
    const disabled = sideKey ? !!disabledSides?.[sideKey] : false;
    lines.push({ x1: x, y1: 0, x2: x, y2: heightMm, label, side: "front", disabled });
  }

  if (cutFromBothSides) {
    const frontLines = [...lines];
    for (const line of frontLines) {
      lines.push({ ...line, side: "back" });
    }
  }

  return lines;
}

export { generateBoreHolePositions } from "./ueberschnitt";

export function calculateRectangularOpening(
  widthMm: number,
  heightMm: number,
  wallThickness: number,
  material: MaterialType,
  bladeDiameter: number,
  maxSegmentWeight: number = MAX_SEGMENT_WEIGHT,
  disabledSides?: DisabledSides,
  einstechtiefe?: number,
  boreHoleDiameter: number = 200
): CalculationResult {
  const suggestedBladeSize = suggestBladeDiameter(wallThickness);
  const effectiveBlade = Math.max(bladeDiameter, suggestedBladeSize);
  const cutFromBothSides = needsCutFromBothSides(wallThickness, effectiveBlade);

  // Einstechtiefe: default = maxCutDepth (Variante A, abwärtskompatibel)
  const maxCutDepth = calculateMaxCutDepth(effectiveBlade);
  const effectiveEinstechtiefe = einstechtiefe ?? maxCutDepth;

  // Variante bestimmen und Überschnitt berechnen
  const cornerVariant = determineCornerVariant(
    effectiveEinstechtiefe,
    wallThickness,
    boreHoleDiameter,
    cutFromBothSides
  );
  const geometricUeberschnitt = cornerVariant === "A"
    ? calculateUeberschnittA(wallThickness, effectiveBlade, cutFromBothSides)
    : calculateUeberschnittB(wallThickness, effectiveBlade, cutFromBothSides);
  const ueberschnitt = Math.round(
    calculateEffectiveUeberschnitt(geometricUeberschnitt, boreHoleDiameter) * 10
  ) / 10;

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

  // Count disabled sides
  const disabledH = (disabledSides?.top ? 1 : 0) + (disabledSides?.bottom ? 1 : 0);
  const disabledV = (disabledSides?.left ? 1 : 0) + (disabledSides?.right ? 1 : 0);
  const totalCuts = horizontalCuts + verticalCuts - disabledH - disabledV;

  // Linear meters calculation
  const horizontalLm = (horizontalCuts * widthMm) / 1000;
  const verticalLm = (verticalCuts * heightMm) / 1000;

  // Subtract disabled sides from linear meters
  const disabledHLm = disabledH * widthMm / 1000;
  const disabledVLm = disabledV * heightMm / 1000;

  // Double if cutting from both sides
  const sideFactor = cutFromBothSides ? 2 : 1;
  let totalLinearMeters = (horizontalLm + verticalLm - disabledHLm - disabledVLm) * sideFactor;

  // Generate cut lines and bore hole positions for SVG preview
  const cutLines = generateCutLines(widthMm, heightMm, horizontalCuts, verticalCuts, cutFromBothSides, disabledSides);
  const boreHolePositions = generateBoreHolePositions({
    widthMm,
    heightMm,
    horizontalCuts,
    verticalCuts,
    cornerVariant,
    boreHoleDiameter,
    disabledSides,
  });

  const cornerBoreHoles = boreHolePositions.length;

  // Überlappung aus Wandstärke und Blattdurchmesser berechnen
  const overlap = Math.round(calculateOverlap(wallThickness, effectiveBlade) * 10) / 10;

  // Time estimation
  const estimatedMinutes = estimateWallSawTime(totalLinearMeters, material) +
    cornerBoreHoles * 5; // ~5 min per bore hole

  // Schnittfläche: Gesamtlänge aller aktiven Schnittlinien × Wandstärke
  const activeCutLength = (horizontalCuts - disabledH) * widthMm + (verticalCuts - disabledV) * heightMm;
  const cutSurfaceArea = Math.round(
    activeCutLength * wallThickness / 1_000_000 * 100
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
    ueberschnitt,
    cornerVariant,
  };
}
