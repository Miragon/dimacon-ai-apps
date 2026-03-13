import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrder, useOrderActions } from "@/hooks/use-orders";
import { DimensionForm } from "@/components/positions/DimensionForm";
import { CalculationResults } from "@/components/positions/CalculationResults";
import { CutPreview } from "@/components/preview/CutPreview";
import type { MaterialType, Dimensions, Position, CalculationResult, DisabledSides } from "@/types";
import { calculatePosition } from "@/lib/calculations";
import { recalculateFromEdit } from "@/lib/calculations/recalculate";

export function PositionPage() {
  const { orderId, positionId } = useParams<{ orderId: string; positionId: string }>();
  const navigate = useNavigate();
  const order = useOrder(orderId);
  const { addPosition, updatePosition, deletePosition } = useOrderActions();

  const isEditMode = !!positionId;
  const existingPosition = order?.positions.find((p) => p.id === positionId);

  const shape = "rectangular" as const;
  const [material, setMaterial] = useState<MaterialType>(existingPosition?.material ?? "beton");
  const [label, setLabel] = useState(existingPosition?.label ?? "");
  const [dimensions, setDimensions] = useState<Dimensions>(
    existingPosition?.dimensions ?? {
      wallThickness: 240,
      bladeDiameter: 600,
      maxSegmentWeight: 150,
    }
  );
  const [notes, setNotes] = useState(existingPosition?.notes ?? "");
  const [editedCalc, setEditedCalc] = useState<CalculationResult | null>(
    existingPosition?.calculation ?? null
  );

  if (!order || (isEditMode && !existingPosition)) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">
          {isEditMode ? "Position nicht gefunden" : "Auftrag nicht gefunden"}
        </p>
        <Button variant="link" onClick={() => navigate(orderId ? `/orders/${orderId}` : "/")}>
          Zurück
        </Button>
      </div>
    );
  }

  const positionType = "wanddurchbruch" as const;

  const tempPosition: Position = {
    id: existingPosition?.id ?? "temp",
    type: positionType,
    label: label || "Vorschau",
    shape,
    dimensions,
    material,
    calculation: null,
    notes,
    sortOrder: existingPosition?.sortOrder ?? order.positions.length,
  };

  const autoCalc = calculatePosition(tempPosition);
  const calculation = editedCalc ?? autoCalc;

  const handleFieldChange = (field: keyof CalculationResult, value: number) => {
    if (!calculation) return;
    const recalculated = recalculateFromEdit(
      calculation,
      field,
      value,
      dimensions,
      material,
      positionType,
      shape
    );
    setEditedCalc(recalculated);
  };

  const handleToggleSide = (side: keyof DisabledSides) => {
    setDimensions((prev) => {
      const ds = { ...prev.disabledSides };
      ds[side] = !ds[side];
      return { ...prev, disabledSides: ds };
    });
  };

  const handleResetCalc = () => {
    setEditedCalc(null);
  };

  const handleSave = () => {
    if (!calculation) return;

    if (isEditMode) {
      updatePosition(order.id, existingPosition!.id, {
        shape,
        material,
        label,
        dimensions,
        notes,
        calculation,
      });
    } else {
      const position: Position = {
        id: crypto.randomUUID(),
        type: positionType,
        label: label || `Wanddurchbruch ${order.positions.length + 1}`,
        shape,
        dimensions,
        material,
        calculation,
        notes,
        sortOrder: order.positions.length,
      };
      addPosition(order.id, position);
      navigate(`/orders/${order.id}`);
    }
  };

  const handleDelete = () => {
    if (!isEditMode || !existingPosition) return;
    deletePosition(order.id, existingPosition.id);
    navigate(`/orders/${order.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/orders/${order.id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? existingPosition!.label : "Neue Position"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? `Position #${existingPosition!.sortOrder + 1}` : "Maße & Berechnung"}
          </p>
        </div>
        {editedCalc && (
          <Button variant="outline" onClick={handleResetCalc}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Zurücksetzen
          </Button>
        )}
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          {isEditMode ? "Speichern" : "Position speichern"}
        </Button>
        {isEditMode && (
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <DimensionForm
        positionType={positionType}
        material={material}
        onMaterialChange={setMaterial}
        dimensions={dimensions}
        onDimensionsChange={setDimensions}
        label={label}
        onLabelChange={setLabel}
        notes={notes}
        onNotesChange={setNotes}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <CalculationResults
          calculation={calculation}
          material={material}
          dimensions={dimensions}
          positionType={positionType}
          shape={shape}
          editable
          onFieldChange={handleFieldChange}
        />
        <CutPreview
          calculation={calculation}
          dimensions={dimensions}
          positionType={positionType}
          shape={shape}
          disabledSides={dimensions.disabledSides}
          onToggleSide={handleToggleSide}
        />
      </div>
    </div>
  );
}
