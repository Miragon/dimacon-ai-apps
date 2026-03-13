import type { Order, Position } from "@/types";

export interface NewWorkingTO {
  orderNumber: string;
  customerName: string;
  constructionSite: {
    name: string;
    street: string;
    zipCode: string;
    city: string;
  };
  positions: WorkingPositionTO[];
  notes: string;
}

export interface WorkingPositionTO {
  type: string;
  label: string;
  material: string;
  dimensions: {
    width?: number;
    height?: number;
    wallThickness: number;
    diameter?: number;
    length?: number;
    depth?: number;
  };
  calculation: {
    totalCuts: number;
    totalLinearMeters: number;
    cornerBoreHoles: number;
    estimatedMinutes: number;
    suggestedBladeSize: number;
    cutFromBothSides: boolean;
    segments: number;
  } | null;
  notes: string;
}

function mapPosition(position: Position): WorkingPositionTO {
  return {
    type: position.type,
    label: position.label,
    material: position.material,
    dimensions: {
      width: position.dimensions.width,
      height: position.dimensions.height,
      wallThickness: position.dimensions.wallThickness,
      diameter: position.dimensions.diameter,
      length: position.dimensions.length,
      depth: position.dimensions.depth,
    },
    calculation: position.calculation
      ? {
          totalCuts: position.calculation.totalCuts,
          totalLinearMeters: position.calculation.totalLinearMeters,
          cornerBoreHoles: position.calculation.cornerBoreHoles,
          estimatedMinutes: position.calculation.estimatedMinutes,
          suggestedBladeSize: position.calculation.suggestedBladeSize,
          cutFromBothSides: position.calculation.cutFromBothSides,
          segments: position.calculation.segments,
        }
      : null,
    notes: position.notes,
  };
}

export function mapOrderToWorkingTO(order: Order): NewWorkingTO {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    constructionSite: {
      name: order.constructionSite.name,
      street: order.constructionSite.street,
      zipCode: order.constructionSite.zipCode,
      city: order.constructionSite.city,
    },
    positions: order.positions.map(mapPosition),
    notes: order.notes,
  };
}

export function exportOrderAsJson(order: Order): string {
  return JSON.stringify(mapOrderToWorkingTO(order), null, 2);
}
