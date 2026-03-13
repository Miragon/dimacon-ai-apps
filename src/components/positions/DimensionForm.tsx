import type { PositionType, OpeningShape, MaterialType, Dimensions } from "@/types";
import { MATERIAL_LABELS, SHAPE_LABELS } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DimensionFormProps {
  positionType: PositionType;
  shape: OpeningShape;
  onShapeChange: (shape: OpeningShape) => void;
  material: MaterialType;
  onMaterialChange: (material: MaterialType) => void;
  dimensions: Dimensions;
  onDimensionsChange: (dimensions: Dimensions) => void;
  label: string;
  onLabelChange: (label: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSubmit?: () => void;
}

export function DimensionForm({
  shape,
  onShapeChange,
  material,
  onMaterialChange,
  dimensions,
  onDimensionsChange,
  label,
  onLabelChange,
  notes,
  onNotesChange,
  onSubmit,
}: DimensionFormProps) {
  const updateDim = (key: keyof Dimensions, value: number | undefined) => {
    onDimensionsChange({ ...dimensions, [key]: value });
  };

  const numField = (
    id: string,
    labelText: string,
    key: keyof Dimensions,
    placeholder: string,
    unit: string = "mm"
  ) => (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {labelText} <span className="text-muted-foreground text-xs">({unit})</span>
      </Label>
      <Input
        id={id}
        type="number"
        value={dimensions[key] ?? ""}
        onChange={(e) =>
          updateDim(key, e.target.value ? Number(e.target.value) : undefined)
        }
        placeholder={placeholder}
        min={0}
      />
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <form onSubmit={onSubmit ? handleSubmit : undefined} className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Grunddaten & Maße</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Grunddaten in einer Zeile */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="label">Bezeichnung</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => onLabelChange(e.target.value)}
                placeholder="z.B. Tür EG links"
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Material</Label>
              <Select value={material} onValueChange={(v) => onMaterialChange(v as MaterialType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MATERIAL_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Form</Label>
              <Select value={shape} onValueChange={(v) => onShapeChange(v as OpeningShape)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SHAPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Maße */}
          {shape === "rectangular" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {numField("width", "Breite", "width", "z.B. 1000")}
              {numField("height", "Höhe", "height", "z.B. 2100")}
            </div>
          )}

          {shape === "circular" &&
            numField("diameter", "Durchmesser", "diameter", "z.B. 200")}

          {numField("wallThickness", "Wandstärke / Materialstärke", "wallThickness", "z.B. 240")}

          {shape === "rectangular" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {numField("bladeDiameter", "Blattdurchmesser", "bladeDiameter", "z.B. 600")}
              <div className="grid gap-1.5">
                <Label htmlFor="maxSegmentWeight">
                  Max. Stückgewicht <span className="text-muted-foreground text-xs">(kg)</span>
                </Label>
                <Input
                  id="maxSegmentWeight"
                  type="number"
                  value={dimensions.maxSegmentWeight}
                  onChange={(e) =>
                    updateDim("maxSegmentWeight", e.target.value ? Number(e.target.value) : 150)
                  }
                  placeholder="z.B. 150"
                  min={1}
                />
              </div>
            </div>
          )}

          {/* Notizen inline */}
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Zusätzliche Hinweise..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {onSubmit && (
        <Button type="submit" className="w-full">
          Berechnen
        </Button>
      )}
    </form>
  );
}
