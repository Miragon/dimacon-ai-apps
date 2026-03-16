import type { MaterialType, Dimensions } from "../types";

export interface PositionTemplate {
  label: string;
  description: string;
  material: MaterialType;
  dimensions: Dimensions;
}

export const TEMPLATES: PositionTemplate[] = [
  {
    label: "Standard-Tür 2x1m",
    description: "1000 × 2100 mm, Stahlbeton 300 mm",
    material: "stahlbeton",
    dimensions: {
      width: 1000,
      height: 2100,
      wallThickness: 300,
      bladeDiameter: 600,
      maxSegmentWeight: 150,
    },
  },
  {
    label: "Breite Türöffnung 1,5x2,1m",
    description: "1500 × 2100 mm, Stahlbeton 300 mm",
    material: "stahlbeton",
    dimensions: {
      width: 1500,
      height: 2100,
      wallThickness: 300,
      bladeDiameter: 600,
      maxSegmentWeight: 150,
    },
  },
  {
    label: "Fensteröffnung",
    description: "1200 × 1400 mm, Stahlbeton 300 mm",
    material: "stahlbeton",
    dimensions: {
      width: 1200,
      height: 1400,
      wallThickness: 300,
      bladeDiameter: 800,
      maxSegmentWeight: 150,
    },
  },
];
