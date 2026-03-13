import type { CalculationResult, Dimensions, PositionType, OpeningShape, DisabledSides } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SideKey = keyof DisabledSides;

interface CutPreviewProps {
  calculation: CalculationResult;
  dimensions: Dimensions;
  positionType: PositionType;
  shape: OpeningShape;
  disabledSides?: DisabledSides;
  onToggleSide?: (side: SideKey) => void;
}

const PADDING = 80;
const SVG_WIDTH = 500;
const SVG_HEIGHT = 400;

export function CutPreview({ calculation, dimensions, shape, disabledSides, onToggleSide }: CutPreviewProps) {
  const isCircular = shape === "circular";

  // Calculate scale to fit the SVG
  let drawWidth: number;
  let drawHeight: number;

  if (isCircular) {
    const d = dimensions.diameter ?? 0;
    drawWidth = d;
    drawHeight = d;
  } else {
    drawWidth = dimensions.width ?? 0;
    drawHeight = dimensions.height ?? 0;
  }

  if (drawWidth <= 0 || drawHeight <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schnittvorschau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground text-sm" style={{ minHeight: 200 }}>
            Maße eingeben, um Vorschau anzuzeigen
          </div>
        </CardContent>
      </Card>
    );
  }

  const availW = SVG_WIDTH - 2 * PADDING;
  const availH = SVG_HEIGHT - 2 * PADDING;
  const scale = Math.min(availW / drawWidth, availH / drawHeight);

  const scaledW = drawWidth * scale;
  const scaledH = drawHeight * scale;
  const offsetX = (SVG_WIDTH - scaledW) / 2;
  const offsetY = (SVG_HEIGHT - scaledH) / 2;

  const showToggles = !isCircular && !!onToggleSide;

  const toggleButton = (side: SideKey, label: string, className: string) => {
    const isDisabled = !!disabledSides?.[side];
    return (
      <button
        type="button"
        onClick={() => onToggleSide!(side)}
        className={`text-xs px-2 py-0.5 rounded border transition-colors ${
          isDisabled
            ? "bg-muted text-muted-foreground border-dashed line-through"
            : "bg-background text-foreground border-border hover:bg-accent"
        } ${className}`}
      >
        {label}
      </button>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Schnittvorschau</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-1">
          {showToggles && toggleButton("top", "Oben", "")}
          <div className="flex items-center gap-1 w-full">
            {showToggles && toggleButton("left", "Links", "")}
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="flex-1 rounded-md border bg-white"
              style={{ maxHeight: 400 }}
            >
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#grid)" />

              {isCircular ? (
                <CircularPreview
                  calculation={calculation}
                  diameter={drawWidth}
                  scale={scale}
                  offsetX={offsetX}
                  offsetY={offsetY}
                />
              ) : (
                <RectangularPreview
                  calculation={calculation}
                  scaledW={scaledW}
                  scaledH={scaledH}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  dimensions={dimensions}
                  scale={scale}
                />
              )}
            </svg>
            {showToggles && toggleButton("right", "Rechts", "")}
          </div>
          {showToggles && toggleButton("bottom", "Unten", "")}
        </div>
      </CardContent>
    </Card>
  );
}

function RectangularPreview({
  calculation,
  scaledW,
  scaledH,
  offsetX,
  offsetY,
  dimensions,
  scale,
}: {
  calculation: CalculationResult;
  scaledW: number;
  scaledH: number;
  offsetX: number;
  offsetY: number;
  dimensions: Dimensions;
  scale: number;
}) {
  // Compute segment distances from division cuts
  const frontCutLines = calculation.cutLines.filter((cl) => cl.side === "front");
  const width = dimensions.width ?? 0;
  const height = dimensions.height ?? 0;

  // Vertical cut lines (same x1 and x2) → split width into horizontal segments
  const verticalXSet = new Set<number>([0, width]);
  for (const cl of frontCutLines) {
    if (Math.abs(cl.x1 - cl.x2) < 0.01) {
      verticalXSet.add(Math.round(cl.x1));
    }
  }
  const sortedX = Array.from(verticalXSet).sort((a, b) => a - b);

  // Horizontal cut lines (same y1 and y2) → split height into vertical segments
  const horizontalYSet = new Set<number>([0, height]);
  for (const cl of frontCutLines) {
    if (Math.abs(cl.y1 - cl.y2) < 0.01) {
      horizontalYSet.add(Math.round(cl.y1));
    }
  }
  const sortedY = Array.from(horizontalYSet).sort((a, b) => a - b);

  const hasHSegments = sortedX.length > 2;
  const hasVSegments = sortedY.length > 2;

  return (
    <g>
      {/* Wall/surface fill */}
      <rect
        x={offsetX}
        y={offsetY}
        width={scaledW}
        height={scaledH}
        fill="#f5f5f5"
        stroke="#999"
        strokeWidth="2"
      />

      {/* Cut lines */}
      {frontCutLines.map((line, i) => (
        <line
          key={i}
          x1={offsetX + line.x1 * scale}
          y1={offsetY + line.y1 * scale}
          x2={offsetX + line.x2 * scale}
          y2={offsetY + line.y2 * scale}
          stroke={line.disabled ? "#ccc" : "#ef4444"}
          strokeWidth={line.disabled ? 1 : 2}
          strokeDasharray={line.disabled ? "4,4" : line.label.startsWith("Teilung") ? "6,3" : "none"}
          opacity={line.disabled ? 0.5 : 1}
        />
      ))}

      {/* Bore holes */}
      {calculation.boreHolePositions.map((bh, i) => (
        <circle
          key={i}
          cx={offsetX + bh.x * scale}
          cy={offsetY + bh.y * scale}
          r={Math.max((bh.diameter * scale) / 2, 5)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
        />
      ))}

      {/* Overall dimension labels */}
      <DimensionLabel
        x1={offsetX}
        y1={offsetY + scaledH + 15}
        x2={offsetX + scaledW}
        y2={offsetY + scaledH + 15}
        text={`${width} mm`}
      />
      <DimensionLabel
        x1={offsetX + scaledW + 15}
        y1={offsetY}
        x2={offsetX + scaledW + 15}
        y2={offsetY + scaledH}
        text={`${height} mm`}
        vertical
      />

      {/* Horizontal segment distances (top) */}
      {hasHSegments &&
        sortedX.slice(0, -1).map((x, i) => {
          const nextX = sortedX[i + 1];
          return (
            <DimensionLabel
              key={`hseg-${i}`}
              x1={offsetX + x * scale}
              y1={offsetY - 15}
              x2={offsetX + nextX * scale}
              y2={offsetY - 15}
              text={`${nextX - x} mm`}
            />
          );
        })}

      {/* Vertical segment distances (left) */}
      {hasVSegments &&
        sortedY.slice(0, -1).map((y, i) => {
          const nextY = sortedY[i + 1];
          return (
            <DimensionLabel
              key={`vseg-${i}`}
              x1={offsetX - 15}
              y1={offsetY + y * scale}
              x2={offsetX - 15}
              y2={offsetY + nextY * scale}
              text={`${nextY - y} mm`}
              vertical
            />
          );
        })}
    </g>
  );
}

function CircularPreview({
  calculation,
  diameter,
  scale,
  offsetX,
  offsetY,
}: {
  calculation: CalculationResult;
  diameter: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}) {
  const r = (diameter * scale) / 2;
  const cx = offsetX + r;
  const cy = offsetY + r;

  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#f5f5f5" stroke="#999" strokeWidth="2" />
      {calculation.boreHolePositions.map((bh, i) => (
        <circle
          key={i}
          cx={offsetX + bh.x * scale}
          cy={offsetY + bh.y * scale}
          r={Math.max((bh.diameter * scale) / 2, 4)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
        />
      ))}
      {/* Diameter label */}
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#666" strokeWidth="0.5" strokeDasharray="4,2" />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="11" fill="#666">
        Ø {diameter} mm
      </text>
    </g>
  );
}

function DimensionLabel({
  x1,
  y1,
  x2,
  y2,
  text,
  vertical,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  text: string;
  vertical?: boolean;
}) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#666" strokeWidth="0.5" />
      {/* End ticks */}
      {vertical ? (
        <>
          <line x1={x1 - 3} y1={y1} x2={x1 + 3} y2={y1} stroke="#666" strokeWidth="0.5" />
          <line x1={x2 - 3} y1={y2} x2={x2 + 3} y2={y2} stroke="#666" strokeWidth="0.5" />
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - 3} x2={x1} y2={y1 + 3} stroke="#666" strokeWidth="0.5" />
          <line x1={x2} y1={y2 - 3} x2={x2} y2={y2 + 3} stroke="#666" strokeWidth="0.5" />
        </>
      )}
      <text
        x={midX}
        y={midY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="10"
        fill="#666"
        transform={vertical ? `rotate(-90, ${midX}, ${midY})` : undefined}
      >
        {text}
      </text>
    </g>
  );
}
