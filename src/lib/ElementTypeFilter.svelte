<script lang="ts">
  import { Dialog } from 'bits-ui';

  let {
    open = $bindable(false),
    edgeTypes,
    visibleEdgeTypes,
    issueTypes,
    visibleIssueTypes,
    ontoggle,
    ontoggleIssueType
  }: {
    open?: boolean;
    edgeTypes: string[];
    visibleEdgeTypes: Set<string>;
    issueTypes: string[];
    visibleIssueTypes: Set<string>;
    ontoggle: (edgeType: string) => void;
    ontoggleIssueType: (issueType: string) => void;
  } = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class="rounded outline p-1 bg-white">Configure Visualization</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content
      class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded shadow-lg p-6 max-w-md w-full"
    >
      <Dialog.Title>Configure Visualization</Dialog.Title>

      <div class="w-full mt-4 flex flex-col gap-4">
        <div>
          <h3 class="font-medium mb-2">Show Edge Types</h3>
          {#if edgeTypes.length === 0}
            <p class="text-gray-500 italic text-center py-4">No edge types found in the diagram</p>
          {:else}
            <div class="max-h-48 overflow-y-auto flex flex-col gap-2">
              {#each edgeTypes as edgeType (edgeType)}
                <label class="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleEdgeTypes.has(edgeType)}
                    onchange={() => ontoggle(edgeType)}
                    class="w-5 h-5 cursor-pointer"
                  />
                  <span class="text-sm select-none">{edgeType}</span>
                </label>
              {/each}
            </div>
          {/if}
        </div>

        <div>
          <h3 class="font-medium mb-2">Show Issue Types</h3>
          {#if issueTypes.length === 0}
            <p class="text-gray-500 italic text-center py-4">No issue types found in the diagram</p>
          {:else}
            <div class="max-h-48 overflow-y-auto flex flex-col gap-2">
              {#each issueTypes as issueType (issueType)}
                <label class="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleIssueTypes.has(issueType)}
                    onchange={() => ontoggleIssueType(issueType)}
                    class="w-5 h-5 cursor-pointer"
                  />
                  <span class="text-sm select-none">{issueType}</span>
                </label>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="flex gap-2 mt-6 justify-end">
        <Dialog.Close class="px-4 py-2 border rounded hover:bg-gray-100">Close</Dialog.Close>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
