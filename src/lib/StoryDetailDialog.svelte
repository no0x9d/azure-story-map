<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { getStateColor, getTypeColor } from './colors';
  import type { StoryData } from '$lib/types';
  import CloseIcon from '~icons/material-symbols/close';
  import DescriptionIcon from '~icons/material-symbols/description';
  import CheckIcon from '~icons/material-symbols/check';

  let {
    open = $bindable(false),
    data
  }: {
    open?: boolean;
    data: StoryData;
  } = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-black/40 z-50" />
    <Dialog.Content
      class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-2xl z-50 w-[900px] max-w-[90vw] max-h-[85vh] flex flex-col"
      onpointerdown={(e: PointerEvent) => e.stopPropagation()}
    >
      <!-- Header bar -->
      <div
        class="flex items-center gap-3 px-6 py-4 border-b border-gray-200"
        style="border-left: 5px solid {getTypeColor(data.type)}"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            {#if data.type}
              <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >{data.type}</span
              >
            {/if}
            <a
              href={data.webUrl}
              target="_blank"
              class="text-xs font-mono text-blue-600 hover:underline">#{data.id}</a
            >
          </div>
          <Dialog.Title class="text-lg font-semibold text-gray-900 leading-snug"
            >{data.title}</Dialog.Title
          >
        </div>
        <Dialog.Close
          class="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <CloseIcon class="w-5 h-5" />
        </Dialog.Close>
      </div>

      <!-- Metadata row -->
      <div
        class="flex flex-wrap items-center gap-3 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm"
      >
        <div class="flex items-center gap-1.5">
          <span class="text-gray-500">State:</span>
          <span
            class="text-xs font-semibold text-white px-2 py-0.5 rounded"
            style="background-color: {getStateColor(data.state)}">{data.state}</span
          >
        </div>
        {#if data.estimationStoryPoints}
          <div class="flex items-center gap-1.5">
            <span class="text-gray-500">Story Points:</span>
            <span class="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded"
              >{data.estimationStoryPoints}</span
            >
          </div>
        {/if}
        {#if data.estimationEffort}
          <div class="flex items-center gap-1.5">
            <span class="text-gray-500">Effort:</span>
            <span class="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded"
              >{data.estimationEffort}</span
            >
          </div>
        {/if}
        {#if data.iterationPath}
          <div class="flex items-center gap-1.5">
            <span class="text-gray-500">Iteration:</span>
            <span class="text-sm text-gray-700">{data.iterationPath}</span>
          </div>
        {/if}
      </div>

      <!-- Scrollable content area -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {#if data.description}
          <section>
            <h2
              class="text-lg font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2"
            >
              <DescriptionIcon class="w-4 h-4 text-gray-400" />
              Description
            </h2>
            <div class="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              {@html data.description}
            </div>
          </section>
        {/if}

        {#if data.acceptanceCriteria}
          <section>
            <h2
              class="text-lg font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2"
            >
              <CheckIcon class="w-4 h-4 text-gray-400" />
              Acceptance Criteria
            </h2>
            <div class="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              {@html data.acceptanceCriteria}
            </div>
          </section>
        {/if}

        {#if !data.description && !data.acceptanceCriteria}
          <div class="text-center text-gray-400 py-8">
            No description or acceptance criteria available.
          </div>
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
