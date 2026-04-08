import { secrets } from 'bun';

const SERVICE_NAME = 'noOx9d/azure-story-map';

export async function persistConfluenceCredentials(
  baseUrl: string,
  email: string,
  apiToken: string
) {
  if (baseUrl) {
    await secrets.set({
      service: SERVICE_NAME,
      name: 'confluence-base-url',
      value: baseUrl
    });
  }
  if (email) {
    await secrets.set({
      service: SERVICE_NAME,
      name: 'confluence-email',
      value: email
    });
  }
  if (apiToken) {
    await secrets.set({
      service: SERVICE_NAME,
      name: 'confluence-api-token',
      value: apiToken
    });
  }
}

export async function getConfluenceCredentials() {
  const baseUrl = await secrets.get({
    service: SERVICE_NAME,
    name: 'confluence-base-url'
  });
  const email = await secrets.get({
    service: SERVICE_NAME,
    name: 'confluence-email'
  });
  const apiToken = await secrets.get({
    service: SERVICE_NAME,
    name: 'confluence-api-token'
  });

  if (!baseUrl || !email || !apiToken) {
    return null;
  }

  return { baseUrl, email, apiToken };
}

export function buildAuthHeader(email: string, apiToken: string): string {
  const encoded = Buffer.from(`${email}:${apiToken}`).toString('base64');
  return `Basic ${encoded}`;
}
