import type { MaterialType, Dimensions } from "../types";

export interface PositionTemplate {
  label: string;
  description: string;
  material: MaterialType;
  dimensions: Dimensions;
}

export const TEMPLATES: PositionTemplate[] = [
  {
    label: "Standardtür",
    description: "1000 × 2100 mm, Mauerwerk 240 mm",
    material: "mauerwerk",
    dimensions: {
      width: 1000,
      height: 2100,
      wallThickness: 240,
      bladeDiameter: 600,
      maxSegmentWeight: 150,
    },
  },
  {
    label: "Breite Türöffnung",
    description: "1500 × 2100 mm, Mauerwerk 240 mm",
    material: "mauerwerk",
    dimensions: {
      width: 1500,
      height: 2100,
      wallThickness: 240,
      bladeDiameter: 600,
      maxSegmentWeight: 150,
    },
  },
  {
    label: "Fensteröffnung",
    description: "1200 × 1400 mm, Kalksandstein 365 mm",
    material: "kalksandstein",
    dimensions: {
      width: 1200,
      height: 1400,
      wallThickness: 365,
      bladeDiameter: 800,
      maxSegmentWeight: 150,
    },
  },
  {
    label: "Durchbruch Beton",
    description: "800 × 800 mm, Stahlbeton 200 mm",
    material: "stahlbeton",
    dimensions: {
      width: 800,
      height: 800,
      wallThickness: 200,
      bladeDiameter: 600,
      maxSegmentWeight: 150,
    },
  },
  {
    label: "Großer Durchbruch",
    description: "2000 × 2500 mm, Beton 300 mm",
    material: "beton",
    dimensions: {
      width: 2000,
      height: 2500,
      wallThickness: 300,
      bladeDiameter: 800,
      maxSegmentWeight: 150,
    },
  },
];
