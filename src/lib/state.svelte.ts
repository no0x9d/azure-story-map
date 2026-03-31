import { createContext } from 'svelte';

export const [getLayoutContext, setLayoutContext] = createContext<{
  isHorizontal: boolean;
}>();

export const [getCanvasContext, setCanvasContext] = createContext<{
  toggleCollapseNode: (nodeId: string) => void;
  isCollapsed: (nodeId: string) => boolean;
  getChildCount: (nodeId: string) => number;
}>();
