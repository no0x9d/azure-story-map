import { getCredentials, persistCredentials } from '$lib/server/azure-connection';
import {
  getConfluenceCredentials,
  persistConfluenceCredentials
} from '$lib/server/confluence-connection';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const confluence = await getConfluenceCredentials();
  return {
    confluenceBaseUrl: confluence?.baseUrl ?? null,
    confluenceEmail: confluence?.email ?? null,
    hasConfluenceToken: confluence !== null
  };
};

export const actions: Actions = {
  azure: async ({ request }) => {
    const formData = await request.formData();
    const orgUrl = formData.get('azureBaseUrl') as string;
    const submittedToken = formData.get('azurePat') as string;

    if (!orgUrl) {
      return { success: false, message: 'Organization URL is required.' };
    }

    // If no new token was submitted, keep the existing one
    let token = submittedToken;
    if (!token) {
      const existing = await getCredentials();
      if (!existing?.token) {
        return { success: false, message: 'A Personal Access Token is required.' };
      }
      token = existing.token;
    }

    try {
      await persistCredentials(orgUrl, token);
      return { success: true, message: 'Azure credentials saved successfully.' };
    } catch (error) {
      console.error('Error saving Azure credentials:', error);
      return { success: false, message: 'Failed to save credentials.' };
    }
  },

  confluence: async ({ request }) => {
    const formData = await request.formData();
    const baseUrl = formData.get('confluenceBaseUrl') as string;
    const email = formData.get('confluenceEmail') as string;
    const submittedToken = formData.get('confluenceApiToken') as string;

    if (!baseUrl || !email) {
      return { success: false, message: 'Confluence URL and email are required.' };
    }

    // If no new token was submitted, keep the existing one
    let apiToken = submittedToken;
    if (!apiToken) {
      const existing = await getConfluenceCredentials();
      if (!existing?.apiToken) {
        return { success: false, message: 'A Confluence API token is required.' };
      }
      apiToken = existing.apiToken;
    }

    try {
      await persistConfluenceCredentials(baseUrl, email, apiToken);
      return { success: true, message: 'Confluence credentials saved successfully.' };
    } catch (error) {
      console.error('Error saving Confluence credentials:', error);
      return { success: false, message: 'Failed to save Confluence credentials.' };
    }
  }
};
