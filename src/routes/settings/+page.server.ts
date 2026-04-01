import { getCredentials, persistCredentials } from '$lib/server/azure-connection';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request }) => {
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
      return { success: true, message: 'Credentials saved successfully.' };
    } catch (error) {
      console.error('Error saving credentials:', error);
      return { success: false, message: 'Failed to save credentials.' };
    }
  }
};
