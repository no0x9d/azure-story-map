<script lang="ts">
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";

  interface StoryData {
    id: number;
    title: string;
    state: string;
    estimation?: number;
    type?: string;
  }

  let { data, selected }: NodeProps<StoryData> = $props();

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
</style>

