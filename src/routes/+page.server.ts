import { getCredentials, persistCredentials, createConnection } from '$lib/server/azure-connection';
import { extractIdsFromQuery, getDependencies } from '$lib/server/storymap';
import type { PageServerLoad, Actions } from './$types';

export const prerender = false;

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const orgUrl = formData.get('azureBaseUrl') as string;
		const token = formData.get('azurePat') as string;

		if (!orgUrl || !token) {
			return { success: false, message: 'Organization URL and Token are required.' };
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

export const load: PageServerLoad = async ({ url }) => {
	const credentials = await getCredentials();
	if (!credentials) {
		console.log('No credentials found');

		return {
			graph: {
				nodes: [],
				edges: []
			},
			issues: ['No Azure DevOps credentials found. Please set up your connection first.']
		} as { graph: Awaited<ReturnType<typeof getDependencies>>; issues: string[] };
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
		return { graph: dependencies };
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
		return { graph: dependencies };
	}

	return {
		graph: {
			nodes: [],
			edges: []
		}
	} as { graph: Awaited<ReturnType<typeof getDependencies>> };
};
