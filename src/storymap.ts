import type { WebApi } from "azure-devops-node-api";
import {
  QueryResultType,
  WorkItemExpand,
  type WorkItemQueryResult,
  type WorkItemRelation,
} from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";
import { Graphviz } from "@hpcc-js/wasm-graphviz";
import assert from "node:assert";

const GV = Graphviz.load();

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
}

export interface Edge {
  from: number;
  to: number;
  name: string;
}

const useRelations = [
  "System.LinkTypes.Dependency-Forward", // Successor
  "System.LinkTypes.Hierarchy-Forward", // Child
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
        from: wi.id,
        to: nodes.find((node) => node.url === relation.url!)?.id,
        name: relation.attributes?.["name"],
      }))
      .filter((edge) => edgeTargetIsExistingNode(edge));
  });

  return { nodes, edges };
}

function edgeTargetIsExistingNode(edge: Partial<Edge>): edge is Edge {
  return (
    edge.from != undefined && edge.to != undefined && edge.name != undefined
  );
}

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

export function generateDotGraph({
  nodes,
  edges,
  direction,
  splines,
}: {
  nodes: Node[];
  edges: Edge[];
  direction: string;
  splines: string;
}) {
  const renderedNodes = nodes.map(renderNode).join("\n");
  const renderedEdges = edges.map(renderEdge).join("\n");
  return `digraph StoryMap {
  splines=${splines}
  rankdir=${direction.toLowerCase() === "lb" ? "LB" : "TB"}
  node [shape=plaintext margin=0]
  
  ${renderedNodes}
  ${renderedEdges}
  }
  `;
}

function renderNode(node: Node): string {
  return `"${node.id}" [label=${generateNodeTableStyleLabel(node)}]`;
}

function escapeHTML(str: string) {
  const escapedChars: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  };
  return str.replace(/[&<>'"]/g, (tag: string) => escapedChars[tag]);
}

function generateNodeTableStyleLabel(node: Node): string {
  return `<
<TABLE CELLBORDER="0">
  <TR>
    <TD ROWSPAN="5" BGCOLOR="${getGraphvizColorForType(node)}" WIDTH="5" TOOLTIP="${node.type}"> </TD>
    <TD COLSPAN="2"><B>${node.id} </B> ${escapeHTML(node.title)}</TD>
  </TR>
  <TR>
    <TD ALIGN="LEFT">State: <FONT POINT-SIZE="20" COLOR="${getGraphvizColorForState(node)}">●</FONT> ${node.state}</TD>
  </TR>
</TABLE>>`;
}

function getGraphvizColorForType(node: Node): string {
  switch (node.type) {
    case "User Story":
      return "deepskyblue2";
    case "Task":
      return "yellow";
    case "Feature":
      return "darkorchid1";
    case "Epic":
      return "gold";
  }
  return "white";
}

function getGraphvizColorForState(node: Node): string {
  switch (node.state) {
    case "Active":
      return "royalblue";
    case "Ready":
      return "greenyellow";
    case "New":
      return "grey";
    case "Refinement":
      return "darkseagreen1";
    case "Closed":
      return "forestgreen";
    case "Product Increment":
      return "royalblue";
  }
  return "black";
}

function renderEdge(edge: Edge): string {
  return `"${edge.from}" -> "${edge.to}" [label="${edge.name}"]`;
}

export async function generateSvg(dotGraph: string): Promise<string> {
  const graphviz = await GV;
  return graphviz.dot(dotGraph);
}
