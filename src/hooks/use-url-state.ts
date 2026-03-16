import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  encodeState,
  decodeState,
  positionToUrlPos,
  urlPosToPosition,
  urlCalcToCalc,
  EMPTY_STATE,
  type UrlState,
} from "@/lib/url-state";
import { calculatePosition } from "@/lib/calculations";
import { generateCutLines } from "@/lib/calculations/rectangular";
import { generateBoreHolePositions } from "@/lib/calculations/ueberschnitt";
import type { Position, CalculationResult } from "@/types";
import type { PositionTemplate } from "@/lib/templates";

function hydratePositions(state: UrlState): Position[] {
  return state.p.map((up, i) => {
    const pos = urlPosToPosition(up, i);

    if (up.c) {
      // Restore saved calculation, regenerate visual arrays
      const stored = urlCalcToCalc(up.c);
      const w = pos.dimensions.width ?? 0;
      const h = pos.dimensions.height ?? 0;
      const ds = pos.dimensions.disabledSides;
      const cutLines = pos.shape === "rectangular"
        ? generateCutLines(w, h, stored.horizontalCuts, stored.verticalCuts, stored.cutFromBothSides, ds)
        : [];
      const boreHolePositions = pos.shape === "rectangular"
        ? generateBoreHolePositions({
            widthMm: w,
            heightMm: h,
            horizontalCuts: stored.horizontalCuts,
            verticalCuts: stored.verticalCuts,
            ueberschnitt: stored.ueberschnitt ?? 0,
            boreHoleDiameter: pos.dimensions.boreHoleDiameter ?? 200,
            disabledSides: ds,
          })
        : [];
      pos.calculation = { ...stored, cutLines, boreHolePositions } as CalculationResult;
    } else {
      // No saved calculation — fresh calc (first time)
      pos.calculation = calculatePosition(pos);
    }

    return pos;
  });
}

export function useUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo<UrlState>(() => {
    const s = searchParams.get("s");
    if (!s) return EMPTY_STATE;
    return decodeState(s) ?? EMPTY_STATE;
  }, [searchParams]);

  const positions = useMemo(() => hydratePositions(state), [state]);

  const editIndex = useMemo<number | "new" | null>(() => {
    const e = searchParams.get("e");
    if (e === null) return null;
    if (e === "new") return "new";
    const idx = parseInt(e, 10);
    return isNaN(idx) ? null : idx;
  }, [searchParams]);

  const updateState = useCallback(
    (newState: UrlState, replace = false) => {
      const params = new URLSearchParams();
      if (newState.n || newState.p.length > 0) {
        params.set("s", encodeState(newState));
      }
      const e = searchParams.get("e");
      if (e !== null && !replace) {
        params.set("e", e);
      }
      setSearchParams(params, { replace });
    },
    [searchParams, setSearchParams]
  );

  const setName = useCallback(
    (name: string) => {
      updateState({ ...state, n: name }, true);
    },
    [state, updateState]
  );

  const addPosition = useCallback(
    (position: Position) => {
      const newState: UrlState = {
        ...state,
        p: [...state.p, positionToUrlPos(position)],
      };
      const params = new URLSearchParams();
      params.set("s", encodeState(newState));
      // Switch to editing the newly created position by index
      params.set("e", String(state.p.length));
      setSearchParams(params, { replace: true });
    },
    [state, setSearchParams]
  );

  const updatePosition = useCallback(
    (index: number, position: Position) => {
      const newP = [...state.p];
      newP[index] = positionToUrlPos(position);
      const newState: UrlState = { ...state, p: newP };
      const params = new URLSearchParams();
      params.set("s", encodeState(newState));
      params.set("e", String(index));
      setSearchParams(params, { replace: true });
    },
    [state, setSearchParams]
  );

  const deletePosition = useCallback(
    (index: number) => {
      const newP = state.p.filter((_, i) => i !== index);
      const newState: UrlState = { ...state, p: newP };
      const params = new URLSearchParams();
      if (newState.n || newState.p.length > 0) {
        params.set("s", encodeState(newState));
      }
      setSearchParams(params);
    },
    [state, setSearchParams]
  );

  const openEditor = useCallback(
    (index: number | "new") => {
      const params = new URLSearchParams(searchParams);
      params.set("e", String(index));
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const closeEditor = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete("e");
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const addPositionFromTemplate = useCallback(
    (template: PositionTemplate) => {
      const position: Position = {
        id: crypto.randomUUID(),
        type: "wanddurchbruch",
        label: template.label,
        shape: "rectangular",
        dimensions: { ...template.dimensions },
        material: template.material,
        calculation: null,
        notes: "",
        sortOrder: state.p.length,
      };
      position.calculation = calculatePosition(position);
      const newState: UrlState = {
        ...state,
        p: [...state.p, positionToUrlPos(position)],
      };
      const params = new URLSearchParams();
      params.set("s", encodeState(newState));
      setSearchParams(params);
    },
    [state, setSearchParams]
  );

  return {
    state,
    name: state.n,
    positions,
    editIndex,
    setName,
    addPosition,
    updatePosition,
    deletePosition,
    openEditor,
    closeEditor,
    addPositionFromTemplate,
  };
}
