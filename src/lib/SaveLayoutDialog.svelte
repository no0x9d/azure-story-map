<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import type { Node } from '@xyflow/svelte';
  import SaveIcon from '~icons/material-symbols/save-outline';

  type SavedStateSource = { type: 'wiql'; query: string } | { type: 'ids'; ids: string } | null;

  export interface SavedState {
    version: 1;
    timestamp: number;
    /** The Azure DevOps query / ID list used to load the graph */
    source: SavedStateSource;
    layout: { isHorizontal: boolean };
    /** Active filter sets */
    visibleEdgeTypes: string[];
    /**
     * Visible states per issue type.
     * A type absent from this record is hidden entirely.
     */
    visibleStatesByType: Record<string, string[]>;
    // Legacy field kept for backward-compat reading of old exports
    visibleIssueTypes?: string[];
    visibleIssueStates?: string[];
    /**
     * Node positions keyed by node id.
     * The node data itself is re-fetched from Azure on import so that
     * the recipient always sees up-to-date field values.
     */
    positions: Record<string, { x: number; y: number }>;
  }

  let {
    open = $bindable(false),
    nodes,
    layout,
    visibleEdgeTypes,
    visibleStatesByType,
    onimport
  }: {
    open?: boolean;
    nodes: Node[];
    layout: { isHorizontal: boolean };
    visibleEdgeTypes: Set<string>;
    visibleStatesByType: Map<string, Set<string>>;
    onimport: (state: SavedState) => void;
  } = $props();

  let fileInput = $state<HTMLInputElement | null>(null);
  let importError = $state('');
  let importSuccess = $state('');
  let copySuccess = $state(false);

  function buildState(): SavedState {
    const params = page.url.searchParams;
    let source: SavedStateSource = null;
    if (params.has('wiql')) {
      source = { type: 'wiql', query: params.get('wiql')! };
    } else if (params.has('ids')) {
      source = { type: 'ids', ids: params.get('ids')! };
    }

    const positions: Record<string, { x: number; y: number }> = {};
    for (const n of nodes) {
      positions[n.id] = { x: n.position.x, y: n.position.y };
    }

    const visibleStatesByTypeRecord: Record<string, string[]> = {};
    visibleStatesByType.forEach((states, type) => {
      visibleStatesByTypeRecord[type] = Array.from(states);
    });

    return {
      version: 1,
      timestamp: Date.now(),
      source,
      layout: { isHorizontal: layout.isHorizontal },
      visibleEdgeTypes: Array.from(visibleEdgeTypes),
      visibleStatesByType: visibleStatesByTypeRecord,
      positions
    };
  }

  function exportJson() {
    const state = buildState();
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storymap-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyAsText() {
    const state = buildState();
    const json = JSON.stringify(state, null, 2);
    await navigator.clipboard.writeText(json);
    copySuccess = true;
    setTimeout(() => (copySuccess = false), 2000);
  }

  function parseState(json: string): SavedState {
    const parsed = JSON.parse(json);
    if (parsed.version !== 1) {
      throw new Error(`Unsupported state version: ${parsed.version}`);
    }
    if (typeof parsed.positions !== 'object' || parsed.positions === null) {
      throw new Error('Invalid state: missing positions');
    }
    return parsed as SavedState;
  }

  async function handleFileImport() {
    if (!fileInput?.files?.[0]) {
      importError = 'Please select a JSON file.';
      return;
    }

    importError = '';
    importSuccess = '';

    try {
      const text = await fileInput.files[0].text();
      const state = parseState(text);
      await applyState(state);
      if (fileInput) fileInput.value = '';
    } catch (e) {
      importError = e instanceof Error ? e.message : 'Failed to parse state file.';
    }
  }

  async function handlePasteImport() {
    importError = '';
    importSuccess = '';
    try {
      const text = await navigator.clipboard.readText();
      const state = parseState(text);
      await applyState(state);
    } catch (e) {
      importError = e instanceof Error ? e.message : 'Failed to read state from clipboard.';
    }
  }

  async function applyState(state: SavedState) {
    // Navigate to the source URL so SvelteKit re-fetches the graph data.
    // The positions will be applied by the parent via the onimport callback
    // after the data is loaded.
    onimport(state);

    if (state.source) {
      const params = new URLSearchParams(page.url.searchParams);
      params.delete('wiql');
      params.delete('ids');
      if (state.source.type === 'wiql') {
        params.set('wiql', state.source.query);
      } else {
        params.set('ids', state.source.ids);
      }
      const newUrl = `${page.url.pathname}?${params.toString()}`;
      await goto(newUrl, { invalidateAll: true });
    }

    importSuccess = 'State imported successfully.';
    setTimeout(() => {
      importSuccess = '';
      open = false;
    }, 1500);
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class="rounded outline p-1 bg-white" title="Save / Load Layout"
    ><SaveIcon></SaveIcon>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content
      class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded shadow-lg p-6 max-w-lg w-full"
    >
      <Dialog.Title class="text-lg font-semibold mb-4">Save / Load Layout</Dialog.Title>

      <!-- Export section -->
      <section class="mb-6">
        <h3 class="text-sm font-medium mb-2">Export current layout</h3>
        <p class="text-xs text-gray-500 mb-3">
          Saves node positions, active filters, and the current query/ID source. Node data will be
          re-fetched from Azure DevOps on import.
        </p>
        <div class="flex gap-2">
          <button
            onclick={exportJson}
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Download JSON
          </button>
          <button onclick={copyAsText} class="px-4 py-2 border rounded hover:bg-gray-50 text-sm">
            {copySuccess ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      </section>

      <hr class="mb-6" />

      <!-- Import section -->
      <section>
        <h3 class="text-sm font-medium mb-2">Import layout</h3>

        <div class="mb-4 p-4 border rounded bg-gray-50">
          <label for="state-file" class="block text-xs font-medium mb-2">From JSON file</label>
          <div class="flex gap-2">
            <input
              bind:this={fileInput}
              id="state-file"
              type="file"
              accept=".json"
              class="flex-1 p-1 border rounded text-sm"
            />
            <button
              onclick={handleFileImport}
              class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              Import
            </button>
          </div>
        </div>

        <div class="p-4 border rounded bg-gray-50">
          <p class="text-xs font-medium mb-2">From clipboard</p>
          <button
            onclick={handlePasteImport}
            class="px-4 py-2 border rounded hover:bg-gray-100 text-sm w-full"
          >
            Paste from clipboard
          </button>
        </div>

        {#if importError}
          <p class="text-xs text-red-600 mt-3">{importError}</p>
        {/if}
        {#if importSuccess}
          <p class="text-xs text-green-600 mt-3">{importSuccess}</p>
        {/if}
      </section>

      <div class="flex justify-end mt-6">
        <Dialog.Close class="px-4 py-2 border rounded hover:bg-gray-100 text-sm">
          Close
        </Dialog.Close>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
