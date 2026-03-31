<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { FilterState } from '$lib/stores/filter-state.svelte';
  import ConfigureIssuesDialog from '$lib/ConfigureIssuesDialog.svelte';
  import VisualizationFilter from '$lib/VisualizationFilter.svelte';
  import RefreshIcon from '~icons/material-symbols/refresh';
  import StoryMapIcon from '~icons/material-symbols/account-tree';
  import GanttIcon from '~icons/material-symbols/view-timeline';

  let {
    filterState,
    onrefresh,
    viewMode,
    onviewmodechange,
    children
  }: {
    filterState: FilterState;
    onrefresh: () => void;
    viewMode: 'storymap' | 'gantt';
    onviewmodechange: (mode: 'storymap' | 'gantt') => void;
    children?: Snippet;
  } = $props();

  let configureIssuesOpen = $state(false);

  let switchTitle = $derived(
    viewMode === 'storymap' ? 'Switch to Gantt View' : 'Switch to Story Map View'
  );

  function handleViewSwitch() {
    onviewmodechange(viewMode === 'storymap' ? 'gantt' : 'storymap');
  }
</script>

<ConfigureIssuesDialog bind:open={configureIssuesOpen} />
<button class="rounded outline p-1 bg-white" title="refresh data" onclick={onrefresh}>
  <RefreshIcon />
</button>
{#if children}
  {@render children()}
{/if}
<VisualizationFilter
  edgeTypes={filterState.allEdgeTypes}
  visibleEdgeTypes={filterState.visibleEdgeTypes}
  statesByType={filterState.statesByType}
  visibleStatesByType={filterState.visibleStatesByType}
  ontoggle={(edgeType) => filterState.toggleEdgeType(edgeType)}
  ontoggleIssueType={(issueType) => filterState.toggleIssueType(issueType)}
  ontoggleIssueState={(issueType, issueState) =>
    filterState.toggleIssueState(issueType, issueState)}
/>
<button
  class="ml-3 rounded outline p-1 bg-white font-semibold"
  title={switchTitle}
  onclick={handleViewSwitch}
>
  {#if viewMode === 'storymap'}
    <GanttIcon />
  {:else}
    <StoryMapIcon />
  {/if}
</button>
