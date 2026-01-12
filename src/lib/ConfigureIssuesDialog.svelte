<script lang="ts">
  import { Dialog, Tabs } from 'bits-ui';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { extractIdsFromCSV } from '$lib/extractIdsFromCSV';

  let {
    open = $bindable(false)
  }: {
    open?: boolean;
  } = $props();

  type HistoryEntry = {
    type: 'query' | 'ids';
    content: string;
    timestamp: number;
  };

  const HISTORY_KEY = 'issue-config-history';
  const MAX_HISTORY = 20;

  let activeTab = $state<'query' | 'ids' | 'history'>('query');
  let wiqlQuery = $state('');
  let idsList = $state('');
  let csvFileInput = $state<HTMLInputElement | null>(null);
  let csvParseError = $state('');
  let history = $state<HistoryEntry[]>([]);

  // Initialize from URL parameters
  $effect.pre(() => {
    const params = page.url.searchParams;
    const wiqlParam = params.get('wiql');
    const idsParam = params.get('ids');

    if (idsParam) {
      idsList = idsParam.split(',').map(id => id.trim()).join('\n');
      activeTab = 'ids';
    }
    if (wiqlParam) {
      wiqlQuery = wiqlParam;
      activeTab = 'query';
    }
  });

  // Load history from localStorage
  $effect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        try {
          history = JSON.parse(stored);
        } catch (e) {
          history = [];
        }
      }
    }
  });

  function updateUrlParams() {
    const params = new URLSearchParams(page.url.searchParams);

    // Remove old parameters
    params.delete('wiql');
    params.delete('ids');

    // Add new parameters based on active tab
    if (activeTab === 'query' && wiqlQuery.trim()) {
      params.set('wiql', wiqlQuery.trim());
    } else if (activeTab === 'ids' && idsList.trim()) {
      const idsArray = idsList
        .split('\n')
        .map(id => id.trim())
        .filter(id => id.length > 0);
      params.set('ids', idsArray.join(','));
    }

    // Update the URL
    const newUrl = `${page.url.pathname}?${params.toString()}`;
    goto(newUrl, { invalidateAll: true });
  }

  function saveToHistory(type: 'query' | 'ids', content: string) {
    // Remove duplicate if exists
    const filtered = history.filter(
      entry => !(entry.type === type && entry.content === content)
    );

    // Add new entry at the beginning
    const newEntry: HistoryEntry = {
      type,
      content,
      timestamp: Date.now()
    };

    const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY);
    history = updated;

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    }
  }

  function applyHistoryEntry(entry: HistoryEntry) {
    if (entry.type === 'query') {
      wiqlQuery = entry.content;
      activeTab = 'query';
    } else {
      idsList = entry.content;
      activeTab = 'ids';
    }
  }

  function handleConfirm() {
    // Save to history before updating URL
    if (activeTab === 'query' && wiqlQuery.trim()) {
      saveToHistory('query', wiqlQuery.trim());
    } else if (activeTab === 'ids' && idsList.trim()) {
      const idsArray = idsList
        .split('\n')
        .map(id => id.trim())
        .filter(id => id.length > 0);
      saveToHistory('ids', idsArray.join('\n'));
    }

    updateUrlParams();
    open = false;
  }

  async function handleCsvParse() {
    if (!csvFileInput?.files?.[0]) {
      csvParseError = 'Please select a CSV file';
      return;
    }

    csvParseError = '';

    try {
      const file = csvFileInput.files[0];
      const fileContent = await file.text();

      // Try to determine the ID column name
      const idColumn = 'ID'; // You can make this configurable if needed

      const ids = await extractIdsFromCSV({ fileContent, idColumn });
      idsList = ids.join('\n');

      // Reset the file input
      if (csvFileInput) {
        csvFileInput.value = '';
      }
    } catch (error) {
      csvParseError = error instanceof Error ? error.message : 'Error parsing CSV file';
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class="rounded outline p-1 bg-white">
    Configure Issues
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content
      class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded shadow-lg p-6 max-w-2xl w-lg">
      <Dialog.Title>Configure Issues</Dialog.Title>
      <Tabs.Root bind:value={activeTab} class="w-full mt-4">
        <Tabs.List class="flex border-b">
          <Tabs.Trigger value="query" class="px-4 py-2 border-b-2 data-[state=active]:border-blue-500">
            Query
          </Tabs.Trigger>
          <Tabs.Trigger value="ids" class="px-4 py-2 border-b-2 data-[state=active]:border-blue-500">
            IDs
          </Tabs.Trigger>
          <Tabs.Trigger value="history" class="px-4 py-2 border-b-2 data-[state=active]:border-blue-500">
            History
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="query" class="mt-4">
          <label for="wiql-query" class="block text-sm font-medium mb-2">WIQL Query</label>
          <textarea
            id="wiql-query"
            bind:value={wiqlQuery}
            class="w-full h-32 p-2 border rounded font-mono text-sm"
            placeholder="Enter your WIQL query here..."
          ></textarea>
          <p class="text-xs text-gray-500 mt-2">Enter a Work Item Query Language (WIQL) query to filter issues</p>
        </Tabs.Content>

        <Tabs.Content value="ids" class="mt-4">
          <label for="ids-list" class="block text-sm font-medium mb-2">Issue IDs</label>

          <div class="mb-4 p-4 border rounded bg-gray-50">
            <label for="csv-file" class="block text-sm font-medium mb-2">Load IDs from CSV</label>
            <div class="flex gap-2">
              <input
                bind:this={csvFileInput}
                id="csv-file"
                type="file"
                accept=".csv"
                class="flex-1 p-2 border rounded text-sm"
              />
              <button
                onclick={handleCsvParse}
                class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                Parse CSV
              </button>
            </div>
            {#if csvParseError}
              <p class="text-xs text-red-600 mt-2">{csvParseError}</p>
            {/if}
          </div>

          <textarea
            id="ids-list"
            bind:value={idsList}
            class="w-full h-32 p-2 border rounded font-mono text-sm"
            placeholder="Enter issue IDs, one per line..."
            rows="10"
          ></textarea>
          <p class="text-xs text-gray-500 mt-2">Enter one issue ID per line</p>
        </Tabs.Content>

        <Tabs.Content value="history" class="mt-4">
          <div class="space-y-2">
            <h3 class="text-sm font-medium mb-3">Recent Configurations</h3>
            {#if history.length === 0}
              <p class="text-sm text-gray-500 text-center py-8">No history yet. Confirmed configurations will appear here.</p>
            {:else}
              <div class="max-h-96 overflow-y-auto space-y-2">
                {#each history as entry (entry.timestamp)}
                  <button
                    onclick={() => applyHistoryEntry(entry)}
                    class="w-full text-left p-3 border rounded hover:bg-gray-50 transition-colors"
                    title={entry.type === 'query'
                      ? `Query: ${entry.content}`
                      : `IDs:\n${entry.content}`}
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="inline-block px-2 py-0.5 text-xs font-medium rounded {entry.type === 'query' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                            {entry.type === 'query' ? 'Query' : 'IDs'}
                          </span>
                          <span class="text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div class="text-sm font-mono text-gray-700 truncate">
                          {entry.type === 'query'
                            ? entry.content
                            : entry.content.split('\n').slice(0, 3).join(', ') + (entry.content.split('\n').length > 3 ? '...' : '')}
                        </div>
                        {#if entry.type === 'ids'}
                          <div class="text-xs text-gray-500 mt-1">
                            {entry.content.split('\n').length} ID(s)
                          </div>
                        {/if}
                      </div>
                      <div class="shrink-0">
                        <span class="text-xs text-blue-600">Apply →</span>
                      </div>
                    </div>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <div class="flex gap-2 mt-6 justify-end">
        <Dialog.Close class="px-4 py-2 border rounded hover:bg-gray-100">
          Cancel
        </Dialog.Close>
        <button
          onclick={handleConfirm}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Confirm
        </button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

