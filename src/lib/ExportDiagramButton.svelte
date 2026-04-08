<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import { useSvelteFlow, getViewportForBounds } from '@xyflow/svelte';
  import { toSvg, toPng, toJpeg } from 'html-to-image';
  import DownloadIcon from '~icons/material-symbols/download';

  const { getNodes, getNodesBounds } = useSvelteFlow();

  type ExportFormat = 'svg' | 'png' | 'jpg';
  type ExportScope = 'viewport' | 'full';
  type DialogStatus = 'idle' | 'loading' | 'success' | 'error';

  // --- Dialog state ---
  let dialogOpen = $state(false);
  let pageId = $state('');
  let fileName = $state('storymap-export');
  let pendingScope = $state<ExportScope | null>(null);
  let pendingFormat = $state<ExportFormat | null>(null);
  let status = $state<DialogStatus>('idle');
  let resultMessage = $state('');
  let resultUrl = $state<string | null>(null);

  // --- Derived ---
  let canExport = $derived(
    pageId.trim().length > 0 && fileName.trim().length > 0 && status !== 'loading'
  );
  let scopeLabel = $derived(pendingScope === 'full' ? 'Full Diagram' : 'Current Viewport');
  let formatLabel = $derived(pendingFormat ? pendingFormat.toUpperCase() : '');

  // --- Helpers ---
  async function buildExportOptions(
    scope: ExportScope,
    format: ExportFormat
  ): Promise<{
    flowElement: HTMLElement;
    exportFn: typeof toSvg;
    options: Parameters<typeof toSvg>[1];
  }> {
    const flowElement = document.querySelector('.svelte-flow__viewport') as HTMLElement;
    if (!flowElement) throw new Error('Flow viewport element not found');

    const exportFn = format === 'svg' ? toSvg : format === 'png' ? toPng : toJpeg;

    let options: Parameters<typeof exportFn>[1] = {
      quality: 0.95,
      backgroundColor: '#ffffff'
    };

    if (scope === 'full') {
      const nodes = getNodes();
      const bounds = getNodesBounds(nodes);
      const padding = 50;
      const imageWidth = bounds.width + padding * 2;
      const imageHeight = bounds.height + padding * 2;
      const viewport = getViewportForBounds(bounds, imageWidth, imageHeight, 0.5, 2, 0.2);

      options = {
        ...options,
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
        }
      };
    }

    return { flowElement, exportFn, options };
  }

  // --- Download export ---
  async function handleExport(scope: ExportScope, format: ExportFormat) {
    try {
      const { flowElement, exportFn, options } = await buildExportOptions(scope, format);
      const dataUrl = await exportFn(flowElement, options);
      downloadDataUrl(dataUrl, `storymap-export.${format}`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  function downloadDataUrl(dataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  // --- Confluence export ---
  function openConfluenceDialog(scope: ExportScope, format: ExportFormat) {
    pendingScope = scope;
    pendingFormat = format;
    pageId = '';
    fileName = 'storymap-export';
    status = 'idle';
    resultMessage = '';
    resultUrl = null;
    dialogOpen = true;
  }

  function closeDialog() {
    if (status === 'loading') return;
    dialogOpen = false;
  }

  async function handleConfluenceExport() {
    if (!canExport || !pendingScope || !pendingFormat) return;

    status = 'loading';
    resultMessage = '';
    resultUrl = null;

    try {
      const { flowElement, exportFn, options } = await buildExportOptions(
        pendingScope,
        pendingFormat
      );
      const dataUrl = await exportFn(flowElement, options);

      const response = await fetch('/api/confluence/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl,
          format: pendingFormat,
          pageId: pageId.trim(),
          fileName: fileName.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { message?: string }).message ??
            `Request failed with status ${response.status}`
        );
      }

      const data = (await response.json()) as { url?: string; message?: string };
      status = 'success';
      resultUrl = data.url ?? null;
      resultMessage = data.message ?? 'Successfully exported to Confluence!';
    } catch (error) {
      status = 'error';
      resultMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    }
  }

  function handleDialogBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeDialog();
    }
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="rounded outline p-1 bg-white" title="Export diagram">
    <DownloadIcon />
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content
      class="z-50 min-w-[200px] rounded-md border bg-white p-1 shadow-md"
      sideOffset={5}
    >
      <!-- Download: Current Viewport -->
      <DropdownMenu.Group>
        <DropdownMenu.GroupHeading class="px-2 py-1.5 text-xs font-semibold text-gray-500">
          Current Viewport
        </DropdownMenu.GroupHeading>
        <DropdownMenu.Item
          class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
          onclick={() => handleExport('viewport', 'svg')}
        >
          SVG
        </DropdownMenu.Item>
        <DropdownMenu.Item
          class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
          onclick={() => handleExport('viewport', 'png')}
        >
          PNG
        </DropdownMenu.Item>
        <DropdownMenu.Item
          class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
          onclick={() => handleExport('viewport', 'jpg')}
        >
          JPG
        </DropdownMenu.Item>
      </DropdownMenu.Group>

      <DropdownMenu.Separator class="my-1 h-px bg-gray-200" />

      <!-- Download: Full Diagram -->
      <DropdownMenu.Group>
        <DropdownMenu.GroupHeading class="px-2 py-1.5 text-xs font-semibold text-gray-500">
          Full Diagram
        </DropdownMenu.GroupHeading>
        <DropdownMenu.Item
          class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
          onclick={() => handleExport('full', 'svg')}
        >
          SVG
        </DropdownMenu.Item>
        <DropdownMenu.Item
          class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
          onclick={() => handleExport('full', 'png')}
        >
          PNG
        </DropdownMenu.Item>
        <DropdownMenu.Item
          class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
          onclick={() => handleExport('full', 'jpg')}
        >
          JPG
        </DropdownMenu.Item>
      </DropdownMenu.Group>

      <DropdownMenu.Separator class="my-1 h-px bg-gray-200" />

      <!-- Export to Confluence -->
      <DropdownMenu.Group>
        <DropdownMenu.GroupHeading class="px-2 py-1.5 text-xs font-semibold text-gray-500">
          Export to Confluence
        </DropdownMenu.GroupHeading>
        <DropdownMenu.Item
          class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
          onclick={() => openConfluenceDialog('viewport', 'svg')}
        >
          Viewport — SVG
        </DropdownMenu.Item>
        <DropdownMenu.Item
          class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
          onclick={() => openConfluenceDialog('viewport', 'png')}
        >
          Viewport — PNG
        </DropdownMenu.Item>
        <DropdownMenu.Item
          class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
          onclick={() => openConfluenceDialog('viewport', 'jpg')}
        >
          Viewport — JPG
        </DropdownMenu.Item>
        <DropdownMenu.Item
          class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
          onclick={() => openConfluenceDialog('full', 'svg')}
        >
          Full — SVG
        </DropdownMenu.Item>
        <DropdownMenu.Item
          class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
          onclick={() => openConfluenceDialog('full', 'png')}
        >
          Full — PNG
        </DropdownMenu.Item>
        <DropdownMenu.Item
          class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
          onclick={() => openConfluenceDialog('full', 'jpg')}
        >
          Full — JPG
        </DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>

<!-- Confluence Export Dialog -->
{#if dialogOpen}
  <div
    role="presentation"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
    onclick={handleDialogBackdropClick}
  >
    <dialog
      open
      class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      aria-labelledby="confluence-dialog-title"
      aria-modal="true"
    >
      <h2 id="confluence-dialog-title" class="mb-1 text-lg font-semibold text-gray-900">
        Export to Confluence
      </h2>
      <p class="mb-4 text-sm text-gray-500">
        Exporting <span class="font-medium text-gray-700">{scopeLabel} — {formatLabel}</span>
      </p>

      <label for="confluence-file-name" class="mb-1 block text-sm font-medium text-gray-700">
        File Name
      </label>
      <input
        id="confluence-file-name"
        type="text"
        placeholder="e.g. storymap-export"
        bind:value={fileName}
        disabled={status === 'loading' || status === 'success'}
        class="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
      />

      <label for="confluence-page-id" class="mb-1 block text-sm font-medium text-gray-700">
        Confluence Page ID
      </label>
      <input
        id="confluence-page-id"
        type="text"
        inputmode="numeric"
        placeholder="e.g. 123456789"
        bind:value={pageId}
        disabled={status === 'loading' || status === 'success'}
        class="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
      />

      <!-- Status messages -->
      {#if status === 'success'}
        <div class="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          <p class="font-medium">Export successful!</p>
          <p class="mt-0.5">{resultMessage}</p>
          {#if resultUrl}
            <a
              href={resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 inline-block font-medium underline hover:text-green-900"
            >
              View attachment →
            </a>
          {/if}
        </div>
      {:else if status === 'error'}
        <div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <p class="font-medium">Export failed</p>
          <p class="mt-0.5">{resultMessage}</p>
        </div>
      {/if}

      <!-- Actions -->
      <div class="flex justify-end gap-2">
        <button
          type="button"
          onclick={closeDialog}
          disabled={status === 'loading'}
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'success' ? 'Close' : 'Cancel'}
        </button>
        {#if status !== 'success'}
          <button
            type="button"
            onclick={handleConfluenceExport}
            disabled={!canExport}
            class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {#if status === 'loading'}
              <svg
                class="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              Exporting…
            {:else}
              Export
            {/if}
          </button>
        {/if}
      </div>
    </dialog>
  </div>
{/if}
