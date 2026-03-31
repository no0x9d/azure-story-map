<script lang="ts">
  import { getTypeColor } from '$lib/colors';

  let { data }: { data: Record<string, unknown> } = $props();

  let color = $derived(getTypeColor(data.workItemType as string));
</script>

{#if data.type !== 'milestone'}
  <div class="task-bar" style:border-left-color={color} title="{data.text || ''}">
    <span class="task-label">{data.text || ''}</span>
  </div>
{:else}
  <div class="task-label milestone-label">{data.text || ''}</div>
{/if}

<style>
  .task-bar {
    width: 100%;
    height: 100%;
    border-left: 4px solid;
    border-radius: 2px;
    display: flex;
    align-items: center;
    overflow: hidden;
  }
  .task-label {
    padding: 0 4px;
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .milestone-label {
    position: absolute;
    left: 100%;
    top: 0;
    padding: 0 4px;
    font-size: 11px;
    white-space: nowrap;
  }
</style>
