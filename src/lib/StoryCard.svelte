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

<div class="story-card" class:selected style="--type-color: {getTypeColor(data.type)}">
  <Handle type="target" position={layout.isHorizontal ? Position.Left : Position.Top} />

  <div class="story-header">
    <a href={data.webUrl} target="_blank" class="story-id">#{data.id}</a>
    {#if data.estimationStoryPoints}
      <span class="story-estimation">{data.estimationStoryPoints} SP</span>
    {/if}
    {#if data.estimationEffort}
      <span class="story-estimation">{data.estimationEffort}</span>
    {/if}
  </div>

  <div class="story-title">{data.title}</div>

  <div class="story-footer">
    <span class="story-state" style="background-color: {getStateColor(data.state)}">
      {data.state}
    </span>
    {#if data.type}
      <span class="story-type">{data.type}</span>
    {/if}
  </div>

  {#if data.iterationPath}
    <div class="story-iteration">
      <svg class="iteration-icon" viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7v7.25c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7Z"
        />
      </svg>
      <span>{data.iterationPath}</span>
    </div>
  {/if}

  {#if data.description || data.acceptanceCriteria}
    <button class="detail-button" onclick={openDetail} type="button">
      <svg class="detail-icon" viewBox="0 0 20 20" fill="currentColor">
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

<style>
  .story-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-left: 6px solid var(--type-color, #e5e7eb);
    padding: 12px;
    min-width: 240px;
    max-width: 320px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .story-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .story-card.selected {
    border-top-color: #3b82f6;
    border-right-color: #3b82f6;
    border-bottom-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }

  .story-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .story-id {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
  }

  .story-estimation {
    font-size: 11px;
    font-weight: 600;
    color: #3b82f6;
    background: #eff6ff;
    padding: 2px 8px;
    border-radius: 12px;
  }

  .story-title {
    font-size: 14px;
    font-weight: 500;
    color: #111827;
    line-height: 1.4;
    margin-bottom: 10px;
    word-wrap: break-word;
  }

  .story-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .story-state {
    font-size: 11px;
    font-weight: 600;
    color: white;
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .story-type {
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
  }

  .story-iteration {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
  }

  .iteration-icon {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
  }

  .detail-button {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    margin-top: 10px;
    padding: 6px 8px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
    transition: all 0.2s ease;
  }

  .detail-button:hover {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
  }

  .detail-icon {
    width: 14px;
    height: 14px;
  }
</style>
