import type { Position } from "@/types";
import { POSITION_TYPE_LABELS, MATERIAL_LABELS, SHAPE_LABELS } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PositionSummaryProps {
  position: Position;
}

export function PositionSummary({ position }: PositionSummaryProps) {
  const d = position.dimensions;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Positionsdaten</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="Typ" value={POSITION_TYPE_LABELS[position.type]} />
        <Row label="Form" value={SHAPE_LABELS[position.shape]} />
        <Row label="Material" value={MATERIAL_LABELS[position.material]} />
        {d.width != null && <Row label="Breite" value={`${d.width} mm`} />}
        {d.height != null && <Row label="Höhe" value={`${d.height} mm`} />}
        {d.diameter != null && <Row label="Durchmesser" value={`${d.diameter} mm`} />}
        <Row label="Wandstärke" value={`${d.wallThickness} mm`} />
        {d.bladeDiameter > 0 && <Row label="Blattdurchmesser" value={`${d.bladeDiameter} mm`} />}
        <Row label="Max. Stückgewicht" value={`${d.maxSegmentWeight ?? 150} kg`} />
        {position.notes && <Row label="Notizen" value={position.notes} />}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
