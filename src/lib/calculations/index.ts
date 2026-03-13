import type { Position, CalculationResult } from "@/types";
import { calculateRectangularOpening } from "./rectangular";
import { calculateCircularOpening } from "./circular";
import { calculateLinearCut } from "./linear";

export function calculatePosition(position: Position): CalculationResult {
  const { type, shape, dimensions, material } = position;

  switch (type) {
    case "wanddurchbruch":
    case "deckendurchbruch":
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
        dimensions.bladeOverlap
      );

    case "kernbohrung":
      return calculateCircularOpening(
        dimensions.diameter ?? 0,
        dimensions.wallThickness,
        material
      );

    case "fugenschnitt":
      return calculateLinearCut(
        dimensions.length ?? 0,
        dimensions.depth ?? dimensions.wallThickness,
        material,
        false
      );

    case "bodensaegen":
      return calculateLinearCut(
        dimensions.length ?? 0,
        dimensions.depth ?? dimensions.wallThickness,
        material,
        true
      );
  }
}

export { calculateRectangularOpening } from "./rectangular";
export { calculateCircularOpening } from "./circular";
export { calculateLinearCut } from "./linear";
export { suggestBladeDiameter } from "./blade-suggestion";
