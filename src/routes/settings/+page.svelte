<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { getAppContext } from '$lib/state.svelte';
  import type { PageProps } from './$types';

  let { form }: PageProps = $props();

  const appContext = getAppContext();
  let azureBaseUrl = $derived(appContext.azureBaseUrl ?? '');
  let hasToken = $derived(appContext.hasToken);

  // Preserve query params (wiql / ids) when navigating back
  let backHref = $derived(`/storymap${page.url.search}`);
</script>

<svelte:head>
  <title>Settings</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12">
  <div class="max-w-lg mx-auto mt-4 px-4">
    <!-- Back link -->
    <a
      href={backHref}
      class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="size-4 group-hover:-translate-x-0.5 transition-transform"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
          clip-rule="evenodd"
        />
      </svg>
      Back to Story Map
    </a>

    <!-- Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h1 class="text-2xl font-semibold text-gray-900 mb-1">Settings</h1>
      <p class="text-sm text-gray-500 mb-8">Configure your Azure DevOps connection.</p>

      <!-- Alert: success / error -->
      {#if form?.message}
        <div
          class={[
            'flex items-start gap-3 rounded-lg border px-4 py-3 mb-6 text-sm',
            form.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          ].join(' ')}
          role="alert"
        >
          {#if form.success}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              class="size-5 shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                clip-rule="evenodd"
              />
            </svg>
          {:else}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              class="size-5 shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clip-rule="evenodd"
              />
            </svg>
          {/if}
          <span>{form.message}</span>
        </div>
      {/if}

      <form
        method="POST"
        use:enhance={() => {
          return async ({ result, update }) => {
            if (
              result.type === 'success' &&
              result.data &&
              (result.data as { success: boolean }).success
            ) {
              await update({ reset: false });
              goto(backHref);
            } else {
              await update({ reset: false });
            }
          };
        }}
        class="space-y-6"
      >
        <!-- Azure Base URL -->
        <div>
          <label for="azureBaseUrl" class="block text-sm font-medium text-gray-700 mb-1.5">
            Azure Base-URL
          </label>
          <input
            id="azureBaseUrl"
            name="azureBaseUrl"
            type="text"
            placeholder="https://dev.azure.com/your-org"
            value={azureBaseUrl}
            class="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        <!-- Azure PAT -->
        <div>
          <label for="azurePat" class="block text-sm font-medium text-gray-700 mb-1.5">
            Azure Personal Access Token (PAT)
          </label>
          <input
            id="azurePat"
            name="azurePat"
            type="password"
            placeholder={hasToken ? '••••••••••••••••' : 'Enter your Personal Access Token'}
            class="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          {#if hasToken}
            <p class="mt-1.5 text-xs text-gray-500">
              A token is already saved. Leave blank to keep the existing token.
            </p>
          {/if}
        </div>

        <!-- Submit -->
        <div class="pt-2">
          <button
            type="submit"
            class="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:bg-blue-800 transition-colors"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
