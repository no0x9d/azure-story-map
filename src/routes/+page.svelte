<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { setLayoutContext, setCanvasContext } from '$lib/state.svelte.js';
  import type { SavedState } from '$lib/SaveLayoutDialog.svelte';
  import StoryMapView from '$lib/StoryMapView.svelte';
  import GanttViewContainer from '$lib/GanttViewContainer.svelte';
  import { FilterState } from '$lib/stores/filter-state.svelte';
  import { CanvasState } from '$lib/stores/canvas-state.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let graph = $derived(data.graph);

  let layout = $state({ isHorizontal: false });
  setLayoutContext(layout);

  // View mode: story map or gantt
  let viewMode = $state<'storymap' | 'gantt'>('storymap');

  // Filter state — manages edge type and issue type/state visibility
  const filterState = new FilterState(
    () => graph.nodes,
    () => graph.edges
  );

  // Canvas state — manages SvelteFlow nodes/edges, positions, deletions, layout
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
    // Apply filter selections (non-empty sets prevent the lazy-init effects from overriding)
    if (state.visibleEdgeTypes.length > 0) {
      filterState.visibleEdgeTypes = new Set(state.visibleEdgeTypes);
    }
    if (state.visibleStatesByType && Object.keys(state.visibleStatesByType).length > 0) {
      const map = new Map<string, Set<string>>();
      for (const [type, states] of Object.entries(state.visibleStatesByType)) {
        map.set(type, new Set(states));
      }
      filterState.visibleStatesByType = map;
    }

    // Delegate position/layout import to canvas state
    canvas.handleImportState(state);
  }
</script>

{#if viewMode === 'storymap'}
  <StoryMapView
    {canvas}
    {filterState}
    {layout}
    onrefresh={() => invalidateAll()}
    onviewmodechange={(mode) => (viewMode = mode)}
    onimportstate={handleImportState}
  />
{:else}
  <GanttViewContainer
    {filterState}
    filteredNodes={filterState.filteredNodes}
    deletedNodeIds={canvas.deletedNodeIds}
    graphEdges={graph.edges}
    onrefresh={() => invalidateAll()}
    onviewmodechange={(mode) => (viewMode = mode)}
  />
{/if}
