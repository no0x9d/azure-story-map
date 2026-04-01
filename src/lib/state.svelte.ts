import { createContext } from 'svelte';
import type { FilterState } from '$lib/stores/filter-state.svelte';
import type { CanvasState } from '$lib/stores/canvas-state.svelte';

export const [getLayoutContext, setLayoutContext] = createContext<{
  isHorizontal: boolean;
}>();

export const [getCanvasContext, setCanvasContext] = createContext<{
  toggleCollapseNode: (nodeId: string) => void;
  isCollapsed: (nodeId: string) => boolean;
  getChildCount: (nodeId: string) => number;
}>();

/** Shared app-level context set in the root layout and available to all routes */
export const [getAppContext, setAppContext] = createContext<{
  filterState: FilterState;
  canvas: CanvasState;
  layout: { isHorizontal: boolean };
  azureBaseUrl: string | null;
  hasToken: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleImportState: (state: any) => void;
  refresh: () => void;
}>();
