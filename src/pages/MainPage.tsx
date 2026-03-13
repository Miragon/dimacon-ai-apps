import { useState } from "react";
import { Plus, Download, ArrowLeft, Trash2, RotateCcw, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useUrlState } from "@/hooks/use-url-state";
import { PositionList } from "@/components/positions/PositionList";
import { ExportDialog } from "@/components/export/ExportDialog";
import { DimensionForm } from "@/components/positions/DimensionForm";
import { CalculationResults } from "@/components/positions/CalculationResults";
import { CutPreview } from "@/components/preview/CutPreview";
import { calculatePosition } from "@/lib/calculations";
import { recalculateFromEdit } from "@/lib/calculations/recalculate";
import { TEMPLATES } from "@/lib/templates";
import { MATERIAL_LABELS } from "@/types";
import type {
  MaterialType,
  Dimensions,
  Position,
  CalculationResult,
  DisabledSides,
} from "@/types";

export function MainPage() {
  const {
    name,
    positions,
    editIndex,
    setName,
    addPosition,
    updatePosition,
    deletePosition,
    openEditor,
    closeEditor,
    addPositionFromTemplate,
  } = useUrlState();

  const [showExport, setShowExport] = useState(false);

  const content =
    editIndex !== null ? (
      <PositionEditor
        editIndex={editIndex}
        positions={positions}
        onSaveNew={addPosition}
        onSaveExisting={updatePosition}
        onDelete={deletePosition}
        onBack={closeEditor}
      />
    ) : (
      <ListView
        name={name}
        positions={positions}
        onNameChange={setName}
        onSelectPosition={(index) => openEditor(index)}
        onDeletePosition={deletePosition}
        onAddPosition={() => openEditor("new")}
        onExport={() => setShowExport(true)}
        showExport={showExport}
        onExportClose={() => setShowExport(false)}
      />
    );

  return (
    <SidebarProvider>
      <AppSidebar
        onNavigateHome={closeEditor}
        onAddFromTemplate={(i) => addPositionFromTemplate(TEMPLATES[i])}
        onAddEmpty={() => openEditor("new")}
        isEditing={editIndex !== null}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
          <span className="text-sm font-medium text-muted-foreground">
            Bohr- und Sägeassistent
          </span>
        </header>
        <main className="flex-1 overflow-auto p-6">{content}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// --- List View ---

function ListView({
  name,
  positions,
  onNameChange,
  onSelectPosition,
  onDeletePosition,
  onAddPosition,
  onExport,
  showExport,
  onExportClose,
}: {
  name: string;
  positions: Position[];
  onNameChange: (name: string) => void;
  onSelectPosition: (index: number) => void;
  onDeletePosition: (index: number) => void;
  onAddPosition: () => void;
  onExport: () => void;
  showExport: boolean;
  onExportClose: () => void;
}) {
  const totalLm = positions.reduce(
    (sum, p) => sum + (p.calculation?.totalLinearMeters ?? 0),
    0
  );
  const totalMinutes = positions.reduce(
    (sum, p) => sum + (p.calculation?.estimatedMinutes ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Auftragsname..."
            className="text-xl font-bold h-auto border-none shadow-none px-0 focus-visible:ring-0"
          />
        </div>
        {positions.length > 0 && (
          <Button variant="outline" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </div>

      {positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Übersicht</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Positionen</p>
              <p className="text-lg font-semibold">{positions.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Laufmeter gesamt</p>
              <p className="text-lg font-semibold">{totalLm.toFixed(2)} m</p>
            </div>
            <div>
              <p className="text-muted-foreground">Geschätzte Zeit</p>
              <p className="text-lg font-semibold">{totalMinutes} Min.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {positions.length === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Schnell starten mit einer Vorlage</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((tpl, i) => (
              <TemplateCard key={i} template={tpl} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Positionen</h2>
          <Button onClick={onAddPosition}>
            <Plus className="mr-2 h-4 w-4" />
            Position hinzufügen
          </Button>
        </div>

        <PositionList
          positions={positions}
          onDelete={(index) => onDeletePosition(index)}
          onSelect={(index) => onSelectPosition(index)}
        />
      </div>

      <ExportDialog
        name={name}
        positions={positions}
        open={showExport}
        onOpenChange={onExportClose}
      />
    </div>
  );
}

function TemplateCard({ template }: { template: (typeof TEMPLATES)[number] }) {
  const { addPositionFromTemplate } = useUrlState();

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => addPositionFromTemplate(template)}
    >
      <CardContent className="p-4">
        <p className="font-medium">{template.label}</p>
        <p className="text-sm text-muted-foreground">{template.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {MATERIAL_LABELS[template.material]}
        </p>
      </CardContent>
    </Card>
  );
}

// --- Position Editor ---

function PositionEditor({
  editIndex,
  positions,
  onSaveNew,
  onSaveExisting,
  onDelete,
  onBack,
}: {
  editIndex: number | "new";
  positions: Position[];
  onSaveNew: (position: Position) => void;
  onSaveExisting: (index: number, position: Position) => void;
  onDelete: (index: number) => void;
  onBack: () => void;
}) {
  const isEditMode = editIndex !== "new";
  const existingPosition = isEditMode ? positions[editIndex] : undefined;

  const shape = "rectangular" as const;
  const positionType = "wanddurchbruch" as const;

  const [material, setMaterial] = useState<MaterialType>(
    existingPosition?.material ?? "beton"
  );
  const [label, setLabel] = useState(existingPosition?.label ?? "");
  const [dimensions, setDimensions] = useState<Dimensions>(
    existingPosition?.dimensions ?? {
      wallThickness: 240,
      bladeDiameter: 600,
      maxSegmentWeight: 150,
    }
  );
  const [notes, setNotes] = useState(existingPosition?.notes ?? "");
  const [displayedCalc, setDisplayedCalc] = useState<CalculationResult | null>(
    existingPosition?.calculation ?? null
  );
  const [hasManualEdits, setHasManualEdits] = useState(false);
  const [needsRecalc, setNeedsRecalc] = useState(false);

  if (isEditMode && !existingPosition) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Position nicht gefunden</p>
        <Button variant="link" onClick={onBack}>
          Zurück
        </Button>
      </div>
    );
  }

  const tempPosition: Position = {
    id: existingPosition?.id ?? "temp",
    type: positionType,
    label: label || "Vorschau",
    shape,
    dimensions,
    material,
    calculation: null,
    notes,
    sortOrder: existingPosition?.sortOrder ?? positions.length,
  };

  const autoCalc = calculatePosition(tempPosition);
  const calculation = displayedCalc ?? autoCalc;

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
    setDisplayedCalc(recalculated);
    setHasManualEdits(true);
  };

  const handleToggleSide = (side: keyof DisabledSides) => {
    const newDs = { ...dimensions.disabledSides };
    newDs[side] = !newDs[side];
    setDimensions((prev) => ({ ...prev, disabledSides: newDs }));

    const recalculated = recalculateFromEdit(
      calculation,
      "horizontalCuts",
      calculation.horizontalCuts,
      { ...dimensions, disabledSides: newDs },
      material,
      positionType,
      shape
    );
    setDisplayedCalc(recalculated);
  };

  const handleDimensionsChange = (dims: Dimensions) => {
    if (!needsRecalc) {
      setDisplayedCalc(calculation);
    }
    setDimensions(dims);
    setNeedsRecalc(true);
  };

  const handleMaterialChange = (mat: MaterialType) => {
    if (!needsRecalc) {
      setDisplayedCalc(calculation);
    }
    setMaterial(mat);
    setNeedsRecalc(true);
  };

  const handleRecalculate = () => {
    setDisplayedCalc(null);
    setNeedsRecalc(false);
    setHasManualEdits(false);
  };

  const handleResetCalc = () => {
    setDisplayedCalc(null);
    setHasManualEdits(false);
  };

  const handleSave = () => {
    if (!calculation) return;

    const position: Position = {
      id: existingPosition?.id ?? crypto.randomUUID(),
      type: positionType,
      label: label || `Wanddurchbruch ${positions.length + 1}`,
      shape,
      dimensions,
      material,
      calculation,
      notes,
      sortOrder: existingPosition?.sortOrder ?? positions.length,
    };

    if (isEditMode) {
      onSaveExisting(editIndex, position);
    } else {
      onSaveNew(position);
    }
  };

  const handleDelete = () => {
    if (!isEditMode) return;
    onDelete(editIndex);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? existingPosition!.label : "Neue Position"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? `Position #${editIndex + 1}` : "Maße & Berechnung"}
          </p>
        </div>
        {needsRecalc && (
          <Button variant="outline" onClick={handleRecalculate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Neu berechnen
          </Button>
        )}
        {hasManualEdits && !needsRecalc && (
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
        onMaterialChange={handleMaterialChange}
        dimensions={dimensions}
        onDimensionsChange={handleDimensionsChange}
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
