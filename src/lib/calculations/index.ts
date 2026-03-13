import type { Position, CalculationResult } from "@/types";
import { calculateRectangularOpening } from "./rectangular";
import { calculateCircularOpening } from "./circular";

export function calculatePosition(position: Position): CalculationResult {
  const { shape, dimensions, material } = position;

  if (shape === "circular" && dimensions.diameter) {
    return calculateCircularOpening(
      dimensions.diameter,
      dimensions.wallThickness,
      material
    );
  }
  return calculateRectangularOpening(
    dimensions.width ?? 0,
    dimensions.height ?? 0,
    dimensions.wallThickness,
    material,
    dimensions.bladeDiameter,
    dimensions.maxSegmentWeight
  );
}

export { calculateRectangularOpening } from "./rectangular";
export { calculateCircularOpening } from "./circular";
export { suggestBladeDiameter } from "./blade-suggestion";
