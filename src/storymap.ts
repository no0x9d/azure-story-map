import type { WebApi } from "azure-devops-node-api";
import {
  QueryResultType,
  WorkItemExpand,
  WorkItemQueryResult,
  type WorkItemRelation,
} from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";
import assert from "node:assert";

export interface GetDependenciesOptions {
  connection: WebApi;
  query: string;
}

interface Node {
  id: number;
  area: string;
  type: string;
  state: string;
  title: string;
  parent: number;
  url: string;
}

interface Edge {
  from: string; // url
  to: string; // url
  name: string;
}

const useRelations = [
  "System.LinkTypes.Dependency-Forward", // Successor
];

export async function getDependencies({
  connection,
  query,
}: GetDependenciesOptions) {
  const workApi = await connection.getWorkItemTrackingApi();

  const queryResult = await workApi.queryByWiql({
    query,
  });

  const idsToQuery: number[] = getWorkItemIdsFromResult(queryResult);

  // const fieldsToQuery = [
  //   'System.AreaPath',
  //   'System.WorkItemType',
  //   'System.State',
  //   'System.Title',
  //   'System.Parent'
  // ];

  const workItems = await workApi.getWorkItems(
    idsToQuery,
    undefined,
    undefined,
    WorkItemExpand.Relations,
  );

  const nodes: Node[] = workItems.map((wi) => {
    const fields = wi.fields!;

    return {
      id: wi.id!,
      area: fields["System.AreaPath"],
      state: fields["System.State"],
      type: fields["System.WorkItemType"],
      title: fields["System.Title"],
      parent: fields["System.Parent"],
      url: wi.url!,
    };
  });

  const edges: Edge[] = workItems.flatMap((wi) => {
    const relations: WorkItemRelation[] = wi.relations ?? [];
    return relations
      .filter((relation) => relation.rel && useRelations.includes(relation.rel))
      .map((relation) => ({
        from: wi.url!,
        to: relation.url!,
        name: relation.attributes!["name"],
      }))
      .filter((edge) => edgeTargetIsExistingNode(nodes, edge));
  });

  return { nodes, edges };
}

function edgeTargetIsExistingNode(nodes: Node[], edge: Edge): boolean {
  return nodes.some((node) => node.url === edge.to);
}

// function relationIsSuccessor(relation: WorkItemRelation): boolean {
//   return relation.rel === "System.LinkTypes.Dependency-Forward";
// }

function getWorkItemIdsFromResult(queryResult: WorkItemQueryResult): number[] {
  if (queryResult.queryResultType === QueryResultType.WorkItem) {
    const workItems = queryResult.workItems;
    assert.ok(workItems, "workItems on result must exist");

    return workItems
      .map((wi) => wi.id)
      .filter((id): id is number => id != null);
  } else {
    // query for trees or lists with one hop generate only relations
    const workItemRelations = queryResult.workItemRelations;
    assert.ok(workItemRelations, "workItemRelations on result must exist");

    const idsWithDuplicates = workItemRelations
      .flatMap((wir) => [wir.source?.id, wir.target?.id])
      .filter((id): id is number => id != null);
    return Array.from(new Set(idsWithDuplicates));
  }
}
