<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { getLayoutContext } from './state.svelte';
  import { getStateColor, getTypeColor } from './colors';

  interface StoryData {
    id: number;
    title: string;
    state: string;
    estimationStoryPoints?: number;
    estimationEffort?: number;
    type?: string;
    description?: string;
    acceptanceCriteria?: string;
    webUrl: string;
  }

  let { data, selected }: { data: StoryData; selected: boolean } = $props();
  let isAcceptanceCriteriaExpanded = $state(false);
  let isDescriptionExpanded = $state(false);
  let layout = getLayoutContext();

  function toggleAcceptanceCriteriaExpand(event: Event) {
    event.stopPropagation();
    isAcceptanceCriteriaExpanded = !isAcceptanceCriteriaExpanded;
  }

  function toggleDescriptionExpand(event: Event) {
    event.stopPropagation();
    isDescriptionExpanded = !isDescriptionExpanded;
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

  {#if data.description}
    <button
      class="expand-button"
      class:expanded={isDescriptionExpanded}
      onclick={toggleDescriptionExpand}
      type="button"
    >
      <svg
        class="expand-icon"
        class:rotated={isDescriptionExpanded}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
      <span>Description</span>
    </button>

    {#if isDescriptionExpanded}
      <div class="expandable-content">
        {@html data.description}
      </div>
    {/if}
  {/if}
  {#if data.acceptanceCriteria}
    <button
      class="expand-button"
      class:expanded={isAcceptanceCriteriaExpanded}
      onclick={toggleAcceptanceCriteriaExpand}
      type="button"
    >
      <svg
        class="expand-icon"
        class:rotated={isAcceptanceCriteriaExpanded}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
      <span>Acceptance Criteria</span>
    </button>

    {#if isAcceptanceCriteriaExpanded}
      <div class="expandable-content" onscroll={(event) => event.stopPropagation()}>
        {@html data.acceptanceCriteria}
      </div>
    {/if}
  {/if}

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

  .expand-button {
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

    &.expanded {
      border-bottom: none;
      border-radius: 6px 6px 0 0;
    }
  }

  .expand-button:hover {
    background: #f3f4f6;
  }

  .expand-icon {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }

  .expandable-content {
    padding: 0 10px 10px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-top: none;
    border-radius: 0 0 6px 6px;
    font-size: 12px;
    line-height: 1.5;
    color: #374151;
    max-height: 300px;
    overflow-y: auto;
  }

  .expandable-content :global(ul),
  .expandable-content :global(ol) {
    margin: 8px 0;
    padding-left: 10px;
  }

  .expandable-content :global(li) {
    margin: 4px 0;
  }

  .expandable-content :global(p) {
    margin: 6px 0;
  }

  .expandable-content :global(strong) {
    font-weight: 600;
    color: #111827;
  }

  .expandable-content :global(a) {
    color: #3b82f6;
    text-decoration: none;
  }

  .expandable-content :global(a:hover) {
    text-decoration: underline;
  }
</style>
