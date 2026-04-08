<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import { useSvelteFlow, getViewportForBounds } from '@xyflow/svelte';
  import { toSvg, toPng, toJpeg } from 'html-to-image';
  import DownloadIcon from '~icons/material-symbols/download';

  const { getNodes, getNodesBounds } = useSvelteFlow();

  type ExportFormat = 'svg' | 'png' | 'jpg';
  type ExportScope = 'viewport' | 'full';

  async function handleExport(scope: ExportScope, format: ExportFormat) {
    const flowElement = document.querySelector('.svelte-flow__viewport') as HTMLElement;
    if (!flowElement) return;

    const exportFn = format === 'svg' ? toSvg : format === 'png' ? toPng : toJpeg;
    const fileExtension = format;

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

    try {
      const dataUrl = await exportFn(flowElement, options);
      downloadDataUrl(dataUrl, `storymap-export.${fileExtension}`);
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
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="rounded outline p-1 bg-white" title="Export diagram">
    <DownloadIcon />
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content
      class="z-50 min-w-[160px] rounded-md border bg-white p-1 shadow-md"
      sideOffset={5}
    >
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
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
