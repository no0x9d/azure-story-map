<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { getLayoutContext, getCanvasContext } from './state.svelte';
  import { getStateColor, getTypeColor } from './colors';
  import StoryDetailDialog from './StoryDetailDialog.svelte';
  import type { StoryData } from '$lib/types';
  import CalendarIcon from '~icons/material-symbols/calendar-today';
  import NotesIcon from '~icons/material-symbols/notes';
  import ExpandLessIcon from '~icons/material-symbols/expand-less';
  import ExpandMoreIcon from '~icons/material-symbols/expand-more';

  let { data, selected }: { data: StoryData; selected: boolean } = $props();
  let isDetailOpen = $state(false);
  let layout = getLayoutContext();
  let canvasCtx = getCanvasContext();

  let nodeId = $derived(data.id.toString(10));
  let childCount = $derived(canvasCtx.getChildCount(nodeId));
  let collapsed = $derived(canvasCtx.isCollapsed(nodeId));

  function openDetail(event: Event) {
    event.stopPropagation();
    isDetailOpen = true;
  }

  function handleDblClick(event: MouseEvent) {
    if (childCount > 0) {
      event.stopPropagation();
      canvasCtx.toggleCollapseNode(nodeId);
    }
  }
</script>

<div
  class="bg-white border border-l-[6px] border-gray-200 p-3 min-w-[240px] max-w-[320px] shadow-sm transition-all duration-200 ease-in-out
    hover:shadow-md hover:-translate-y-0.5
    {selected
    ? 'border-t-blue-500 border-r-blue-500 border-b-blue-500 ring-[3px] ring-blue-500/30'
    : ''}"
  style="border-left-color: {getTypeColor(data.type)}{childCount > 0 ? '; cursor: pointer' : ''}"
  ondblclick={handleDblClick}
  role="button"
  tabindex={0}
  aria-expanded={childCount > 0 ? !collapsed : undefined}
>
  <Handle type="target" position={layout.isHorizontal ? Position.Left : Position.Top} />

  <div class="flex justify-between items-center mb-2">
    <a href={data.webUrl} target="_blank" class="text-xs font-semibold text-gray-500">#{data.id}</a>
    {#if data.estimationStoryPoints}
      <span class="text-[11px] font-semibold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full"
        >{data.estimationStoryPoints} SP</span
      >
    {/if}
    {#if data.estimationEffort}
      <span class="text-[11px] font-semibold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full"
        >{data.estimationEffort}</span
      >
    {/if}
  </div>

  <div class="text-sm font-medium text-gray-900 leading-[1.4] mb-2.5 break-words">{data.title}</div>

  <div class="flex justify-between items-center gap-2">
    <span
      class="text-[11px] font-semibold text-white px-2 py-[3px] rounded uppercase tracking-[0.5px]"
      style="background-color: {getStateColor(data.state)}"
    >
      {data.state}
    </span>
    {#if data.type}
      <span class="text-[11px] text-gray-500 font-medium">{data.type}</span>
    {/if}
  </div>

  {#if data.iterationPath}
    <div class="flex items-center gap-1 mt-2 text-[11px] text-gray-500 font-medium">
      <CalendarIcon class="w-3 h-3 shrink-0" />
      <span>{data.iterationPath}</span>
    </div>
  {/if}

  {#if data.description || data.acceptanceCriteria}
    <button
      class="flex items-center gap-1.5 w-full mt-2.5 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md cursor-pointer text-xs font-medium text-gray-700 transition-all duration-200
        hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
      onclick={openDetail}
      type="button"
    >
      <NotesIcon class="w-3.5 h-3.5" />
      <span>Details</span>
    </button>
  {/if}

  {#if childCount > 0}
    <div
      class="flex items-center justify-center gap-1 mt-2 pt-1.5 border-t border-gray-100 text-[11px] font-medium transition-colors duration-150
        {collapsed ? 'text-amber-600' : 'text-gray-400'}"
    >
      {#if collapsed}
        <ExpandMoreIcon class="w-3.5 h-3.5" />
        <span>{childCount} {childCount === 1 ? 'child' : 'children'} hidden</span>
      {:else}
        <ExpandLessIcon class="w-3.5 h-3.5" />
        <span>{childCount}</span>
      {/if}
    </div>
  {/if}

  <StoryDetailDialog {data} bind:open={isDetailOpen} />

  <Handle type="source" position={layout.isHorizontal ? Position.Right : Position.Bottom} />
</div>
