<script lang="ts">
  import { Dialog } from 'bits-ui';
  import FilterIcon from '~icons/material-symbols/filter-alt-outline';

  let {
    open = $bindable(false),
    edgeTypes,
    visibleEdgeTypes,
    statesByType,
    visibleStatesByType,
    ontoggle,
    ontoggleIssueType,
    ontoggleIssueState
  }: {
    open?: boolean;
    edgeTypes: string[];
    visibleEdgeTypes: Set<string>;
    /** All known states per issue type */
    statesByType: Map<string, Set<string>>;
    /** Currently visible states per issue type; absent key = type hidden */
    visibleStatesByType: Map<string, Set<string>>;
    ontoggle: (edgeType: string) => void;
    ontoggleIssueType: (issueType: string) => void;
    ontoggleIssueState: (issueType: string, issueState: string) => void;
  } = $props();

  /** Tri-state for a parent issue-type checkbox */
  function issueTypeCheckState(type: string): 'all' | 'some' | 'none' {
    if (!visibleStatesByType.has(type)) return 'none';
    const allStates = statesByType.get(type) ?? new Set<string>();
    const visStates = visibleStatesByType.get(type)!;
    if (visStates.size === 0) return 'none';
    if (visStates.size === allStates.size) return 'all';
    return 'some';
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class="rounded outline p-1 bg-white" title="Configure Visualization"
    ><FilterIcon></FilterIcon></Dialog.Trigger
  >
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content
      class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded shadow-lg p-6 max-w-md w-full"
    >
      <Dialog.Title>Configure Visualization</Dialog.Title>

      <div class="w-full mt-4 flex flex-col gap-4">
        <!-- Edge types -->
        <div>
          <h3 class="font-medium mb-2">Show Edge Types</h3>
          {#if edgeTypes.length === 0}
            <p class="text-gray-500 italic text-center py-4">No edge types found in the diagram</p>
          {:else}
            <div class="max-h-48 overflow-y-auto flex flex-col gap-2">
              {#each [...edgeTypes].sort() as edgeType (edgeType)}
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

        <!-- Issue types + states tree -->
        <div>
          <h3 class="font-medium mb-2">Show Issue Types</h3>
          {#if statesByType.size === 0}
            <p class="text-gray-500 italic text-center py-4">No issue types found in the diagram</p>
          {:else}
            <div class="max-h-96 overflow-y-auto flex flex-col gap-1">
              {#each Array.from(statesByType.keys()).sort() as issueType (issueType)}
                {@const checkState = issueTypeCheckState(issueType)}
                {@const states = Array.from(statesByType.get(issueType) ?? []).sort()}
                {@const visStates = visibleStatesByType.get(issueType) ?? new Set<string>()}

                <!-- Parent: issue type -->
                <div>
                  <label
                    class="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer font-medium"
                  >
                    <input
                      type="checkbox"
                      checked={checkState === 'all'}
                      bind:indeterminate={() => checkState === 'some', () => {}}
                      onchange={() => ontoggleIssueType(issueType)}
                      class="w-5 h-5 cursor-pointer"
                    />
                    <span class="text-sm select-none">{issueType}</span>
                  </label>

                  <!-- Children: states, indented -->
                  {#if states.length > 0}
                    <div class="ml-8 flex flex-col gap-0.5">
                      {#each states as state (state)}
                        <label
                          class="flex items-center gap-3 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={visStates.has(state)}
                            onchange={() => ontoggleIssueState(issueType, state)}
                            class="w-4 h-4 cursor-pointer"
                          />
                          <span class="text-sm select-none text-gray-700">{state}</span>
                        </label>
                      {/each}
                    </div>
                  {/if}
                </div>
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
