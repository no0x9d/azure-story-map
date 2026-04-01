<script lang="ts">
  import { Background, Controls, MiniMap, Panel, SvelteFlow } from '@xyflow/svelte';
  import StoryCard from '$lib/StoryCard.svelte';
  import SaveLayoutDialog, { type SavedState } from '$lib/SaveLayoutDialog.svelte';
  import SettingsDialog from '$lib/SettingsDialog.svelte';
  import Toolbar from '$lib/Toolbar.svelte';
  import HorizontalIcon from '~icons/material-symbols/align-horizontal-center';
  import VerticalIcon from '~icons/material-symbols/align-vertical-center';
  import type { CanvasState } from '$lib/stores/canvas-state.svelte';
  import type { FilterState } from '$lib/stores/filter-state.svelte';
  import '@xyflow/svelte/dist/style.css';

  let {
    canvas,
    filterState,
    layout,
    azureBaseUrl,
    hasToken,
    onrefresh,
    onviewmodechange,
    onimportstate
  }: {
    canvas: CanvasState;
    filterState: FilterState;
    layout: { isHorizontal: boolean };
    azureBaseUrl: string | null;
    hasToken: boolean;
    onrefresh: () => void;
    onviewmodechange: (mode: 'storymap' | 'gantt') => void;
    onimportstate: (state: SavedState) => void;
  } = $props();

  const nodeTypes = {
    storyCard: StoryCard
  };

  let saveLayoutOpen = $state(false);
  let settingsOpen = $state(false);
</script>

<div style:height="100vh">
  <SvelteFlow
    bind:nodes={canvas.nodes}
    bind:edges={canvas.edges}
    {nodeTypes}
    minZoom={0.1}
    fitView
    onnodedragstop={() => canvas.onNodeDragStop()}
    ondelete={(event) => canvas.handleDelete(event)}
  >
    <Controls />
    <Background />
    <MiniMap />
    <Panel position="top-left">
      <Toolbar {filterState} {onrefresh} viewMode="storymap" {onviewmodechange}>
        <SaveLayoutDialog
          bind:open={saveLayoutOpen}
          nodes={canvas.nodes}
          {layout}
          visibleEdgeTypes={filterState.visibleEdgeTypes}
          visibleStatesByType={filterState.visibleStatesByType}
          onimport={onimportstate}
        />
        <button
          class="ml-3 rounded outline p-1 bg-white"
          title="Layout Top to Bottom"
          onclick={() => canvas.onLayout('TB')}
        >
          <HorizontalIcon />
        </button>
        <button
          class="rounded outline p-1 bg-white"
          title="Layout Left to Right"
          onclick={() => canvas.onLayout('LR')}
        >
          <VerticalIcon />
        </button>
      </Toolbar>
    </Panel>
    <Panel position="top-right">
      <SettingsDialog bind:open={settingsOpen} {azureBaseUrl} {hasToken} />
    </Panel>
  </SvelteFlow>
</div>
