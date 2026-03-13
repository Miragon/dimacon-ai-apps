import type { MaterialType } from "@/types";

// Material densities in kg/m³
export const MATERIAL_DENSITY: Record<MaterialType, number> = {
  beton: 2400,
  stahlbeton: 2500,
  mauerwerk: 1800,
  kalksandstein: 2000,
  ziegel: 1600,
  naturstein: 2600,
};

// Time per linear meter in minutes (wall saw)
export const WALL_SAW_TIME: Record<MaterialType, number> = {
  beton: 8,
  stahlbeton: 15,
  mauerwerk: 5,
  kalksandstein: 6,
  ziegel: 5,
  naturstein: 10,
};

// Time per linear meter for core drilling
export const CORE_DRILL_TIME: Record<MaterialType, number> = {
  beton: 12,
  stahlbeton: 20,
  mauerwerk: 8,
  kalksandstein: 10,
  ziegel: 8,
  naturstein: 15,
};

// Standard blade diameters in mm
export const STANDARD_BLADE_SIZES = [350, 400, 450, 500, 600, 700, 800, 900, 1000, 1200];

// Max weight before segmentation (kg)
export const MAX_SEGMENT_WEIGHT = 150;

export function calculateMaxCutDepth(bladeDiameter: number): number {
  return (bladeDiameter - 120) / 2;
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
