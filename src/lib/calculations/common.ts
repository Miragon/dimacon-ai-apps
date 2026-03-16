import type { MaterialType } from "../../types";

// Material densities in kg/m³
export const MATERIAL_DENSITY: Record<MaterialType, number> = {
  beton: 2400,
  stahlbeton: 2500,
  mauerwerk: 1800,
  kalksandstein: 2000,
  ziegel: 1600,
  naturstein: 2600,
};

// Time constants (material-independent)
export const MINUTES_PER_DRILLING = 15;
export const MINUTES_PER_M2_CUT_SURFACE = 12;
export const MINUTES_PER_CUT_RETOOLING = 7;

// Standard blade diameters in mm
export const STANDARD_BLADE_SIZES = [350, 400, 450, 500, 600, 700, 800, 900, 1000, 1200];

// Max weight before segmentation (kg)
export const MAX_SEGMENT_WEIGHT = 150;

export function calculateMaxCutDepth(bladeDiameter: number): number {
  return (bladeDiameter - 160) / 2;
}

export function needsCutFromBothSides(wallThickness: number, bladeDiameter: number): boolean {
  return wallThickness > calculateMaxCutDepth(bladeDiameter);
}

export function calculateOverlap(wallThickness: number, bladeDiameter: number): number {
  const r = calculateMaxCutDepth(bladeDiameter);
  const cutFromBothSides = needsCutFromBothSides(wallThickness, bladeDiameter);
  const d = cutFromBothSides ? wallThickness / 2 : wallThickness;
  return r - Math.sqrt(r * r - d * d);
}

export function calculateSegmentWeight(
  widthMm: number,
  heightMm: number,
  thicknessMm: number,
  material: MaterialType
): number {
  const volumeM3 = (widthMm / 1000) * (heightMm / 1000) * (thicknessMm / 1000);
  return volumeM3 * MATERIAL_DENSITY[material];
}
