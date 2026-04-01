import { getCredentials, createConnection } from '$lib/server/azure-connection';
import { extractIdsFromQuery, getDependencies } from '$lib/server/storymap';
import type { LayoutServerLoad } from './$types';

export const prerender = false;

export const load: LayoutServerLoad = async ({ url }) => {
  const credentials = await getCredentials();
  if (!credentials) {
    console.log('No credentials found');

    return {
      graph: {
        nodes: [],
        edges: []
      },
      azureBaseUrl: null,
      hasToken: false,
      issues: ['No Azure DevOps credentials found. Please set up your connection first.']
    } as {
      graph: Awaited<ReturnType<typeof getDependencies>>;
      azureBaseUrl: string | null;
      hasToken: boolean;
      issues: string[];
    };
  }

  const DEFAULT_CONNECTION = await createConnection(credentials.orgUrl, credentials.token);
  const wiqlQuery = url.searchParams.get('wiql');

  if (wiqlQuery) {
    console.log('use query: ' + wiqlQuery);
    const ids = await extractIdsFromQuery({ query: wiqlQuery!, connection: DEFAULT_CONNECTION });
    const dependencies = await getDependencies({
      connection: DEFAULT_CONNECTION,
      ids
    });
    return { graph: dependencies, azureBaseUrl: credentials.orgUrl, hasToken: true };
  }
  if (url.searchParams.has('ids')) {
    console.log('use ids: ' + url.searchParams.get('ids'));
    const idsParam = url.searchParams.get('ids')!;
    const ids = idsParam
      .split(',')
      .map((idStr) => parseInt(idStr.trim(), 10))
      .filter((id) => !isNaN(id));
    const dependencies = await getDependencies({
      connection: DEFAULT_CONNECTION,
      ids
    });
    return { graph: dependencies, azureBaseUrl: credentials.orgUrl, hasToken: true };
  }

  return {
    graph: {
      nodes: [],
      edges: []
    },
    azureBaseUrl: credentials.orgUrl,
    hasToken: true
  } as {
    graph: Awaited<ReturnType<typeof getDependencies>>;
    azureBaseUrl: string;
    hasToken: boolean;
  };
};
