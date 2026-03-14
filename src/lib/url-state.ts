import type { Position, MaterialType, DisabledSides, CalculationResult } from "../types";

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
  et?: string; // einstechtiefe: "m" = maximal, "w" = wandstaerke
  bd?: number; // boreHoleDiameter (mm)
  ds?: string; // disabledSides as "0110" bitmask (top,bottom,left,right)
  nt?: string; // notes
  // Stored calculation values:
  c?: UrlCalc;
}

/** Compact cut line with label and length */
export interface UrlCutLine {
  n: string;  // label (e.g. "Oben", "Links", "H-Teilung 1")
  ln: number; // length in mm
  s: number;  // side: 0=front, 1=back
  x?: number; // disabled: 1 if true (omitted if active)
}

/** Compact calculation – everything needed to restore without recalculating */
export interface UrlCalc {
  hc: number; // horizontalCuts
  vc: number; // verticalCuts
  tc: number; // totalCuts
  lm: number; // totalLinearMeters
  cb: number; // cornerBoreHoles
  em: number; // estimatedMinutes
  sb: number; // suggestedBladeSize
  sg: number; // segments
  tw: number; // totalWeight
  wt: number; // segmentWeight
  ol: number; // overlap
  cs: number; // cutSurfaceArea
  ue: number; // ueberschnitt
  cv: number; // cornerVariant (0=A, 1=B)
  cl?: UrlCutLine[]; // individual cut lines with lengths
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

function cutLineLength(line: { x1: number; y1: number; x2: number; y2: number }): number {
  return Math.round(Math.sqrt((line.x2 - line.x1) ** 2 + (line.y2 - line.y1) ** 2) * 10) / 10;
}

function calcToUrlCalc(calc: CalculationResult): UrlCalc {
  const cl: UrlCutLine[] = calc.cutLines.map((line) => {
    const entry: UrlCutLine = {
      n: line.label,
      ln: cutLineLength(line),
      s: line.side === "back" ? 1 : 0,
    };
    if (line.disabled) entry.x = 1;
    return entry;
  });

  return {
    hc: calc.horizontalCuts,
    vc: calc.verticalCuts,
    tc: calc.totalCuts,
    lm: calc.totalLinearMeters,
    cb: calc.cornerBoreHoles,
    em: calc.estimatedMinutes,
    sb: calc.suggestedBladeSize,
    sg: calc.segments,
    tw: calc.totalWeight,
    wt: calc.segmentWeight,
    ol: calc.overlap,
    cs: calc.cutSurfaceArea,
    ue: calc.ueberschnitt,
    cv: calc.cornerVariant === "B" ? 1 : 0,
    cl,
  };
}

export function urlCalcToCalc(uc: UrlCalc): Omit<CalculationResult, "cutLines" | "boreHolePositions"> {
  return {
    horizontalCuts: uc.hc,
    verticalCuts: uc.vc,
    totalCuts: uc.tc,
    totalLinearMeters: uc.lm,
    cornerBoreHoles: uc.cb,
    estimatedMinutes: uc.em,
    suggestedBladeSize: uc.sb,
    segments: uc.sg,
    totalWeight: uc.tw,
    segmentWeight: uc.wt,
    overlap: uc.ol,
    cutSurfaceArea: uc.cs,
    ueberschnitt: uc.ue ?? 0,
    cornerVariant: uc.cv === 1 ? "B" : "A",
  };
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
  if (p.dimensions.einstechtiefe && p.dimensions.einstechtiefe !== "maximal") {
    up.et = p.dimensions.einstechtiefe === "wandstaerke" ? "w" : "m";
  }
  if (p.dimensions.boreHoleDiameter != null && p.dimensions.boreHoleDiameter !== 200) {
    up.bd = p.dimensions.boreHoleDiameter;
  }
  const dsBits = disabledSidesToBitmask(p.dimensions.disabledSides);
  if (dsBits) up.ds = dsBits;
  if (p.notes) up.nt = p.notes;
  if (p.calculation) {
    up.c = calcToUrlCalc(p.calculation);
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
      einstechtiefe: up.et === "w" ? "wandstaerke" : typeof up.et === "number" ? "maximal" : up.et === "m" ? "maximal" : undefined,
      boreHoleDiameter: up.bd ?? 200,
      disabledSides: bitmaskToDisabledSides(up.ds),
    },
    material: up.m as MaterialType,
    calculation: null, // hydrated separately
    notes: up.nt ?? "",
    sortOrder: index,
  };
}

export function encodeState(state: UrlState): string {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeState(encoded: string): UrlState | null {
  try {
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
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
