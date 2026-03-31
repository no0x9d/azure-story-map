<script lang="ts">
  import type { Node, Edge } from '$lib/types';
  import type { FilterState } from '$lib/stores/filter-state.svelte';
  import GanttView from '$lib/GanttView.svelte';
  import SettingsDialog from '$lib/SettingsDialog.svelte';
  import Toolbar from '$lib/Toolbar.svelte';

  let {
    filterState,
    filteredNodes,
    deletedNodeIds,
    graphEdges,
    onrefresh,
    onviewmodechange
  }: {
    filterState: FilterState;
    filteredNodes: Node[];
    deletedNodeIds: Set<string>;
    graphEdges: Edge[];
    onrefresh: () => void;
    onviewmodechange: (mode: 'storymap' | 'gantt') => void;
  } = $props();

  let settingsOpen = $state(false);
</script>

<div style:height="100vh" class="flex flex-col">
  <div class="flex items-center gap-1 p-2 bg-white border-b">
    <Toolbar {filterState} {onrefresh} viewMode="gantt" {onviewmodechange} />
    <div class="ml-auto">
      <SettingsDialog bind:open={settingsOpen} />
    </div>
  </div>
  <div class="flex-1 min-h-0">
    <GanttView
      nodes={filteredNodes.filter((n) => !deletedNodeIds.has(n.id.toString(10)))}
      edges={graphEdges}
    />
  </div>
</div>
