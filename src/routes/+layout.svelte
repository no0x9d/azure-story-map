<script lang="ts">
  import './layout.css';
  import type { Snippet } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { invalidateAll } from '$app/navigation';
  import type { LayoutData } from './$types';
  import { FilterState } from '$lib/stores/filter-state.svelte';
  import { CanvasState } from '$lib/stores/canvas-state.svelte';
  import { setLayoutContext, setCanvasContext, setAppContext } from '$lib/state.svelte';
  import type { SavedState } from '$lib/SaveLayoutDialog.svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  let graph = $derived(data.graph);
  let azureBaseUrl = $derived(data.azureBaseUrl ?? null);
  let hasToken = $derived(data.hasToken ?? false);

  let layout = $state({ isHorizontal: false });
  setLayoutContext(layout);

  const filterState = new FilterState(
    () => graph.nodes,
    () => graph.edges
  );

  const canvas = new CanvasState({
    getFilteredNodes: () => filterState.filteredNodes,
    getFilteredEdges: () => filterState.filteredEdges,
    getGraphNodes: () => graph.nodes,
    layout
  });

  setCanvasContext({
    toggleCollapseNode: (nodeId: string) => canvas.toggleCollapseNode(nodeId),
    isCollapsed: (nodeId: string) => canvas.isCollapsed(nodeId),
    getChildCount: (nodeId: string) => canvas.getChildCount(nodeId)
  });

  function handleImportState(state: SavedState) {
    if (state.visibleEdgeTypes.length > 0) {
      filterState.visibleEdgeTypes = new Set(state.visibleEdgeTypes);
    }
    if (state.visibleStatesByType && Object.keys(state.visibleStatesByType).length > 0) {
      const map = new SvelteMap<string, Set<string>>();
      for (const [type, states] of Object.entries(state.visibleStatesByType)) {
        map.set(type, new Set(states));
      }
      filterState.visibleStatesByType = map;
    }
    canvas.handleImportState(state);
  }

  setAppContext({
    filterState,
    canvas,
    layout,
    get azureBaseUrl() {
      return azureBaseUrl;
    },
    get hasToken() {
      return hasToken;
    },
    handleImportState,
    refresh: () => invalidateAll()
  });
</script>

<div class="min-h-screen">
  <main class="box-border">
    {@render children()}
  </main>
</div>
