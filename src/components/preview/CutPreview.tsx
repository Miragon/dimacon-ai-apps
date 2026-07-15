import { useCallback, useEffect, useRef, useState } from "react";
import type { CalculationResult, Dimensions, PositionType, OpeningShape, DisabledSides } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

// --- Pan & Zoom hook ---

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function usePanZoom(initialWidth: number, initialHeight: number) {
  const [viewBox, setViewBox] = useState<ViewBox>({ x: 0, y: 0, width: initialWidth, height: initialHeight });
  const [isPanning, setIsPanning] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Active pointers (id -> client coords) for multi-touch pinch support
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const panStart = useRef<{ x: number; y: number; vbX: number; vbY: number } | null>(null);
  const pinchStart = useRef<{ dist: number; centerSVG: { x: number; y: number }; vb: ViewBox } | null>(null);

  const isZoomed = viewBox.width < initialWidth - 0.5 || viewBox.height < initialHeight - 0.5;

  // Map client coords to SVG coords for a given viewBox
  const clientToSVG = useCallback(
    (clientX: number, clientY: number, vb: ViewBox): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: vb.x + ((clientX - rect.left) / rect.width) * vb.width,
        y: vb.y + ((clientY - rect.top) / rect.height) * vb.height,
      };
    },
    [],
  );

  // Clamp viewBox so it stays within bounds
  const clampViewBox = useCallback(
    (vb: ViewBox): ViewBox => {
      const w = Math.min(Math.max(vb.width, initialWidth / 4), initialWidth);
      const h = Math.min(Math.max(vb.height, initialHeight / 4), initialHeight);
      const x = Math.min(Math.max(vb.x, 0), initialWidth - w);
      const y = Math.min(Math.max(vb.y, 0), initialHeight - h);
      return { x, y, width: w, height: h };
    },
    [initialWidth, initialHeight],
  );

  // Attach wheel listener via useEffect with { passive: false } so preventDefault works
  const wheelHandler = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const pt = clientToSVG(e.clientX, e.clientY, viewBox);
      const factor = e.deltaY > 0 ? 1.05 : 0.95;
      const newWidth = viewBox.width * factor;
      const newHeight = viewBox.height * factor;
      const newX = pt.x - (pt.x - viewBox.x) * (newWidth / viewBox.width);
      const newY = pt.y - (pt.y - viewBox.y) * (newHeight / viewBox.height);
      setViewBox(clampViewBox({ x: newX, y: newY, width: newWidth, height: newHeight }));
    },
    [viewBox, clientToSVG, clampViewBox],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener("wheel", wheelHandler, { passive: false });
    return () => svg.removeEventListener("wheel", wheelHandler);
  }, [wheelHandler]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      (e.target as Element).setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size === 2) {
        // Begin pinch: capture initial finger distance & midpoint
        const pts = [...pointers.current.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const cx = (pts[0].x + pts[1].x) / 2;
        const cy = (pts[0].y + pts[1].y) / 2;
        pinchStart.current = { dist: dist || 1, centerSVG: clientToSVG(cx, cy, viewBox), vb: viewBox };
        panStart.current = null;
        setIsPanning(false);
      } else if (pointers.current.size === 1 && isZoomed) {
        // Single finger pans when zoomed in
        panStart.current = { x: e.clientX, y: e.clientY, vbX: viewBox.x, vbY: viewBox.y };
        setIsPanning(true);
      }
    },
    [viewBox, isZoomed, clientToSVG],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();

      // Pinch-to-zoom with two fingers
      if (pointers.current.size >= 2 && pinchStart.current) {
        const pts = [...pointers.current.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const cx = (pts[0].x + pts[1].x) / 2;
        const cy = (pts[0].y + pts[1].y) / 2;
        const ratio = dist / pinchStart.current.dist;
        const newWidth = pinchStart.current.vb.width / ratio;
        const newHeight = pinchStart.current.vb.height / ratio;
        // Keep the SVG point under the initial midpoint anchored to the current midpoint
        const fx = (cx - rect.left) / rect.width;
        const fy = (cy - rect.top) / rect.height;
        setViewBox(
          clampViewBox({
            x: pinchStart.current.centerSVG.x - fx * newWidth,
            y: pinchStart.current.centerSVG.y - fy * newHeight,
            width: newWidth,
            height: newHeight,
          }),
        );
        return;
      }

      // Single-finger / mouse pan
      if (panStart.current) {
        const scaleX = viewBox.width / rect.width;
        const scaleY = viewBox.height / rect.height;
        const dx = (e.clientX - panStart.current.x) * scaleX;
        const dy = (e.clientY - panStart.current.y) * scaleY;
        setViewBox(
          clampViewBox({
            x: panStart.current.vbX - dx,
            y: panStart.current.vbY - dy,
            width: viewBox.width,
            height: viewBox.height,
          }),
        );
      }
    },
    [viewBox, clampViewBox],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) {
      panStart.current = null;
      setIsPanning(false);
    }
  }, []);

  const onDoubleClick = useCallback(() => {
    setViewBox({ x: 0, y: 0, width: initialWidth, height: initialHeight });
  }, [initialWidth, initialHeight]);

  return {
    svgRef,
    viewBox,
    isZoomed,
    isPanning,
    reset: onDoubleClick,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onDoubleClick,
    },
  };
}

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
  const { svgRef, viewBox: vb, isZoomed, isPanning, reset, handlers } = usePanZoom(SVG_WIDTH, SVG_HEIGHT);

  const toggleButton = (side: SideKey, label: string) => {
    const isDisabled = !!disabledSides?.[side];
    return (
      <button
        type="button"
        onClick={() => onToggleSide!(side)}
        aria-pressed={!isDisabled}
        className={cn(
          "min-h-11 flex-1 rounded border px-3 text-xs transition-colors sm:min-h-8 sm:flex-none",
          isDisabled
            ? "bg-muted text-muted-foreground border-dashed line-through"
            : "bg-background text-foreground border-border hover:bg-accent",
        )}
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
      <CardContent className="px-0">
        <div className="flex flex-col gap-2">
          {showToggles && (
            <div className="flex flex-wrap items-center gap-1.5 px-4">
              <span className="mr-0.5 text-xs text-muted-foreground">Kanten:</span>
              {toggleButton("top", "Oben")}
              {toggleButton("bottom", "Unten")}
              {toggleButton("left", "Links")}
              {toggleButton("right", "Rechts")}
            </div>
          )}
          <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
            className="w-full rounded-md border bg-white select-none"
            style={{
              maxHeight: 400,
              cursor: isZoomed ? (isPanning ? "grabbing" : "grab") : "default",
              touchAction: "none",
            }}
            {...handlers}
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
            {isZoomed && (
              <button
                type="button"
                onClick={reset}
                className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border bg-background/90 px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Zurücksetzen
              </button>
            )}
          </div>
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
          fill="rgba(59,130,246,0.08)"
          stroke="#3b82f6"
          strokeWidth="1.5"
        />
      ))}

      {/* Bore hole summary */}
      {calculation.boreHolePositions.length > 0 && (
        <text
          x={offsetX + scaledW / 2}
          y={offsetY + scaledH + 35}
          textAnchor="middle"
          fontSize="10"
          fill="#3b82f6"
        >
          {calculation.boreHolePositions.length} Bohrung{calculation.boreHolePositions.length !== 1 ? "en" : ""} Ø{calculation.boreHolePositions[0].diameter} mm
        </text>
      )}

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

      {/* Horizontal segment distances (top) – single label when all equal */}
      {hasHSegments &&
        (() => {
          const segMms = sortedX.slice(0, -1).map((x, i) => sortedX[i + 1] - x);
          const allEqual = segMms.every((v) => Math.abs(v - segMms[0]) <= 1);
          if (allEqual) {
            const count = segMms.length;
            const exactMm = Math.round(width / count);
            const midIndex = Math.floor(count / 2);
            const midLeft = offsetX + sortedX[midIndex] * scale;
            const midRight = offsetX + sortedX[midIndex + 1] * scale;
            return (
              <DimensionLabel
                x1={midLeft}
                y1={offsetY - 15}
                x2={midRight}
                y2={offsetY - 15}
                text={count > 1 ? `${count}x ${exactMm} mm` : `${exactMm} mm`}
                tooltip={`${count} Segment${count > 1 ? "e" : ""} à ${exactMm} mm`}
              />
            );
          }
          // Fallback: staggered labels for unequal segments
          const hSegPx = segMms.map((mm) => mm * scale);
          const hStagger = computeStaggerLevels(hSegPx);
          return sortedX.slice(0, -1).map((x, i) => {
            const nextX = sortedX[i + 1];
            const { level, abbreviate } = hStagger[i];
            const baseY = offsetY - 15;
            const labelY = baseY - level * STAGGER_STEP;
            const segMm = segMms[i];
            const displayText = abbreviate ? `${segMm}` : `${segMm} mm`;
            const sx = offsetX + x * scale;
            const ex = offsetX + nextX * scale;
            return (
              <g key={`hseg-${i}`}>
                {level > 0 && (
                  <line
                    x1={(sx + ex) / 2}
                    y1={baseY}
                    x2={(sx + ex) / 2}
                    y2={labelY}
                    stroke="#999"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                )}
                <DimensionLabel
                  x1={sx}
                  y1={labelY}
                  x2={ex}
                  y2={labelY}
                  text={displayText}
                  tooltip={`${segMm} mm`}
                />
              </g>
            );
          });
        })()}

      {/* Vertical segment distances (left) – single label when all equal */}
      {hasVSegments &&
        (() => {
          const segMms = sortedY.slice(0, -1).map((y, i) => sortedY[i + 1] - y);
          const allEqual = segMms.every((v) => Math.abs(v - segMms[0]) <= 1);
          if (allEqual) {
            const count = segMms.length;
            const exactMm = Math.round(height / count);
            const midIndex = Math.floor(count / 2);
            const midTop = offsetY + sortedY[midIndex] * scale;
            const midBot = offsetY + sortedY[midIndex + 1] * scale;
            return (
              <DimensionLabel
                x1={offsetX - 15}
                y1={midTop}
                x2={offsetX - 15}
                y2={midBot}
                text={count > 1 ? `${count}x ${exactMm} mm` : `${exactMm} mm`}
                tooltip={`${count} Segment${count > 1 ? "e" : ""} à ${exactMm} mm`}
                vertical
              />
            );
          }
          // Fallback: staggered labels for unequal segments
          const vSegPx = segMms.map((mm) => mm * scale);
          const vStagger = computeStaggerLevels(vSegPx);
          return sortedY.slice(0, -1).map((y, i) => {
            const nextY = sortedY[i + 1];
            const { level, abbreviate } = vStagger[i];
            const baseX = offsetX - 15;
            const labelX = baseX - level * STAGGER_STEP;
            const segMm = segMms[i];
            const displayText = abbreviate ? `${segMm}` : `${segMm} mm`;
            const sy = offsetY + y * scale;
            const ey = offsetY + nextY * scale;
            return (
              <g key={`vseg-${i}`}>
                {level > 0 && (
                  <line
                    x1={baseX}
                    y1={(sy + ey) / 2}
                    x2={labelX}
                    y2={(sy + ey) / 2}
                    stroke="#999"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                )}
                <DimensionLabel
                  x1={labelX}
                  y1={sy}
                  x2={labelX}
                  y2={ey}
                  text={displayText}
                  tooltip={`${segMm} mm`}
                  vertical
                />
              </g>
            );
          });
        })()}
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
          fill="rgba(59,130,246,0.08)"
          stroke="#3b82f6"
          strokeWidth="1.5"
        />
      ))}
      {/* Bore hole summary */}
      {calculation.boreHolePositions.length > 0 && (
        <text
          x={cx}
          y={cy + r + 20}
          textAnchor="middle"
          fontSize="10"
          fill="#3b82f6"
        >
          {calculation.boreHolePositions.length} Bohrung{calculation.boreHolePositions.length !== 1 ? "en" : ""} Ø{calculation.boreHolePositions[0].diameter} mm
        </text>
      )}
      {/* Diameter label */}
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#666" strokeWidth="0.5" strokeDasharray="4,2" />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="11" fill="#666">
        Ø {diameter} mm
      </text>
    </g>
  );
}

/**
 * Compute stagger levels for a list of segment pixel widths.
 * Returns per-segment { level, abbreviate } so labels can be spread across rows.
 */
function computeStaggerLevels(segmentPixelSizes: number[]): { level: number; abbreviate: boolean }[] {
  const MIN_LABEL_PX = 38; // minimum space needed for abbreviated label (e.g. "250")
  const FULL_LABEL_PX = 55; // space needed for full label (e.g. "250 mm")

  const minSegment = Math.min(...segmentPixelSizes);
  const numLevels = minSegment < MIN_LABEL_PX ? 3 : minSegment < FULL_LABEL_PX ? 2 : 1;

  return segmentPixelSizes.map((px, i) => ({
    level: numLevels > 1 ? i % numLevels : 0,
    abbreviate: px < FULL_LABEL_PX,
  }));
}

const STAGGER_STEP = 17; // px between stagger levels

function DimensionLabel({
  x1,
  y1,
  x2,
  y2,
  text,
  vertical,
  tooltip,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  text: string;
  vertical?: boolean;
  tooltip?: string;
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
        <title>{tooltip ?? text}</title>
        {text}
      </text>
    </g>
  );
}
