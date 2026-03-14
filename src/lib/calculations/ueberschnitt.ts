import type { BoreHolePosition, DisabledSides } from "@/types";
const FLANSCH_DISTANCE = 80; // mm (from 160mm flange diameter)

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
 * Geometrischer Überschnitt Variante B (flach eingestochen).
 * Halbsehnen-Formel: Ü_B = sqrt(2·r·dEff - dEff²)
 * r = effektiver Blattradius (bladeDiameter/2 - FLANSCH_DISTANCE)
 */
export function calculateUeberschnittB(
  wallThickness: number,
  bladeDiameter: number,
  cutFromBothSides: boolean
): number {
  const r = bladeDiameter / 2 - FLANSCH_DISTANCE;
  const dEff = cutFromBothSides ? wallThickness / 2 : wallThickness;

  const inner = 2 * r * dEff - dEff * dEff;
  if (inner < 0) return 0;

  return Math.sqrt(inner);
}

/**
 * Automatische Varianten-Bestimmung basierend auf Einstechtiefe.
 * einstechtiefe + boreRadius >= dEff → Variante A (1 Bohrung/Ecke reicht)
 * einstechtiefe + boreRadius < dEff → Variante B (2 Bohrungen/Ecke nötig)
 */
export function determineCornerVariant(
  einstechtiefe: number,
  wallThickness: number,
  boreHoleDiameter: number,
  cutFromBothSides: boolean
): "A" | "B" {
  const dEff = cutFromBothSides ? wallThickness / 2 : wallThickness;
  const boreRadius = boreHoleDiameter / 2;

  return einstechtiefe + boreRadius >= dEff ? "A" : "B";
}

/**
 * Generiert Bohrungspositionen für alle Schnittkanten-Kreuzungen.
 * Anzahl pro Ecke ergibt sich dynamisch aus ceil(Überschnitt / Bohrdurchmesser):
 *   1 Eck-Bohrung (geteilt für H+V) + (boresPerLine-1) auf H + (boresPerLine-1) auf V
 */
export function generateBoreHolePositions(params: {
  widthMm: number;
  heightMm: number;
  horizontalCuts: number;
  verticalCuts: number;
  ueberschnitt: number;
  boreHoleDiameter: number;
  disabledSides?: DisabledSides;
}): BoreHolePosition[] {
  const {
    widthMm,
    heightMm,
    horizontalCuts,
    verticalCuts,
    ueberschnitt,
    boreHoleDiameter,
    disabledSides,
  } = params;
  const positions: BoreHolePosition[] = [];
  const drillDiam = boreHoleDiameter;
  const drillRadius = drillDiam / 2;
  const rows = Math.max(1, horizontalCuts - 1);
  const cols = Math.max(1, verticalCuts - 1);

  const boresPerLine = Math.max(1, Math.ceil(ueberschnitt / drillDiam));

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

      if (isCorner) {
        const cornerLabel = getCornerLabel(isTop, isLeft);
        const cornerX = isLeft ? drillRadius : widthMm - drillRadius;
        const cornerY = isTop ? drillRadius : heightMm - drillRadius;
        const hDir = isLeft ? 1 : -1;
        const vDir = isTop ? 1 : -1;

        // Eck-Bohrung (geteilt für H+V)
        positions.push({
          x: cornerX,
          y: cornerY,
          diameter: drillDiam,
          label: cornerLabel,
        });

        // Zusätzliche H-Bohrungen
        for (let i = 1; i < boresPerLine; i++) {
          positions.push({
            x: cornerX + i * drillDiam * hDir,
            y: cornerY,
            diameter: drillDiam,
            label: `${cornerLabel} H${i + 1}`,
          });
        }

        // Zusätzliche V-Bohrungen
        for (let i = 1; i < boresPerLine; i++) {
          positions.push({
            x: cornerX,
            y: cornerY + i * drillDiam * vDir,
            diameter: drillDiam,
            label: `${cornerLabel} V${i + 1}`,
          });
        }
      } else {
        // Rand-Position (nicht Ecke): 1 Bohrung
        const rawY = (heightMm * hi) / rows;
        const rawX = (widthMm * vi) / cols;
        const x = Math.max(drillRadius, Math.min(widthMm - drillRadius, rawX));
        const y = Math.max(drillRadius, Math.min(heightMm - drillRadius, rawY));

        positions.push({
          x,
          y,
          diameter: drillDiam,
          label: `Bohrung ${positions.length + 1}`,
        });
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
