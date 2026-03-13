import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrder, useOrderActions } from "@/hooks/use-orders";
import { PositionTypeSelector } from "@/components/positions/PositionTypeSelector";
import { DimensionForm } from "@/components/positions/DimensionForm";
import { CalculationResults } from "@/components/positions/CalculationResults";
import { CutPreview } from "@/components/preview/CutPreview";
import type { PositionType, OpeningShape, MaterialType, Dimensions, Position } from "@/types";
import { calculatePosition } from "@/lib/calculations";

type WizardStep = "type" | "dimensions" | "results";

export function NewPositionPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const order = useOrder(orderId);
  const { addPosition } = useOrderActions();

  const [step, setStep] = useState<WizardStep>("type");
  const [positionType, setPositionType] = useState<PositionType | null>(null);
  const [shape, setShape] = useState<OpeningShape>("rectangular");
  const [material, setMaterial] = useState<MaterialType>("beton");
  const [label, setLabel] = useState("");
  const [dimensions, setDimensions] = useState<Dimensions>({
    wallThickness: 240,
    bladeDiameter: 600,
    bladeOverlap: 20,
  });
  const [notes, setNotes] = useState("");

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Auftrag nicht gefunden</p>
        <Button variant="link" onClick={() => navigate("/")}>
          Zurück
        </Button>
      </div>
    );
  }

  const handleTypeSelect = (type: PositionType) => {
    setPositionType(type);
    if (type === "kernbohrung") {
      setShape("circular");
    } else if (type === "fugenschnitt" || type === "bodensaegen") {
      setShape("rectangular");
    }
    setStep("dimensions");
  };

  const handleDimensionsSubmit = () => {
    setStep("results");
  };

  const handleSave = () => {
    if (!positionType) return;

    const position: Position = {
      id: crypto.randomUUID(),
      type: positionType,
      label: label || `${positionType} ${order.positions.length + 1}`,
      shape,
      dimensions,
      material,
      calculation: null,
      notes,
      sortOrder: order.positions.length,
    };

    position.calculation = calculatePosition(position);
    addPosition(order.id, position);
    navigate(`/orders/${order.id}`);
  };

  const tempPosition: Position | null = positionType
    ? {
        id: "temp",
        type: positionType,
        label: label || "Vorschau",
        shape,
        dimensions,
        material,
        calculation: null,
        notes: "",
        sortOrder: 0,
      }
    : null;

  const calculation = tempPosition ? calculatePosition(tempPosition) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (step === "type") navigate(`/orders/${order.id}`);
            else if (step === "dimensions") setStep("type");
            else setStep("dimensions");
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Neue Position</h1>
          <p className="text-muted-foreground">
            {step === "type" && "Positionstyp wählen"}
            {step === "dimensions" && "Maße eingeben"}
            {step === "results" && "Berechnung prüfen"}
          </p>
        </div>
      </div>

      {step === "type" && <PositionTypeSelector onSelect={handleTypeSelect} />}

      {step === "dimensions" && positionType && (
        <DimensionForm
          positionType={positionType}
          shape={shape}
          onShapeChange={setShape}
          material={material}
          onMaterialChange={setMaterial}
          dimensions={dimensions}
          onDimensionsChange={setDimensions}
          label={label}
          onLabelChange={setLabel}
          notes={notes}
          onNotesChange={setNotes}
          onSubmit={handleDimensionsSubmit}
        />
      )}

      {step === "results" && calculation && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <CalculationResults calculation={calculation} material={material} />
            <CutPreview
              calculation={calculation}
              dimensions={dimensions}
              positionType={positionType!}
              shape={shape}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("dimensions")}>
              Zurück
            </Button>
            <Button onClick={handleSave}>Position speichern</Button>
          </div>
        </div>
      )}
    </div>
  );
}
