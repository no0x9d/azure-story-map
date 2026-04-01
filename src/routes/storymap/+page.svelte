<script lang="ts">
  import { getAppContext } from '$lib/state.svelte';
  import StoryMapView from '$lib/StoryMapView.svelte';

  const { canvas, filterState, layout, handleImportState, refresh } = getAppContext();
</script>

<StoryMapView
  {canvas}
  {filterState}
  {layout}
  onrefresh={refresh}
  onimportstate={handleImportState}
/>
