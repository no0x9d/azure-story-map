<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { getLayoutContext } from './state.svelte';
  import { getStateColor, getTypeColor } from './colors';
  import StoryDetailDialog from './StoryDetailDialog.svelte';
  import type { StoryData } from '$lib/types';

  let { data, selected }: { data: StoryData; selected: boolean } = $props();
  let isDetailOpen = $state(false);
  let layout = getLayoutContext();

  function openDetail(event: Event) {
    event.stopPropagation();
    isDetailOpen = true;
  }
</script>

<div
  class="bg-white border border-l-[6px] border-gray-200 p-3 min-w-[240px] max-w-[320px] shadow-sm transition-all duration-200 ease-in-out
    hover:shadow-md hover:-translate-y-0.5
    {selected
    ? 'border-t-blue-500 border-r-blue-500 border-b-blue-500 ring-[3px] ring-blue-500/30'
    : ''}"
  style="border-left-color: {getTypeColor(data.type)}"
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
      <svg class="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7v7.25c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7Z"
        />
      </svg>
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
      <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 000 2h8a1 1 0 100-2H6zm0 3a1 1 0 000 2h4a1 1 0 100-2H6z"
        />
      </svg>
      <span>Details</span>
    </button>
  {/if}

  <StoryDetailDialog {data} bind:open={isDetailOpen} />

  <Handle type="source" position={layout.isHorizontal ? Position.Right : Position.Bottom} />
</div>
