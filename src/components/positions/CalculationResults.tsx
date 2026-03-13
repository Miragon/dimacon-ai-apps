import type { CalculationResult, MaterialType } from "@/types";
import { MATERIAL_LABELS } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Scissors, Ruler, Clock, Circle, Layers, ArrowLeftRight } from "lucide-react";

interface CalculationResultsProps {
  calculation: CalculationResult;
  material: MaterialType;
}

export function CalculationResults({ calculation, material }: CalculationResultsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Berechnungsergebnis</CardTitle>
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

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Horizontale Schnitte</span>
            <span>{calculation.horizontalCuts}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Vertikale Schnitte</span>
            <span>{calculation.verticalCuts}</span>
          </div>
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
      </CardContent>
    </Card>
  );
}

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
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}
