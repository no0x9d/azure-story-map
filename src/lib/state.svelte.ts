import { createContext } from "svelte";

export const [getLayoutContext, setLayoutContext] = createContext<{
  isHorizontal: boolean;
}>();
