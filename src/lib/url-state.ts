import type { Position, MaterialType, DisabledSides } from "@/types";

export interface UrlState {
  n: string; // name
  p: UrlPosition[]; // positions
}

export interface UrlPosition {
  l: string; // label
  m: string; // material
  w?: number; // width (mm)
  h?: number; // height (mm)
  t: number; // wallThickness (mm)
  d?: number; // diameter (circular)
  b: number; // bladeDiameter (mm)
  sw?: number; // maxSegmentWeight (kg)
  ds?: string; // disabledSides as "0110" bitmask (top,bottom,left,right)
  nt?: string; // notes
  hc?: number; // horizontalCuts (saved calculation)
  vc?: number; // verticalCuts (saved calculation)
}

function disabledSidesToBitmask(ds?: DisabledSides): string | undefined {
  if (!ds) return undefined;
  const bits =
    (ds.top ? "1" : "0") +
    (ds.bottom ? "1" : "0") +
    (ds.left ? "1" : "0") +
    (ds.right ? "1" : "0");
  return bits === "0000" ? undefined : bits;
}

function bitmaskToDisabledSides(bits?: string): DisabledSides | undefined {
  if (!bits) return undefined;
  const ds: DisabledSides = {};
  if (bits[0] === "1") ds.top = true;
  if (bits[1] === "1") ds.bottom = true;
  if (bits[2] === "1") ds.left = true;
  if (bits[3] === "1") ds.right = true;
  return Object.keys(ds).length > 0 ? ds : undefined;
}

export function positionToUrlPos(p: Position): UrlPosition {
  const up: UrlPosition = {
    l: p.label,
    m: p.material,
    t: p.dimensions.wallThickness,
    b: p.dimensions.bladeDiameter,
  };
  if (p.dimensions.width != null) up.w = p.dimensions.width;
  if (p.dimensions.height != null) up.h = p.dimensions.height;
  if (p.dimensions.diameter != null) up.d = p.dimensions.diameter;
  if (p.dimensions.maxSegmentWeight != null && p.dimensions.maxSegmentWeight !== 150) {
    up.sw = p.dimensions.maxSegmentWeight;
  }
  const dsBits = disabledSidesToBitmask(p.dimensions.disabledSides);
  if (dsBits) up.ds = dsBits;
  if (p.notes) up.nt = p.notes;
  if (p.calculation) {
    up.hc = p.calculation.horizontalCuts;
    up.vc = p.calculation.verticalCuts;
  }
  return up;
}

export function urlPosToPosition(up: UrlPosition, index: number): Position {
  return {
    id: `pos-${index}`,
    type: "wanddurchbruch",
    label: up.l,
    shape: up.d != null ? "circular" : "rectangular",
    dimensions: {
      width: up.w,
      height: up.h,
      wallThickness: up.t,
      diameter: up.d,
      bladeDiameter: up.b,
      maxSegmentWeight: up.sw ?? 150,
      disabledSides: bitmaskToDisabledSides(up.ds),
    },
    material: up.m as MaterialType,
    calculation: null, // will be recalculated
    notes: up.nt ?? "",
    sortOrder: index,
  };
}

export function encodeState(state: UrlState): string {
  const json = JSON.stringify(state);
  // btoa with unicode support
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  // base64url encoding (no padding, url-safe chars)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeState(encoded: string): UrlState | null {
  try {
    // Restore standard base64
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding
    while (b64.length % 4 !== 0) b64 += "=";
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as UrlState;
  } catch {
    return null;
  }
}

export const EMPTY_STATE: UrlState = { n: "", p: [] };
