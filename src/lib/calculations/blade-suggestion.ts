import { STANDARD_BLADE_SIZES } from "./common";

export function suggestBladeDiameter(wallThickness: number): number {
  const minDiameter = wallThickness * 2 + 120;
  const suggested = STANDARD_BLADE_SIZES.find((size) => size >= minDiameter);
  return suggested ?? STANDARD_BLADE_SIZES[STANDARD_BLADE_SIZES.length - 1];
}
