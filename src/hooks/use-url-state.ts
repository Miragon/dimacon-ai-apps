import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  encodeState,
  decodeState,
  positionToUrlPos,
  urlPosToPosition,
  EMPTY_STATE,
  type UrlState,
} from "@/lib/url-state";
import { calculatePosition } from "@/lib/calculations";
import type { Position } from "@/types";
import type { PositionTemplate } from "@/lib/templates";

function hydratePositions(state: UrlState): Position[] {
  return state.p.map((up, i) => {
    const pos = urlPosToPosition(up, i);
    // Recalculate from saved hc/vc or fresh
    const calc = calculatePosition(pos);
    // If saved hc/vc differ from auto-calc, use saved values
    if (up.hc != null && up.vc != null) {
      calc.horizontalCuts = up.hc;
      calc.verticalCuts = up.vc;
      calc.totalCuts = up.hc + up.vc;
    }
    pos.calculation = calc;
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
      // Only set s if there's actual data
      if (newState.n || newState.p.length > 0) {
        params.set("s", encodeState(newState));
      }
      // Preserve e param if present and not replacing
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
      // Navigate back to list (remove e param)
      setSearchParams(params);
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
      // Navigate back to list (remove e param)
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
      const calc = calculatePosition(position);
      position.calculation = calc;
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
