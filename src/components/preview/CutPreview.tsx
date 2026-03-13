import type { CalculationResult, Dimensions, PositionType, OpeningShape } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CutPreviewProps {
  calculation: CalculationResult;
  dimensions: Dimensions;
  positionType: PositionType;
  shape: OpeningShape;
}

const PADDING = 40;
const SVG_WIDTH = 400;
const SVG_HEIGHT = 300;

export function CutPreview({ calculation, dimensions, positionType, shape }: CutPreviewProps) {
  const isCircular = shape === "circular" || positionType === "kernbohrung";
  const isLinear = positionType === "fugenschnitt" || positionType === "bodensaegen";

  // Calculate scale to fit the SVG
  let drawWidth: number;
  let drawHeight: number;

  if (isCircular) {
    const d = dimensions.diameter ?? 200;
    drawWidth = d;
    drawHeight = d;
  } else if (isLinear) {
    drawWidth = dimensions.length ?? 1000;
    drawHeight = dimensions.depth ?? 200;
  } else {
    drawWidth = dimensions.width ?? 1000;
    drawHeight = dimensions.height ?? 1000;
  }

  const availW = SVG_WIDTH - 2 * PADDING;
  const availH = SVG_HEIGHT - 2 * PADDING;
  const scale = Math.min(availW / drawWidth, availH / drawHeight);

  const scaledW = drawWidth * scale;
  const scaledH = drawHeight * scale;
  const offsetX = (SVG_WIDTH - scaledW) / 2;
  const offsetY = (SVG_HEIGHT - scaledH) / 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Schnittvorschau</CardTitle>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full rounded-md border bg-white"
          style={{ maxHeight: 300 }}
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
          ) : isLinear ? (
            <LinearPreview
              scaledW={scaledW}
              offsetX={offsetX}
              offsetY={offsetY}
              scaledH={scaledH}
              dimensions={dimensions}
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
      {calculation.cutLines
        .filter((cl) => cl.side === "front")
        .map((line, i) => (
          <line
            key={i}
            x1={offsetX + line.x1 * scale}
            y1={offsetY + line.y1 * scale}
            x2={offsetX + line.x2 * scale}
            y2={offsetY + line.y2 * scale}
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray={line.label.startsWith("Teilung") ? "6,3" : "none"}
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

      {/* Dimension labels */}
      <DimensionLabel
        x1={offsetX}
        y1={offsetY + scaledH + 15}
        x2={offsetX + scaledW}
        y2={offsetY + scaledH + 15}
        text={`${dimensions.width ?? 0} mm`}
      />
      <DimensionLabel
        x1={offsetX + scaledW + 15}
        y1={offsetY}
        x2={offsetX + scaledW + 15}
        y2={offsetY + scaledH}
        text={`${dimensions.height ?? 0} mm`}
        vertical
      />
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

function LinearPreview({
  scaledW,
  offsetX,
  offsetY,
  scaledH,
  dimensions,
}: {
  scaledW: number;
  offsetX: number;
  offsetY: number;
  scaledH: number;
  dimensions: Dimensions;
}) {
  const y = offsetY + scaledH / 2;
  return (
    <g>
      {/* Surface */}
      <rect
        x={offsetX}
        y={offsetY}
        width={scaledW}
        height={scaledH}
        fill="#f5f5f5"
        stroke="#999"
        strokeWidth="1"
      />
      {/* Cut line */}
      <line
        x1={offsetX}
        y1={y}
        x2={offsetX + scaledW}
        y2={y}
        stroke="#ef4444"
        strokeWidth="2"
      />
      <DimensionLabel
        x1={offsetX}
        y1={offsetY + scaledH + 15}
        x2={offsetX + scaledW}
        y2={offsetY + scaledH + 15}
        text={`${dimensions.length ?? 0} mm`}
      />
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
