<script lang="ts">
  import { getAppContext } from '$lib/state.svelte';
  import GanttViewContainer from '$lib/GanttViewContainer.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const { canvas, filterState, refresh } = getAppContext();

  let graphEdges = $derived(data.graph.edges);
</script>

<GanttViewContainer
  {filterState}
  filteredNodes={filterState.filteredNodes}
  deletedNodeIds={canvas.deletedNodeIds}
  hiddenNodeIds={canvas.hiddenNodeIds}
  {graphEdges}
  onrefresh={refresh}
/>
