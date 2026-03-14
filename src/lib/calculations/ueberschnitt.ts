import type { BoreHolePosition, DisabledSides } from "@/types";
import { calculateMaxCutDepth } from "./common";

const FLANSCH_DISTANCE = 60; // mm (from 120mm flange diameter)

/**
 * Geometrischer Überschnitt Variante A (maximal eingestochen).
 * Ü_A = sqrt(r² - h²) - sqrt(r² - (d_eff + h)²)
 */
export function calculateUeberschnittA(
  wallThickness: number,
  bladeDiameter: number,
  cutFromBothSides: boolean
): number {
  const r = bladeDiameter / 2;
  const h = FLANSCH_DISTANCE;
  const dEff = cutFromBothSides ? wallThickness / 2 : wallThickness;

  const inner1 = r * r - h * h;
  const inner2 = r * r - (dEff + h) * (dEff + h);

  if (inner1 < 0 || inner2 < 0) return 0;

  return Math.sqrt(inner1) - Math.sqrt(inner2);
}

/**
 * Geometrischer Überschnitt Variante B (minimal eingestochen).
 * Ü_B = sqrt(2 × maxCutDepth × d_eff)
 */
export function calculateUeberschnittB(
  wallThickness: number,
  bladeDiameter: number,
  cutFromBothSides: boolean
): number {
  const maxCutDepth = calculateMaxCutDepth(bladeDiameter);
  const dEff = cutFromBothSides ? wallThickness / 2 : wallThickness;

  const val = 2 * maxCutDepth * dEff;
  if (val < 0) return 0;

  return Math.sqrt(val);
}

/**
 * Effektiver Überschnitt: geometrischer Überschnitt minus Bohrradius.
 */
export function calculateEffectiveUeberschnitt(
  geometricUeberschnitt: number,
  boreHoleDiameter: number
): number {
  return Math.max(0, geometricUeberschnitt - boreHoleDiameter / 2);
}

/**
 * Automatische Varianten-Bestimmung basierend auf Einstechtiefe.
 * threshold = d_eff - boreRadius
 * einstechtiefe >= threshold → Variante A (1 Bohrung/Ecke)
 * einstechtiefe < threshold → Variante B (2 Bohrungen/Ecke)
 */
export function determineCornerVariant(
  einstechtiefe: number,
  wallThickness: number,
  boreHoleDiameter: number,
  cutFromBothSides: boolean
): "A" | "B" {
  const dEff = cutFromBothSides ? wallThickness / 2 : wallThickness;
  const boreRadius = boreHoleDiameter / 2;
  const threshold = dEff - boreRadius;

  return einstechtiefe >= threshold ? "A" : "B";
}

/**
 * Generiert Bohrungspositionen für alle Schnittkanten-Kreuzungen.
 * Variante A: 1 Bohrung pro Ecke
 * Variante B: 2 Bohrungen pro Ecke (auf den jeweiligen Schnittlinien)
 */
export function generateBoreHolePositions(params: {
  widthMm: number;
  heightMm: number;
  horizontalCuts: number;
  verticalCuts: number;
  cornerVariant: "A" | "B";
  boreHoleDiameter: number;
  disabledSides?: DisabledSides;
}): BoreHolePosition[] {
  const {
    widthMm,
    heightMm,
    horizontalCuts,
    verticalCuts,
    cornerVariant,
    boreHoleDiameter,
    disabledSides,
  } = params;
  const positions: BoreHolePosition[] = [];
  const drillDiam = boreHoleDiameter;
  const drillRadius = drillDiam / 2;
  const rows = Math.max(1, horizontalCuts - 1);
  const cols = Math.max(1, verticalCuts - 1);

  for (let hi = 0; hi <= rows; hi++) {
    for (let vi = 0; vi <= cols; vi++) {
      // Nur Rand-Positionen – interne Kreuzungen brauchen keine Bohrung
      if (hi > 0 && hi < rows && vi > 0 && vi < cols) continue;

      const isTop = hi === 0;
      const isBottom = hi === rows;
      const isLeft = vi === 0;
      const isRight = vi === cols;

      // Bohrungen auf deaktivierten Seiten überspringen
      if (disabledSides) {
        if (isTop && disabledSides.top) continue;
        if (isBottom && disabledSides.bottom) continue;
        if (isLeft && disabledSides.left) continue;
        if (isRight && disabledSides.right) continue;
      }

      const isCorner = (isTop || isBottom) && (isLeft || isRight);

      if (isCorner && cornerVariant === "B") {
        // Variante B: 2 Bohrungen pro Ecke
        const cornerLabel = getCornerLabel(isTop, isLeft);

        // Bohrung 1: auf horizontaler Schnittlinie
        const h1x = isLeft
          ? drillRadius + drillDiam
          : widthMm - drillRadius - drillDiam;
        const h1y = isTop ? drillRadius : heightMm - drillRadius;
        positions.push({
          x: h1x,
          y: h1y,
          diameter: drillDiam,
          label: `${cornerLabel} H`,
        });

        // Bohrung 2: auf vertikaler Schnittlinie
        const v2x = isLeft ? drillRadius : widthMm - drillRadius;
        const v2y = isTop
          ? drillRadius + drillDiam
          : heightMm - drillRadius - drillDiam;
        positions.push({
          x: v2x,
          y: v2y,
          diameter: drillDiam,
          label: `${cornerLabel} V`,
        });
      } else {
        // Variante A (1 Bohrung/Ecke) oder Rand-Position (nicht Ecke)
        const rawY = (heightMm * hi) / rows;
        const rawX = (widthMm * vi) / cols;
        const x = Math.max(drillRadius, Math.min(widthMm - drillRadius, rawX));
        const y = Math.max(drillRadius, Math.min(heightMm - drillRadius, rawY));

        let label: string;
        if (isTop && isLeft) label = "Ecke OL";
        else if (isTop && isRight) label = "Ecke OR";
        else if (isBottom && isLeft) label = "Ecke UL";
        else if (isBottom && isRight) label = "Ecke UR";
        else label = `Bohrung ${positions.length + 1}`;

        positions.push({ x, y, diameter: drillDiam, label });
      }
    }
  }

  return positions;
}

function getCornerLabel(isTop: boolean, isLeft: boolean): string {
  if (isTop && isLeft) return "Ecke OL";
  if (isTop) return "Ecke OR";
  if (isLeft) return "Ecke UL";
  return "Ecke UR";
}
