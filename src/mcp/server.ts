import { FastMCP } from "fastmcp";
import { z } from "zod";
import {
  calculateRectangularOpening,
  calculateCircularOpening,
  suggestBladeDiameter,
} from "../lib/calculations";
import { estimateRectangularTime, estimateDrillingTime } from "../lib/calculations/time-estimation";
import { MATERIAL_DENSITY, STANDARD_BLADE_SIZES } from "../lib/calculations/common";
import { recalculateFromEdit } from "../lib/calculations/recalculate";
import { positionToUrlPos, encodeState } from "../lib/url-state";
import type { UrlState } from "../lib/url-state";
import { TEMPLATES } from "../lib/templates";
import { MATERIAL_LABELS } from "../types";
import type { MaterialType, DisabledSides } from "../types";

const MaterialEnum = z.enum(["beton", "stahlbeton", "mauerwerk", "kalksandstein", "ziegel", "naturstein"]);

const server = new FastMCP({
  name: "dimacon-planung",
  version: "1.0.0",
});

// --- Tool 1: calculate_rectangular_opening ---

server.addTool({
  name: "calculate_rectangular_opening",
  description:
    "Calculate cuts, bore hole positions, time estimate, and weight for a rectangular wall opening (Wanddurchbruch). " +
    "Returns detailed cutting plan including number of cuts, linear meters, segmentation, bore holes, and SVG-ready cut lines.",
  parameters: z.object({
    width_mm: z.number().positive().describe("Opening width in mm"),
    height_mm: z.number().positive().describe("Opening height in mm"),
    wall_thickness_mm: z.number().positive().describe("Wall thickness in mm"),
    material: MaterialEnum.describe("Wall material type"),
    blade_diameter_mm: z.number().positive().optional().describe("Blade diameter in mm. If omitted, automatically suggested based on wall thickness."),
    max_segment_weight_kg: z.number().positive().optional().describe("Maximum weight per segment in kg (default: 150). Triggers segmentation if exceeded."),
    disabled_sides: z.object({
      top: z.boolean().optional(),
      bottom: z.boolean().optional(),
      left: z.boolean().optional(),
      right: z.boolean().optional(),
    }).optional().describe("Sides where no cut is needed (e.g. floor opening has no bottom cut)"),
    einstechtiefe: z.enum(["maximal", "wandstaerke"]).optional().describe("Plunge depth variant: 'maximal' (Variant A, 1 bore/corner) or 'wandstaerke' (Variant B, 2 bores/corner). Default: maximal"),
    bore_hole_diameter_mm: z.number().positive().optional().describe("Bore hole diameter in mm (default: 200)"),
  }),
  execute: async (args) => {
    const bladeDiameter = args.blade_diameter_mm ?? suggestBladeDiameter(args.wall_thickness_mm);
    const result = calculateRectangularOpening(
      args.width_mm,
      args.height_mm,
      args.wall_thickness_mm,
      args.material as MaterialType,
      bladeDiameter,
      args.max_segment_weight_kg,
      args.disabled_sides as DisabledSides | undefined,
      args.einstechtiefe ?? "maximal",
      args.bore_hole_diameter_mm ?? 200
    );

    return JSON.stringify(result, null, 2);
  },
});

// --- Tool 2: calculate_circular_opening ---

server.addTool({
  name: "calculate_circular_opening",
  description:
    "Calculate drilling plan for a circular wall opening (Kernbohrung). " +
    "For diameters <= 500mm uses a single core drill; larger openings use multiple overlapping holes.",
  parameters: z.object({
    diameter_mm: z.number().positive().describe("Opening diameter in mm"),
    wall_thickness_mm: z.number().positive().describe("Wall thickness in mm"),
    material: MaterialEnum.describe("Wall material type"),
  }),
  execute: async (args) => {
    const result = calculateCircularOpening(
      args.diameter_mm,
      args.wall_thickness_mm,
      args.material as MaterialType
    );

    return JSON.stringify(result, null, 2);
  },
});

// --- Tool 3: suggest_blade_diameter ---

server.addTool({
  name: "suggest_blade_diameter",
  description:
    "Suggest the optimal blade diameter for a given wall thickness. " +
    "Returns the smallest standard blade size that can cut through the wall. " +
    `Available standard sizes: ${STANDARD_BLADE_SIZES.join(", ")} mm.`,
  parameters: z.object({
    wall_thickness_mm: z.number().positive().describe("Wall thickness in mm"),
  }),
  execute: async (args) => {
    const suggested = suggestBladeDiameter(args.wall_thickness_mm);
    const maxCutDepth = (suggested - 160) / 2;
    const needsBothSides = args.wall_thickness_mm > maxCutDepth;

    return JSON.stringify({
      wall_thickness_mm: args.wall_thickness_mm,
      suggested_blade_diameter_mm: suggested,
      max_cut_depth_mm: maxCutDepth,
      cut_from_both_sides: needsBothSides,
    }, null, 2);
  },
});

// --- Tool 4: estimate_time ---

server.addTool({
  name: "estimate_time",
  description:
    "Estimate working time based on cut surface area and number of bore holes. " +
    "Use 'rectangular' mode for wall saw cuts, 'circular' mode for core drilling.",
  parameters: z.object({
    mode: z.enum(["rectangular", "circular"]).describe("'rectangular' for wall saw cuts, 'circular' for core drilling"),
    cut_surface_area_m2: z.number().nonnegative().optional().describe("Total cut surface area in m² (rectangular mode)"),
    total_cuts: z.number().nonnegative().optional().describe("Number of individual cuts (rectangular mode)"),
    bore_holes: z.number().nonnegative().optional().describe("Number of bore holes"),
  }),
  execute: async (args) => {
    let minutes: number;

    if (args.mode === "rectangular") {
      minutes = estimateRectangularTime(
        args.cut_surface_area_m2 ?? 0,
        args.total_cuts ?? 0,
        args.bore_holes ?? 0
      );
    } else {
      minutes = estimateDrillingTime(args.bore_holes ?? 1);
    }

    return JSON.stringify({
      estimated_minutes: minutes,
      estimated_hours: Math.round((minutes / 60) * 100) / 100,
    }, null, 2);
  },
});

// --- Tool 5: recalculate_opening ---

server.addTool({
  name: "recalculate_opening",
  description:
    "Recalculate a rectangular wall opening after manually editing cut counts or bore holes. " +
    "First calculates the base result from the given dimensions, then applies your overrides " +
    "(horizontal_cuts, vertical_cuts, corner_bore_holes) and recalculates all derived values " +
    "(totalLinearMeters, segments, segmentWeight, cutSurfaceArea, estimatedMinutes, cutLines, boreHolePositions). " +
    "Use this after calculate_rectangular_opening when you want to adjust the cutting plan.",
  parameters: z.object({
    width_mm: z.number().positive().describe("Opening width in mm"),
    height_mm: z.number().positive().describe("Opening height in mm"),
    wall_thickness_mm: z.number().positive().describe("Wall thickness in mm"),
    material: MaterialEnum.describe("Wall material type"),
    blade_diameter_mm: z.number().positive().optional().describe("Blade diameter in mm (auto if omitted)"),
    max_segment_weight_kg: z.number().positive().optional().describe("Max segment weight in kg (default: 150)"),
    disabled_sides: z.object({
      top: z.boolean().optional(),
      bottom: z.boolean().optional(),
      left: z.boolean().optional(),
      right: z.boolean().optional(),
    }).optional().describe("Sides where no cut is needed"),
    einstechtiefe: z.enum(["maximal", "wandstaerke"]).optional().describe("Plunge depth variant (default: maximal)"),
    bore_hole_diameter_mm: z.number().positive().optional().describe("Bore hole diameter in mm (default: 200)"),
    // Overrides — at least one should be provided
    horizontal_cuts: z.number().int().min(2).optional().describe("Override: number of horizontal cuts (min 2 = top + bottom)"),
    vertical_cuts: z.number().int().min(2).optional().describe("Override: number of vertical cuts (min 2 = left + right)"),
    corner_bore_holes: z.number().int().min(0).optional().describe("Override: number of bore holes"),
  }),
  execute: async (args) => {
    const bladeDiameter = args.blade_diameter_mm ?? suggestBladeDiameter(args.wall_thickness_mm);
    const ds = args.disabled_sides as DisabledSides | undefined;

    // 1. Base calculation
    let result = calculateRectangularOpening(
      args.width_mm,
      args.height_mm,
      args.wall_thickness_mm,
      args.material as MaterialType,
      bladeDiameter,
      args.max_segment_weight_kg,
      ds,
      args.einstechtiefe ?? "maximal",
      args.bore_hole_diameter_mm ?? 200
    );

    const dimensions = {
      width: args.width_mm,
      height: args.height_mm,
      wallThickness: args.wall_thickness_mm,
      bladeDiameter,
      maxSegmentWeight: args.max_segment_weight_kg ?? 150,
      disabledSides: ds,
      boreHoleDiameter: args.bore_hole_diameter_mm ?? 200,
    };

    // 2. Apply overrides sequentially
    if (args.horizontal_cuts !== undefined) {
      result = recalculateFromEdit(result, "horizontalCuts", args.horizontal_cuts, dimensions, "rectangular");
    }
    if (args.vertical_cuts !== undefined) {
      result = recalculateFromEdit(result, "verticalCuts", args.vertical_cuts, dimensions, "rectangular");
    }
    if (args.corner_bore_holes !== undefined) {
      result = recalculateFromEdit(result, "cornerBoreHoles", args.corner_bore_holes, dimensions, "rectangular");
    }

    return JSON.stringify(result, null, 2);
  },
});

// --- Tool 6: list_materials ---

server.addTool({
  name: "list_materials",
  description: "List all available wall material types with their densities (kg/m³) and German labels.",
  parameters: z.object({}),
  execute: async () => {
    const materials = Object.entries(MATERIAL_DENSITY).map(([key, density]) => ({
      id: key,
      label: MATERIAL_LABELS[key as MaterialType],
      density_kg_m3: density,
    }));

    return JSON.stringify(materials, null, 2);
  },
});

// --- Tool 6: list_templates ---

server.addTool({
  name: "list_templates",
  description:
    "List predefined opening templates (standard door, window, concrete breakthrough, etc.) with their default dimensions and materials.",
  parameters: z.object({}),
  execute: async () => {
    const templates = TEMPLATES.map((t) => ({
      label: t.label,
      description: t.description,
      material: t.material,
      dimensions: t.dimensions,
    }));

    return JSON.stringify(templates, null, 2);
  },
});

// --- Tool 8: export_url_json ---

server.addTool({
  name: "export_url_json",
  description:
    "Calculate one or more wall openings and export as the compact URL-state JSON format " +
    "(same format that is base64-encoded in the webapp URL). " +
    "Returns both the JSON and the base64-encoded string for direct use as URL hash.",
  parameters: z.object({
    name: z.string().describe("Job/project name"),
    positions: z.array(z.object({
      label: z.string().describe("Position label (e.g. 'Türöffnung EG')"),
      shape: z.enum(["rectangular", "circular"]).describe("Opening shape"),
      material: MaterialEnum.describe("Wall material type"),
      wall_thickness_mm: z.number().positive().describe("Wall thickness in mm"),
      width_mm: z.number().positive().optional().describe("Opening width in mm (rectangular only)"),
      height_mm: z.number().positive().optional().describe("Opening height in mm (rectangular only)"),
      diameter_mm: z.number().positive().optional().describe("Opening diameter in mm (circular only)"),
      blade_diameter_mm: z.number().positive().optional().describe("Blade diameter in mm (auto if omitted)"),
      max_segment_weight_kg: z.number().positive().optional().describe("Max segment weight in kg (default: 150)"),
      disabled_sides: z.object({
        top: z.boolean().optional(),
        bottom: z.boolean().optional(),
        left: z.boolean().optional(),
        right: z.boolean().optional(),
      }).optional(),
      einstechtiefe: z.enum(["maximal", "wandstaerke"]).optional(),
      bore_hole_diameter_mm: z.number().positive().optional(),
      notes: z.string().optional().describe("Optional notes for this position"),
    })).describe("Array of wall opening positions to calculate and export"),
  }),
  execute: async (args) => {
    const positions = args.positions.map((pos, i) => {
      const bladeDiameter = pos.blade_diameter_mm ?? suggestBladeDiameter(pos.wall_thickness_mm);
      const calculation = pos.shape === "circular"
        ? calculateCircularOpening(pos.diameter_mm ?? 0, pos.wall_thickness_mm, pos.material as MaterialType)
        : calculateRectangularOpening(
            pos.width_mm ?? 0,
            pos.height_mm ?? 0,
            pos.wall_thickness_mm,
            pos.material as MaterialType,
            bladeDiameter,
            pos.max_segment_weight_kg,
            pos.disabled_sides as DisabledSides | undefined,
            pos.einstechtiefe ?? "maximal",
            pos.bore_hole_diameter_mm ?? 200
          );

      return {
        id: `pos-${i + 1}`,
        type: "wanddurchbruch" as const,
        label: pos.label,
        shape: pos.shape as "rectangular" | "circular",
        dimensions: {
          width: pos.width_mm,
          height: pos.height_mm,
          wallThickness: pos.wall_thickness_mm,
          diameter: pos.diameter_mm,
          bladeDiameter,
          maxSegmentWeight: pos.max_segment_weight_kg ?? 150,
          disabledSides: pos.disabled_sides,
          einstechtiefe: pos.einstechtiefe,
          boreHoleDiameter: pos.bore_hole_diameter_mm,
        },
        material: pos.material as MaterialType,
        calculation,
        notes: pos.notes ?? "",
        sortOrder: i,
      };
    });

    const urlState: UrlState = {
      n: args.name,
      p: positions.map(positionToUrlPos),
    };

    const encoded = encodeState(urlState);

    const url = `https://dimacon-ai-apps.netlify.app/?s=${encoded}`;

    return JSON.stringify({
      url_state: urlState,
      encoded: encoded,
      url: url,
    }, null, 2);
  },
});

server.start({
  transportType: "stdio",
});
