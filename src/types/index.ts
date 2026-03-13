export type PositionType = "wanddurchbruch";
export type OpeningShape = "rectangular" | "circular";
export type MaterialType = "beton" | "stahlbeton" | "mauerwerk" | "kalksandstein" | "ziegel" | "naturstein";

export interface Order {
  id: string;
  name: string;
  positions: Position[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  type: PositionType;
  label: string;
  shape: OpeningShape;
  dimensions: Dimensions;
  material: MaterialType;
  calculation: CalculationResult | null;
  notes: string;
  sortOrder: number;
}

export interface Dimensions {
  width?: number;
  height?: number;
  wallThickness: number;
  diameter?: number;
  bladeDiameter: number;
  maxSegmentWeight?: number; // kg – max weight per individual piece, defaults to 150
}

export interface CutLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  side: "front" | "back";
}

export interface BoreHolePosition {
  x: number;
  y: number;
  diameter: number;
  label: string;
}

export interface CalculationResult {
  horizontalCuts: number;
  verticalCuts: number;
  totalCuts: number;
  totalLinearMeters: number;
  cornerBoreHoles: number;
  estimatedMinutes: number;
  suggestedBladeSize: number;
  cutFromBothSides: boolean;
  segments: number;
  cutLines: CutLine[];
  boreHolePositions: BoreHolePosition[];
  totalWeight: number;    // Gesamtgewicht in kg
  segmentWeight: number;  // Gewicht pro Segment in kg
  overlap: number;        // Berechnete Überlappung in mm
  cutSurfaceArea: number; // Schnittfläche in m²
}

// Labels for UI display (German)
export const POSITION_TYPE_LABELS: Record<PositionType, string> = {
  wanddurchbruch: "Wanddurchbruch",
};

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  beton: "Beton",
  stahlbeton: "Stahlbeton",
  mauerwerk: "Mauerwerk",
  kalksandstein: "Kalksandstein",
  ziegel: "Ziegel",
  naturstein: "Naturstein",
};

export const SHAPE_LABELS: Record<OpeningShape, string> = {
  rectangular: "Rechteckig",
  circular: "Rund",
};
