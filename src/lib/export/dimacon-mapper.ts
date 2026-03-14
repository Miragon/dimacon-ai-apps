import type { Position } from "@/types";

export interface NewWorkingTO {
  name: string;
  positions: WorkingPositionTO[];
  notes: string;
}

export interface WorkingCutTO {
  label: string;
  lengthMm: number;
  side: "front" | "back";
  disabled: boolean;
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
    maxSegmentWeight: number;
    disabledSides?: { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean };
  };
  calculation: {
    totalCuts: number;
    totalLinearMeters: number;
    cornerBoreHoles: number;
    estimatedMinutes: number;
    suggestedBladeSize: number;
    cutFromBothSides: boolean;
    segments: number;
    cuts: WorkingCutTO[];
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
      maxSegmentWeight: position.dimensions.maxSegmentWeight ?? 150,
      disabledSides: position.dimensions.disabledSides,
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
          cuts: position.calculation.cutLines.map((line) => ({
            label: line.label,
            lengthMm: Math.round(Math.sqrt((line.x2 - line.x1) ** 2 + (line.y2 - line.y1) ** 2) * 10) / 10,
            side: line.side,
            disabled: !!line.disabled,
          })),
        }
      : null,
    notes: position.notes,
  };
}

export function mapToWorkingTO(positions: Position[], name: string, notes = ""): NewWorkingTO {
  return {
    name,
    positions: positions.map(mapPosition),
    notes,
  };
}

export function exportAsJson(positions: Position[], name: string, notes = ""): string {
  return JSON.stringify(mapToWorkingTO(positions, name, notes), null, 2);
}
