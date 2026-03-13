import type { CalculationResult, MaterialType, Dimensions, PositionType, OpeningShape } from "@/types";
import { MATERIAL_LABELS } from "@/types";
import { MATERIAL_DENSITY, WALL_SAW_TIME, CORE_DRILL_TIME } from "@/lib/calculations/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Scissors, Ruler, Clock, Circle, Layers, ArrowLeftRight, Weight } from "lucide-react";

interface CalculationResultsProps {
  calculation: CalculationResult;
  material: MaterialType;
  dimensions?: Dimensions;
  positionType?: PositionType;
  shape?: OpeningShape;
  editable?: boolean;
  onFieldChange?: (field: keyof CalculationResult, value: number) => void;
}

export function CalculationResults({
  calculation,
  material,
  dimensions,
  positionType,
  shape,
  editable = false,
  onFieldChange,
}: CalculationResultsProps) {
  const editableField = (
    field: keyof CalculationResult,
    value: number,
    label: string
  ) => {
    if (!editable) {
      return <span>{value}</span>;
    }
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onFieldChange?.(field, Number(e.target.value))}
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
          />
          <ResultItem
            icon={<Ruler className="h-4 w-4" />}
            label="Laufmeter"
            value={`${calculation.totalLinearMeters} m`}
          />
          <ResultItem
            icon={<Clock className="h-4 w-4" />}
            label="Geschätzte Zeit"
            value={`${calculation.estimatedMinutes} Min.`}
          />
          <ResultItem
            icon={<Circle className="h-4 w-4" />}
            label="Eckbohrungen"
            value={String(calculation.cornerBoreHoles)}
          />
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
              />
              <ResultItem
                icon={<Layers className="h-4 w-4" />}
                label={`${calculation.segments} Segment${calculation.segments > 1 ? "e" : ""} à`}
                value={`${calculation.segmentWeight} kg`}
              />
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Horizontale Schnitte</span>
            {editableField("horizontalCuts", calculation.horizontalCuts, "Horizontale Schnitte")}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Vertikale Schnitte</span>
            {editableField("verticalCuts", calculation.verticalCuts, "Vertikale Schnitte")}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Eckbohrungen</span>
            {editableField("cornerBoreHoles", calculation.cornerBoreHoles, "Eckbohrungen")}
          </div>
          {calculation.overlap > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Überlappung (berechnet)</span>
              <span>{calculation.overlap} mm</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Empfohlenes Blatt</span>
            <span>{calculation.suggestedBladeSize} mm</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Material</span>
            <span>{MATERIAL_LABELS[material]}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {calculation.cutFromBothSides && (
            <Badge variant="secondary" className="text-xs">
              <ArrowLeftRight className="mr-1 h-3 w-3" />
              Beidseitig
            </Badge>
          )}
          {calculation.segments > 1 && (
            <Badge variant="secondary" className="text-xs">
              <Layers className="mr-1 h-3 w-3" />
              {calculation.segments} Segmente
            </Badge>
          )}
        </div>

        {/* Berechnungsweg */}
        {dimensions && positionType && shape && (
          <CalculationBreakdown
            calculation={calculation}
            dimensions={dimensions}
            material={material}
            shape={shape}
          />
        )}
      </CardContent>
    </Card>
  );
}

function CalculationBreakdown({
  calculation,
  dimensions,
  material,
  shape,
}: {
  calculation: CalculationResult;
  dimensions: Dimensions;
  material: MaterialType;
  shape: OpeningShape;
}) {
  const isCircular = shape === "circular";
  const timePerMeter = isCircular ? CORE_DRILL_TIME[material] : WALL_SAW_TIME[material];

  return (
    <details className="group">
      <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground select-none">
        Berechnungsweg anzeigen
      </summary>
      <div className="mt-3 rounded-md bg-muted/50 p-3 text-xs font-mono space-y-1">
        {!isCircular && (
          <RectangularBreakdown
            calculation={calculation}
            dimensions={dimensions}
            density={MATERIAL_DENSITY[material]}
            timePerMeter={timePerMeter}
          />
        )}
        {isCircular && (
          <CircularBreakdown
            calculation={calculation}
            dimensions={dimensions}
            timePerMeter={timePerMeter}
          />
        )}
      </div>
    </details>
  );
}

function RectangularBreakdown({
  calculation,
  dimensions,
  density,
  timePerMeter,
}: {
  calculation: CalculationResult;
  dimensions: Dimensions;
  density: number;
  timePerMeter: number;
}) {
  const w = dimensions.width ?? 0;
  const h = dimensions.height ?? 0;
  const t = dimensions.wallThickness;
  const wM = w / 1000;
  const hM = h / 1000;
  const tM = t / 1000;
  const volume = wM * hM * tM;
  const weight = volume * density;
  const sideFactor = calculation.cutFromBothSides ? 2 : 1;
  const hLm = (calculation.horizontalCuts * w) / 1000;
  const vLm = (calculation.verticalCuts * h) / 1000;
  const totalLm = (hLm + vLm) * sideFactor;
  const sawTime = Math.round(totalLm * timePerMeter);
  const boreTime = calculation.cornerBoreHoles * 5;

  return (
    <>
      <p>Volumen: {wM} × {hM} × {tM} = {round3(volume)} m³</p>
      <p>Gewicht: {round3(volume)} m³ × {density} kg/m³ = {round1(weight)} kg</p>
      {calculation.segments > 1 && (
        <>
          <p>Segmente: {calculation.horizontalCuts - 1} Reihen × {calculation.verticalCuts - 1} Spalten = {calculation.segments}</p>
          <p>Gewicht/Segment: {calculation.segmentWeight} kg</p>
        </>
      )}
      <p className="mt-2">H-Schnitte: {calculation.horizontalCuts} ({calculation.horizontalCuts - 2 > 0 ? `2 Basis + ${calculation.horizontalCuts - 2} Teilung` : "2 Basis"})</p>
      <p>V-Schnitte: {calculation.verticalCuts} ({calculation.verticalCuts - 2 > 0 ? `2 Basis + ${calculation.verticalCuts - 2} Teilung` : "2 Basis"})</p>
      <p>Laufmeter: ({calculation.horizontalCuts}×{wM} + {calculation.verticalCuts}×{hM}){sideFactor > 1 ? ` × ${sideFactor} (beidseitig)` : ""} = {round2(totalLm)} m</p>
      <p className="mt-2">Sägezeit: {round2(totalLm)} m × {timePerMeter} min/m = {sawTime} min</p>
      {calculation.cornerBoreHoles > 0 && (
        <p>Bohrungen: {calculation.cornerBoreHoles} × 5 min = {boreTime} min</p>
      )}
      <p className="font-semibold">Gesamt: {sawTime} + {boreTime} = {sawTime + boreTime} min</p>
    </>
  );
}

function CircularBreakdown({
  calculation,
  dimensions,
  timePerMeter,
}: {
  calculation: CalculationResult;
  dimensions: Dimensions;
  timePerMeter: number;
}) {
  const d = dimensions.diameter ?? 0;
  const t = dimensions.wallThickness;

  return (
    <>
      <p>Durchmesser: {d} mm</p>
      <p>Bohrtiefe: {t} mm = {t / 1000} m</p>
      <p>Laufmeter: {calculation.totalLinearMeters} m</p>
      <p>Zeit: {calculation.totalLinearMeters} m × {timePerMeter} min/m = {calculation.estimatedMinutes} min</p>
    </>
  );
}

function round1(n: number) { return Math.round(n * 10) / 10; }
function round2(n: number) { return Math.round(n * 100) / 100; }
function round3(n: number) { return Math.round(n * 1000) / 1000; }

function ResultItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-2">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-semibold">{value}</p>
      </div>
    </div>
  );
}
