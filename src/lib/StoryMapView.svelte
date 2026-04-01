<script lang="ts">
  import { Background, Controls, MiniMap, Panel, SvelteFlow } from '@xyflow/svelte';
  import StoryCard from '$lib/StoryCard.svelte';
  import SaveLayoutDialog, { type SavedState } from '$lib/SaveLayoutDialog.svelte';
  import Toolbar from '$lib/Toolbar.svelte';
  import HorizontalIcon from '~icons/material-symbols/align-horizontal-center';
  import VerticalIcon from '~icons/material-symbols/align-vertical-center';
  import SettingsIcon from '~icons/material-symbols/settings';
  import type { CanvasState } from '$lib/stores/canvas-state.svelte';
  import type { FilterState } from '$lib/stores/filter-state.svelte';
  import '@xyflow/svelte/dist/style.css';

  let {
    canvas,
    filterState,
    layout,
    onrefresh,
    onimportstate
  }: {
    canvas: CanvasState;
    filterState: FilterState;
    layout: { isHorizontal: boolean };
    onrefresh: () => void;
    onimportstate: (state: SavedState) => void;
  } = $props();

  const nodeTypes = {
    storyCard: StoryCard
  };

  let saveLayoutOpen = $state(false);
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
      <Toolbar {filterState} {onrefresh}>
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
      <a href="/settings" class="rounded outline p-1 bg-white block" title="Settings"
        ><SettingsIcon /></a
      >
    </Panel>
  </SvelteFlow>
</div>
