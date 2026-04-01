<script lang="ts">
  import type { Node, Edge } from '$lib/types';
  import type { FilterState } from '$lib/stores/filter-state.svelte';
  import GanttView from '$lib/GanttView.svelte';
  import Toolbar from '$lib/Toolbar.svelte';
  import SettingsIcon from '~icons/material-symbols/settings';

  let {
    filterState,
    filteredNodes,
    deletedNodeIds,
    hiddenNodeIds,
    graphEdges,
    onrefresh
  }: {
    filterState: FilterState;
    filteredNodes: Node[];
    deletedNodeIds: Set<string>;
    hiddenNodeIds: Set<string>;
    graphEdges: Edge[];
    onrefresh: () => void;
  } = $props();
</script>

<div style:height="100vh" class="flex flex-col">
  <div class="flex items-center gap-1 p-2 bg-white border-b">
    <Toolbar {filterState} {onrefresh} />
    <div class="ml-auto">
      <a href="/settings" class="rounded outline p-1 bg-white block" title="Settings"
        ><SettingsIcon /></a
      >
    </div>
  </div>
  <div class="flex-1 min-h-0">
    <GanttView
      nodes={filteredNodes.filter((n) => {
        const id = n.id.toString(10);
        return !deletedNodeIds.has(id) && !hiddenNodeIds.has(id);
      })}
      edges={graphEdges}
    />
  </div>
</div>
