import type { MaterialType } from "@/types";
import { WALL_SAW_TIME, CORE_DRILL_TIME } from "./common";

export function estimateWallSawTime(linearMeters: number, material: MaterialType): number {
  return Math.round(linearMeters * WALL_SAW_TIME[material]);
}

export function estimateCoreDrillTime(linearMeters: number, material: MaterialType): number {
  return Math.round(linearMeters * CORE_DRILL_TIME[material]);
}
