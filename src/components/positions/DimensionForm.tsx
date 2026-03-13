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
  onSubmit: () => void;
}

const isRectangularType = (type: PositionType) =>
  type === "wanddurchbruch" || type === "deckendurchbruch";

const isLinearType = (type: PositionType) =>
  type === "fugenschnitt" || type === "bodensaegen";

export function DimensionForm({
  positionType,
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
    <div className="grid gap-2">
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
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grunddaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="label">Bezeichnung</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder="z.B. Tür EG links"
            />
          </div>

          <div className="grid gap-2">
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

          {isRectangularType(positionType) && (
            <div className="grid gap-2">
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maße</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rectangular openings */}
          {isRectangularType(positionType) && shape === "rectangular" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {numField("width", "Breite", "width", "z.B. 1000")}
              {numField("height", "Höhe", "height", "z.B. 2100")}
            </div>
          )}

          {/* Circular openings (Durchbruch or Kernbohrung) */}
          {((isRectangularType(positionType) && shape === "circular") ||
            positionType === "kernbohrung") &&
            numField("diameter", "Durchmesser", "diameter", "z.B. 200")}

          {/* Linear cuts */}
          {isLinearType(positionType) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {numField("length", "Länge", "length", "z.B. 5000")}
              {numField("depth", "Schnitttiefe", "depth", "z.B. 200")}
            </div>
          )}

          {/* Common: wall thickness */}
          {numField("wallThickness", "Wandstärke / Materialstärke", "wallThickness", "z.B. 240")}

          {/* Blade settings for saw types */}
          {positionType !== "kernbohrung" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {numField("bladeDiameter", "Blattdurchmesser", "bladeDiameter", "z.B. 600")}
              {numField("bladeOverlap", "Überlappung", "bladeOverlap", "z.B. 20")}
            </div>
          )}

          {/* Drill diameter for core drilling */}
          {positionType === "kernbohrung" &&
            numField("drillDiameter", "Bohrkronen-Ø", "drillDiameter", "z.B. 200")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Zusätzliche Hinweise..."
            rows={3}
          />
        </CardContent>
      </Card>

      <Button type="submit" className="w-full">
        Berechnen
      </Button>
    </form>
  );
}
