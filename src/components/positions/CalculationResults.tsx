import type { CalculationResult, MaterialType, Dimensions, PositionType, OpeningShape } from "@/types";
import { MATERIAL_LABELS } from "@/types";
import { MATERIAL_DENSITY, MINUTES_PER_DRILLING, MINUTES_PER_M2_CUT_SURFACE, MINUTES_PER_CUT_RETOOLING } from "@/lib/calculations/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Scissors, Ruler, Clock, Circle, Layers, Weight, Square, EyeOff, Crosshair } from "lucide-react";

interface CalculationResultsProps {
  calculation: CalculationResult;
  material: MaterialType;
  dimensions?: Dimensions;
  positionType?: PositionType;
  shape?: OpeningShape;
  editable?: boolean;
  onFieldChange?: (field: keyof CalculationResult, value: number) => void;
}

function buildFormulaMap(
  calculation: CalculationResult,
  dimensions: Dimensions,
  material: MaterialType,
  shape: OpeningShape,
): Record<string, string> {
  const isCircular = shape === "circular";

  if (isCircular) {
    const holeCount = calculation.segments;
    return {
      estimatedMinutes: `${holeCount} × ${MINUTES_PER_DRILLING} min = ${calculation.estimatedMinutes} min`,
    };
  }

  // Rectangular
  const w = dimensions.width ?? 0;
  const h = dimensions.height ?? 0;
  const t = dimensions.wallThickness;
  const wM = w / 1000;
  const hM = h / 1000;
  const tM = t / 1000;
  const density = MATERIAL_DENSITY[material];
  const volume = round3(wM * hM * tM);
  const weight = round1(volume * density);
  const hLm = (calculation.horizontalCuts * w) / 1000;
  const vLm = (calculation.verticalCuts * h) / 1000;
  const totalLm = round2(hLm + vLm);

  const hCutDesc = calculation.horizontalCuts - 2 > 0
    ? `2 Basis + ${calculation.horizontalCuts - 2} Teilung`
    : "2 Basis";
  const vCutDesc = calculation.verticalCuts - 2 > 0
    ? `2 Basis + ${calculation.verticalCuts - 2} Teilung`
    : "2 Basis";

  const cutSurfaceTime = round1(calculation.cutSurfaceArea * MINUTES_PER_M2_CUT_SURFACE);
  const retoolingTime = calculation.totalCuts * MINUTES_PER_CUT_RETOOLING;
  const boreTime = calculation.cornerBoreHoles * MINUTES_PER_DRILLING;

  const timeLines = [`Schnittfläche: ${calculation.cutSurfaceArea} m² × ${MINUTES_PER_M2_CUT_SURFACE} min/m² = ${cutSurfaceTime} min`];
  timeLines.push(`Umrüsten: ${calculation.totalCuts} Schnitte × ${MINUTES_PER_CUT_RETOOLING} min = ${retoolingTime} min`);
  if (calculation.cornerBoreHoles > 0) {
    timeLines.push(`Bohrungen: ${calculation.cornerBoreHoles} × ${MINUTES_PER_DRILLING} min = ${boreTime} min`);
  }
  timeLines.push(`Gesamt: ${calculation.estimatedMinutes} min`);

  const variantLabel = calculation.cornerVariant === "B"
    ? `Variante B: 2/Ecke × ${calculation.cornerBoreHoles / 2} Ecken`
    : `Variante A: 1/Ecke × ${calculation.cornerBoreHoles} Ecken`;

  return {
    totalCuts: `${calculation.horizontalCuts} + ${calculation.verticalCuts} = ${calculation.totalCuts}`,
    totalLinearMeters: `(${calculation.horizontalCuts}×${wM} + ${calculation.verticalCuts}×${hM}) = ${totalLm} m`,
    cutSurfaceArea: `(${calculation.horizontalCuts}×${w} + ${calculation.verticalCuts}×${h}) × ${t} / 1.000.000 = ${calculation.cutSurfaceArea} m²`,
    estimatedMinutes: timeLines.join("\n"),
    cornerBoreHoles: `${calculation.cornerBoreHoles} (${variantLabel})`,
    totalWeight: `${wM} × ${hM} × ${tM} = ${volume} m³ × ${density} kg/m³ = ${weight} kg`,
    segmentWeight: `${calculation.totalWeight} kg / ${calculation.segments} Segmente = ${calculation.segmentWeight} kg`,
    horizontalCuts: `${hCutDesc} = ${calculation.horizontalCuts}`,
    verticalCuts: `${vCutDesc} = ${calculation.verticalCuts}`,
  };
}

export function CalculationResults({
  calculation,
  material,
  dimensions,
  positionType: _positionType,
  shape,
  editable = false,
  onFieldChange,
}: CalculationResultsProps) {
  // Deaktivierte Seiten: Anzeige zeigt aktive Schnitte, intern bleiben Strukturwerte
  const disabledH = (dimensions?.disabledSides?.top ? 1 : 0) + (dimensions?.disabledSides?.bottom ? 1 : 0);
  const disabledV = (dimensions?.disabledSides?.left ? 1 : 0) + (dimensions?.disabledSides?.right ? 1 : 0);

  const formulas = dimensions && shape
    ? buildFormulaMap(calculation, dimensions, material, shape)
    : {};

  const editableField = (
    field: keyof CalculationResult,
    value: number,
    label: string,
    offset = 0, // Offset für disabled sides: Anzeige = value - offset, Edit = input + offset
  ) => {
    const displayValue = value - offset;
    if (!editable) {
      return <span>{displayValue}</span>;
    }
    return (
      <Input
        type="number"
        value={displayValue}
        onChange={(e) => onFieldChange?.(field, Number(e.target.value) + offset)}
        className="h-7 w-20 text-right"
        min={0}
        aria-label={label}
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Berechnungsergebnis
          {editable && (
            <span className="text-xs font-normal text-muted-foreground ml-2">
              (Werte anpassbar)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <ResultItem
            icon={<Scissors className="h-4 w-4" />}
            label="Schnitte gesamt"
            value={String(calculation.totalCuts)}
            formula={formulas.totalCuts}
          />
          <ResultItem
            icon={<Ruler className="h-4 w-4" />}
            label="Laufmeter"
            value={`${calculation.totalLinearMeters} m`}
            formula={formulas.totalLinearMeters}
          />
          {calculation.cutSurfaceArea > 0 && (
            <ResultItem
              icon={<Square className="h-4 w-4" />}
              label="Schnittfläche"
              value={`${calculation.cutSurfaceArea} m²`}
              formula={formulas.cutSurfaceArea}
            />
          )}
          <ResultItem
            icon={<Clock className="h-4 w-4" />}
            label="Geschätzte Zeit"
            value={`${calculation.estimatedMinutes} Min.`}
            formula={formulas.estimatedMinutes}
          />
          <ResultItem
            icon={<Circle className="h-4 w-4" />}
            label="Eckbohrungen"
            value={String(calculation.cornerBoreHoles)}
            formula={formulas.cornerBoreHoles}
          />
          {calculation.ueberschnitt > 0 && (
            <ResultItem
              icon={<Crosshair className="h-4 w-4" />}
              label="Überschnitt (eff.)"
              value={`${calculation.ueberschnitt} mm`}
            />
          )}
        </div>

        {/* Weight section for rectangular openings */}
        {calculation.totalWeight > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <ResultItem
                icon={<Weight className="h-4 w-4" />}
                label="Gesamtgewicht"
                value={`${calculation.totalWeight} kg`}
                formula={formulas.totalWeight}
              />
              <ResultItem
                icon={<Layers className="h-4 w-4" />}
                label={`${calculation.segments} Segment${calculation.segments > 1 ? "e" : ""} à`}
                value={`${calculation.segmentWeight} kg`}
                formula={formulas.segmentWeight}
              />
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-2 text-sm">
          <DetailRow label="Horizontale Schnitte">
            {editableField("horizontalCuts", calculation.horizontalCuts, "Horizontale Schnitte", disabledH)}
          </DetailRow>
          <DetailRow label="Vertikale Schnitte">
            {editableField("verticalCuts", calculation.verticalCuts, "Vertikale Schnitte", disabledV)}
          </DetailRow>
          <DetailRow label="Eckbohrungen">
            <span>{calculation.cornerBoreHoles}</span>
          </DetailRow>
          {calculation.overlap > 0 && (
            <DetailRow label="Überlappung (berechnet)">
              <span>{calculation.overlap} mm</span>
            </DetailRow>
          )}
          {calculation.ueberschnitt > 0 && (
            <DetailRow label="Überschnitt (effektiv)">
              <span>{calculation.ueberschnitt} mm</span>
            </DetailRow>
          )}
          <DetailRow label="Material">
            <span>{MATERIAL_LABELS[material]}</span>
          </DetailRow>
        </div>

        <div className="flex flex-wrap gap-2">
          {calculation.cornerVariant && (
            <Badge variant={calculation.cornerVariant === "B" ? "default" : "secondary"} className="text-xs">
              <Circle className="mr-1 h-3 w-3" />
              Variante {calculation.cornerVariant} ({calculation.cornerVariant === "A" ? "1 Bohrung/Ecke" : "2 Bohrungen/Ecke"})
            </Badge>
          )}
          {calculation.segments > 1 && (
            <Badge variant="secondary" className="text-xs">
              <Layers className="mr-1 h-3 w-3" />
              {calculation.segments} Segmente
            </Badge>
          )}
          {dimensions?.disabledSides && (
            <>
              {dimensions.disabledSides.top && (
                <Badge variant="outline" className="text-xs">
                  <EyeOff className="mr-1 h-3 w-3" />
                  Oben deaktiviert
                </Badge>
              )}
              {dimensions.disabledSides.bottom && (
                <Badge variant="outline" className="text-xs">
                  <EyeOff className="mr-1 h-3 w-3" />
                  Unten deaktiviert
                </Badge>
              )}
              {dimensions.disabledSides.left && (
                <Badge variant="outline" className="text-xs">
                  <EyeOff className="mr-1 h-3 w-3" />
                  Links deaktiviert
                </Badge>
              )}
              {dimensions.disabledSides.right && (
                <Badge variant="outline" className="text-xs">
                  <EyeOff className="mr-1 h-3 w-3" />
                  Rechts deaktiviert
                </Badge>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function round1(n: number) { return Math.round(n * 10) / 10; }
function round2(n: number) { return Math.round(n * 100) / 100; }
function round3(n: number) { return Math.round(n * 1000) / 1000; }

function ResultItem({
  icon,
  label,
  value,
  formula,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  formula?: string;
}) {
  const content = (
    <div className="flex items-center gap-2 rounded-lg border p-2">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-semibold">{value}</p>
      </div>
    </div>
  );

  if (!formula) return content;

  return (
    <Tooltip>
      <TooltipTrigger className="w-full text-left cursor-default">
        {content}
      </TooltipTrigger>
      <TooltipContent className="max-w-md font-mono text-xs whitespace-pre-wrap">
        {formula}
      </TooltipContent>
    </Tooltip>
  );
}

function DetailRow({
  label,
  formula,
  children,
}: {
  label: string;
  formula?: string;
  children: React.ReactNode;
}) {
  const row = (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );

  if (!formula) return row;

  return (
    <Tooltip>
      <TooltipTrigger className="w-full text-left cursor-default">
        {row}
      </TooltipTrigger>
      <TooltipContent className="max-w-md font-mono text-xs whitespace-pre-wrap">
        {formula}
      </TooltipContent>
    </Tooltip>
  );
}
