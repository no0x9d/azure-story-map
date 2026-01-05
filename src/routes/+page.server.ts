import { DEFAULT_CONNECTION } from '$lib/server/azure-connection';
import { extractIdsFromQuery, getDependencies } from '$lib/server/storymap';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ url }) => {
	const wiqlQuery = url.searchParams.get('wiql');

	if (wiqlQuery) {
		console.log('use query: ' + wiqlQuery);
		const ids = await extractIdsFromQuery({ query: wiqlQuery!, connection: DEFAULT_CONNECTION });
		const dependencies = await getDependencies({
			connection: DEFAULT_CONNECTION,
			ids
		});
		return {graph: dependencies};
	}
	if (url.searchParams.has('ids')) {
		console.log('use ids: ' + url.searchParams.get('ids'));
		const idsParam = url.searchParams.get('ids')!;
		const ids = idsParam.split(',').map(idStr => parseInt(idStr.trim(), 10)).filter(id => !isNaN(id));
		const dependencies = await getDependencies({
			connection: DEFAULT_CONNECTION,
			ids
		});
		return {graph: dependencies};
	}

	return {
		graph: {
			nodes: [] ,
			edges: []
		}
	} as {graph: Awaited<ReturnType<typeof getDependencies>>};
};
