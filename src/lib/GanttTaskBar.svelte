<script lang="ts">
  import { getTypeColor } from '$lib/colors';

  let { data }: { data: Record<string, unknown> } = $props();

  let color = $derived(getTypeColor(data.workItemType as string));
</script>

{#if data.type !== 'milestone'}
  <div
    class="w-full h-full border-l-[4px] border-solid rounded-sm flex items-center overflow-hidden"
    style:border-left-color={color}
    title={data.text || ''}
  >
    <span class="px-1 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis"
      >{data.text || ''}</span
    >
  </div>
{:else}
  <div class="absolute left-full top-0 px-1 text-[11px] whitespace-nowrap">{data.text || ''}</div>
{/if}
