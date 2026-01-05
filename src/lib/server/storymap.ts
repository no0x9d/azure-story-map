import type { WebApi } from 'azure-devops-node-api';
import {
	QueryResultType,
	WorkItemExpand,
	type WorkItemQueryResult,
	type WorkItemRelation
} from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js';
import assert from 'node:assert';

export interface GetDependenciesOptions {
	connection: WebApi;
	query: string;
}

export interface Node {
	id: number;
	area: string;
	type: string;
	state: string;
	title: string;
	parent: number;
	url: string;
	webUrl: string;
	description?: string;
	acceptanceCriteria?: string;
	estimationStoryPoints?: number;
	estimationEffort?: number;
}

export interface Edge {
	from: number;
	to: number;
	name: string;
}

const useRelations = [
	'System.LinkTypes.Dependency-Forward', // Successor
	'System.LinkTypes.Hierarchy-Forward' // Child
];

export async function extractIdsFromQuery({
	connection,
	query
}: {
	connection: WebApi;
	query: string;
}): Promise<number[]> {
	const workApi = await connection.getWorkItemTrackingApi();

	const queryResult = await workApi.queryByWiql({
		query
	});

	return getWorkItemIdsFromResult(queryResult);
}

export async function getDependencies({ connection, ids }: { connection: WebApi; ids: number[] }) {
	const workApi = await connection.getWorkItemTrackingApi();

	const workItems = await workApi.getWorkItems(ids, undefined, undefined, WorkItemExpand.Relations);

	const nodes: Node[] = workItems.map((wi) => {
		const fields = wi.fields!;

		return {
			id: wi.id!,
			area: fields['System.AreaPath'],
			state: fields['System.State'],
			type: fields['System.WorkItemType'],
			title: fields['System.Title'],
			parent: fields['System.Parent'],
			url: wi.url!,
			webUrl: wi.url!.replace('/_apis/wit/workItems/', '/_workitems/edit/'),
			description: fields['System.Description'],
			acceptanceCriteria: fields['Microsoft.VSTS.Common.AcceptanceCriteria'],
			estimationStoryPoints: fields['Microsoft.VSTS.Scheduling.StoryPoints'],
			estimationEffort: fields['Microsoft.VSTS.Scheduling.Effort']
		};
	});

	const edges: Edge[] = workItems.flatMap((wi) => {
		const relations: WorkItemRelation[] = wi.relations ?? [];
		return relations
			.filter((relation) => relation.rel && useRelations.includes(relation.rel))
			.map((relation) => ({
				from: wi.id,
				to: nodes.find((node) => node.url === relation.url!)?.id,
				name: relation.attributes?.['name']
			}))
			.filter((edge) => edgeTargetIsExistingNode(edge));
	});

	return { nodes, edges };
}

function edgeTargetIsExistingNode(edge: Partial<Edge>): edge is Edge {
	return edge.from != undefined && edge.to != undefined && edge.name != undefined;
}

function getWorkItemIdsFromResult(queryResult: WorkItemQueryResult): number[] {
	if (queryResult.queryResultType === QueryResultType.WorkItem) {
		const workItems = queryResult.workItems;
		assert.ok(workItems, 'workItems on result must exist');

		return workItems.map((wi) => wi.id).filter((id): id is number => id != null);
	} else {
		// query for trees or lists with one hop generate only relations
		const workItemRelations = queryResult.workItemRelations;
		assert.ok(workItemRelations, 'workItemRelations on result must exist');

		const idsWithDuplicates = workItemRelations
			.flatMap((wir) => [wir.source?.id, wir.target?.id])
			.filter((id): id is number => id != null);
		return Array.from(new Set(idsWithDuplicates));
	}
}
