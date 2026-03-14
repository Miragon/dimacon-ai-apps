import type { PositionType, MaterialType, Dimensions } from "@/types";
import { MATERIAL_LABELS } from "@/types";
import { MATERIAL_DENSITY } from "@/lib/calculations/common";
import { suggestBladeDiameter } from "@/lib/calculations/blade-suggestion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, RefreshCw } from "lucide-react";
import { useState } from "react";

interface DimensionFormProps {
  positionType: PositionType;
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
    key: Exclude<keyof Dimensions, "disabledSides">,
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

  const [open, setOpen] = useState(true);

  return (
    <form onSubmit={onSubmit ? handleSubmit : undefined} className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center gap-2 text-left"
          >
            <CardTitle className="text-base">Grunddaten & Maße</CardTitle>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
            />
          </button>
        </CardHeader>
        {open && <CardContent className="space-y-4">
          {/* Bezeichnung */}
          <div className="grid gap-1.5">
            <Label htmlFor="label">Bezeichnung</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder="z.B. Tür EG links"
            />
          </div>

          {/* Material-Radio */}
          <div className="grid gap-1.5">
            <Label>Material</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.entries(MATERIAL_LABELS) as [MaterialType, string][]).map(
                ([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onMaterialChange(key)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      key === material
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-foreground/25"
                    )}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-muted-foreground text-xs">
                      {MATERIAL_DENSITY[key].toLocaleString("de-DE")} kg/m³
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Maße: Breite, Höhe, Wandstärke, Max. Stückgewicht */}
          <div className="grid gap-4 sm:grid-cols-4">
            {numField("width", "Breite", "width", "z.B. 1000")}
            {numField("height", "Höhe", "height", "z.B. 2100")}
            {numField("wallThickness", "Wandstärke", "wallThickness", "z.B. 240")}
            <div className="grid gap-1.5">
              <Label htmlFor="maxSegmentWeight">
                Max. Stückgewicht <span className="text-muted-foreground text-xs">(kg)</span>
              </Label>
              <Input
                id="maxSegmentWeight"
                type="number"
                value={dimensions.maxSegmentWeight ?? ""}
                onChange={(e) =>
                  updateDim("maxSegmentWeight", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="z.B. 150"
                min={1}
              />
            </div>
          </div>

          {/* Blattdurchmesser + Notizen */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="bladeDiameter">
                Blattdurchmesser <span className="text-muted-foreground text-xs">(mm)</span>
              </Label>
              <select
                id="bladeDiameter"
                value={dimensions.bladeDiameter ?? ""}
                onChange={(e) =>
                  updateDim("bladeDiameter", e.target.value ? Number(e.target.value) : undefined)
                }
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {[600, 800, 1000, 1200, 1400, 1600].map((size) => (
                  <option key={size} value={size}>
                    {size} mm
                  </option>
                ))}
              </select>
              {dimensions.wallThickness > 0 && (
                <p className="text-xs text-muted-foreground">
                  Empfohlen: {suggestBladeDiameter(dimensions.wallThickness)} mm
                </p>
              )}
            </div>
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
          </div>

          {onSubmit && (
            <Button type="submit" className="w-1/2">
              <RefreshCw className="mr-2 h-4 w-4" />
              Neu berechnen
            </Button>
          )}
        </CardContent>}
      </Card>
    </form>
  );
}
