export type PositionType = "wanddurchbruch" | "deckendurchbruch" | "kernbohrung" | "fugenschnitt" | "bodensaegen";
export type OpeningShape = "rectangular" | "circular";
export type MaterialType = "beton" | "stahlbeton" | "mauerwerk" | "kalksandstein" | "ziegel" | "naturstein";
export type OrderStatus = "draft" | "planned" | "exported";

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  constructionSite: ConstructionSite;
  positions: Position[];
  notes: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ConstructionSite {
  name: string;
  street: string;
  zipCode: string;
  city: string;
  contactPerson: string;
  phone: string;
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
  length?: number;
  depth?: number;
  bladeDiameter: number;
  bladeOverlap: number;
  drillDiameter?: number;
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
}

// Labels for UI display (German)
export const POSITION_TYPE_LABELS: Record<PositionType, string> = {
  wanddurchbruch: "Wanddurchbruch",
  deckendurchbruch: "Deckendurchbruch",
  kernbohrung: "Kernbohrung",
  fugenschnitt: "Fugenschnitt",
  bodensaegen: "Bodensägen",
};

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  beton: "Beton",
  stahlbeton: "Stahlbeton",
  mauerwerk: "Mauerwerk",
  kalksandstein: "Kalksandstein",
  ziegel: "Ziegel",
  naturstein: "Naturstein",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Entwurf",
  planned: "Geplant",
  exported: "Exportiert",
};

export const SHAPE_LABELS: Record<OpeningShape, string> = {
  rectangular: "Rechteckig",
  circular: "Rund",
};
