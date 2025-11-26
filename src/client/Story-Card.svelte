<script lang="ts">
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";

  interface StoryData {
    id: number;
    title: string;
    state: string;
    estimation?: number;
    type?: string;
    description?: string;
    acceptanceCriteria?: string;
  }

  let { data, selected }: NodeProps<StoryData> = $props();
  let isExpanded = $state(false);

  function getStateColor(state: string): string {
    const stateColors: Record<string, string> = {
      New: "#6b7280",
      Active: "#3b82f6",
      Resolved: "#8b5cf6",
      Closed: "#10b981",
      Removed: "#ef4444",
    };
    return stateColors[state] || "#6b7280";
  }

  function getTypeColor(type?: string): string {
    const typeColors: Record<string, string> = {
      "User Story": "#3b82f6",
      Bug: "#ef4444",
      Task: "#10b981",
      Epic: "#8b5cf6",
      Feature: "#f59e0b",
    };
    return type ? typeColors[type] || "#6b7280" : "#6b7280";
  }

  function toggleAcceptanceCriteriaExpand(event: Event) {
    event.stopPropagation();
    isExpanded = !isExpanded;
  }
</script>

<div
  class="story-card"
  class:selected
  style="--type-color: {getTypeColor(data.type)}"
>
  <Handle type="target" position={Position.Top} />

  <div class="story-header">
    <span class="story-id">#{data.id}</span>
    {#if data.estimation}
      <span class="story-estimation">{data.estimation} SP</span>
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

  {#if data.acceptanceCriteria}
    <button class="expand-button" onclick={toggleAcceptanceCriteriaExpand} type="button">
      <svg
        class="expand-icon"
        class:rotated={isExpanded}
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

    {#if isExpanded}
      <div class="acceptance-criteria">
        {@html data.acceptanceCriteria}
      </div>
    {/if}
  {/if}

  <Handle type="source" position={Position.Bottom} />
</div>

<style>
  .story-card {
    background: white;
    border: 2px solid var(--type-color, #e5e7eb);
    border-radius: 8px;
    padding: 12px;
    min-width: 240px;
    max-width: 320px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .story-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .story-card.selected {
    border-color: #3b82f6;
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
  }

  .expand-button:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  .expand-icon {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }

  .expand-icon.rotated {
    transform: rotate(180deg);
  }

  .acceptance-criteria {
    margin-top: 8px;
    padding: 10px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 12px;
    line-height: 1.5;
    color: #374151;
    max-height: 300px;
    overflow-y: auto;
  }

  .acceptance-criteria :global(ul),
  .acceptance-criteria :global(ol) {
    margin: 8px 0;
    padding-left: 20px;
  }

  .acceptance-criteria :global(li) {
    margin: 4px 0;
  }

  .acceptance-criteria :global(p) {
    margin: 6px 0;
  }

  .acceptance-criteria :global(strong) {
    font-weight: 600;
    color: #111827;
  }

  .acceptance-criteria :global(a) {
    color: #3b82f6;
    text-decoration: none;
  }

  .acceptance-criteria :global(a:hover) {
    text-decoration: underline;
  }
</style>

