<script lang="ts">
  import { Dialog } from 'bits-ui';

  let {
    open = $bindable(false)
  }: {
    open?: boolean;
  } = $props();

  function handleConfirm() {
    // Handle settings confirmation logic here
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class="rounded outline p-1 bg-white">
    Settings
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content
      class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded shadow-lg p-6 max-w-2xl w-lg">
      <Dialog.Title>Settings</Dialog.Title>
      <form class="w-full mt-4 flex flex-col gap-4" method="POST" id="settings-form">
        <label
          class="block text-sm font-medium mb-2">
          <span>Azure Base-URL</span>

          <input
            name="azureBaseUrl"
            type="text"
            class="w-full mt-1 p-2 border rounded font-mono text-sm"
            placeholder="Enter your WIQL query here..."
          ></label>

        <label class="block text-sm font-medium mb-2">
          <span>Azure Personal Access Token (PAT)</span>
          <input
            name="azurePat"
            type="password"
            class="w-full mt-1 p-2 border rounded font-mono text-sm"
            placeholder="Enter your Azure PAT here..."
          >
        </label>
      </form>

      <div class="flex gap-2 mt-6 justify-end">
        <Dialog.Close class="px-4 py-2 border rounded hover:bg-gray-100">
          Cancel
        </Dialog.Close>
        <button
          onclick={handleConfirm}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          type="submit"
          form="settings-form"
        >
          Confirm
        </button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

