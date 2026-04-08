import {
  getConfluenceCredentials,
  persistConfluenceCredentials
} from '$lib/server/confluence-connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const credentials = await getConfluenceCredentials();
  return json({
    configured: credentials !== null,
    baseUrl: credentials?.baseUrl ?? null,
    email: credentials?.email ?? null
    // api token intentionally omitted
  });
};

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as {
    baseUrl?: string;
    email?: string;
    apiToken?: string;
  };

  const { baseUrl, email, apiToken } = body;

  if (!baseUrl || !email) {
    return json({ success: false, message: 'Base URL and email are required.' }, { status: 400 });
  }

  // If no new token provided, keep existing one
  let tokenToSave = apiToken;
  if (!tokenToSave) {
    const existing = await getConfluenceCredentials();
    if (!existing?.apiToken) {
      return json({ success: false, message: 'An API token is required.' }, { status: 400 });
    }
    tokenToSave = existing.apiToken;
  }

  try {
    await persistConfluenceCredentials(baseUrl, email, tokenToSave);
    return json({ success: true });
  } catch (error) {
    console.error('Error saving Confluence credentials:', error);
    return json({ success: false, message: 'Failed to save credentials.' }, { status: 500 });
  }
};
