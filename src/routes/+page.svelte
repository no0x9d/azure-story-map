<script lang="ts">
  import dagre from '@dagrejs/dagre';
  import {
    Background,
    Controls,
    type Edge,
    MarkerType,
    MiniMap,
    type Node,
    Panel,
    Position,
    SvelteFlow
  } from '@xyflow/svelte';
  import { invalidateAll } from '$app/navigation';
  import { setLayoutContext } from '$lib/state.svelte.js';
  import StoryCard from '$lib/Story-Card.svelte';
  import ConfigureIssuesDialog from '$lib/ConfigureIssuesDialog.svelte';
  import SettingsDialog from '$lib/SettingsDialog.svelte';
  import EdgeTypeFilter from '$lib/ElementTypeFilter.svelte';
  import SaveLayoutDialog, { type SavedState } from '$lib/SaveLayoutDialog.svelte';
  import type { PageProps } from './$types';
  import { untrack } from 'svelte';

  import '@xyflow/svelte/dist/style.css';

  let { data }: PageProps = $props();
  let graph = $derived(data.graph);

  const nodeTypes = {
    storyCard: StoryCard
  };

  let layout = $state({ isHorizontal: false });
  setLayoutContext(layout);

  // Dialog state
  let dialogOpen = $state(false);
  let settingsOpen = $state(false);
  let saveLayoutOpen = $state(false);

  // Edge type filtering
  let allEdgeTypes = $derived.by(() => {
    const types = new Set<string>();
    graph.edges.forEach((e) => {
      if (e.name) types.add(e.name);
    });
    return Array.from(types).sort();
  });

  let visibleEdgeTypes = $state(new Set<string>());

  // Initialize visible edge types when all edge types change
  $effect(() => {
    if (allEdgeTypes.length > 0 && visibleEdgeTypes.size === 0) {
      visibleEdgeTypes = new Set(allEdgeTypes);
    }
  });

  // Issue type filtering
  let allIssueTypes = $derived.by(() => {
    const types = new Set<string>();
    graph.nodes.forEach((n) => {
      if (n.type) types.add(n.type);
    });
    return Array.from(types).sort();
  });

  let visibleIssueTypes = $state(new Set<string>());

  // Initialize visible issue types when all issue types change
  $effect(() => {
    if (allIssueTypes.length > 0 && visibleIssueTypes.size === 0) {
      visibleIssueTypes = new Set(allIssueTypes);
    }
  });

  let initialNodes = $derived.by(() =>
    graph.nodes
      .filter((n) => visibleIssueTypes.has(n.type))
      .map((n) => ({
        id: n.id.toString(10),
        type: 'storyCard',
        data: n,
        position: { x: 0, y: 0 }
      }))
  );

  let initialEdges = $derived.by(() =>
    graph.edges
      .filter((e) => visibleEdgeTypes.has(e.name))
      .map((e) => ({
        id: `${e.from}-${e.to}`,
        source: e.from.toString(10),
        target: e.to.toString(10),
        label: e.name,
        markerEnd: {
          type: MarkerType.Arrow
        }
      }))
  );

  function getLayoutedElements(nodes: Node[], edges: Edge[], direction: 'LR' | 'TB' = 'TB') {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth(node), height: nodeHeight(node) });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.targetPosition = isHorizontal ? Position.Left : Position.Top;
      node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth(node) / 2,
          y: nodeWithPosition.y - nodeHeight(node) / 2
        }
      };
    });

    // console.log(layoutedNodes);

    return { nodes: layoutedNodes, edges };
  }

  function nodeWidth(node: Node) {
    return node.measured?.width ?? 240;
  }

  function nodeHeight(node: Node) {
    return node.measured?.height ?? 36;
  }

  let nodes = $state.raw<Node[]>([]);
  let edges = $state.raw<Edge[]>([]);

  // Snapshot of node positions (id -> position).
  // Updated via onNodeDragStop so drag-and-drop positions survive data refreshes.
  let positionSnapshot = new Map<string, { x: number; y: number }>();

  // The canonical sorted node-ID key derived from the server graph.
  // Changes only when the query result returns a genuinely different set of nodes,
  // not when the same query is refreshed or when filters are toggled.
  let graphNodeKey = $derived(
    graph.nodes
      .map((n) => n.id)
      .sort()
      .join(',')
  );

  function onNodeDragStop() {
    updatePositionSnapshot(nodes);
  }

  function toggleEdgeType(edgeType: string) {
    const newVisible = new Set(visibleEdgeTypes);
    if (newVisible.has(edgeType)) {
      newVisible.delete(edgeType);
    } else {
      newVisible.add(edgeType);
    }
    visibleEdgeTypes = newVisible;
  }

  function toggleIssueType(issueType: string) {
    const newVisible = new Set(visibleIssueTypes);
    if (newVisible.has(issueType)) {
      newVisible.delete(issueType);
    } else {
      newVisible.add(issueType);
    }
    visibleIssueTypes = newVisible;
  }

  // The node-ID key that was in effect the last time Dagre ran.
  // Dagre only runs when this differs from graphNodeKey (i.e. the query changed).
  let lastLayoutKey = $state('');

  $effect(() => {
    const currentKey = graphNodeKey;
    const isNewQuery = currentKey !== untrack(() => lastLayoutKey);

    if (isNewQuery) {
      // The query result has a different set of nodes: run a full Dagre layout.
      // Existing positions from the snapshot are preserved; truly new nodes are laid out.
      untrack(() => {
        lastLayoutKey = currentKey;
      });
      const nodesWithPositions = initialNodes.map((n) => ({
        ...n,
        position: positionSnapshot.get(n.id) ?? n.position
      })) as unknown as Node[];
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodesWithPositions,
        initialEdges
      );
      nodes = layoutedNodes;
      edges = layoutedEdges;

      const hasNewNodes = initialNodes.some((n) => !positionSnapshot.has(n.id));
      if (hasNewNodes) {
        setTimeout(() => {
          // Force re-layout after initial render to get correct node sizes.
          onLayout(layout.isHorizontal ? 'LR' : 'TB');
        }, 5);
      }
    } else {
      // Same query refreshed, or filter toggled.
      // Merge updated node data and restore positions from the snapshot.
      // New nodes that appeared after a refresh are placed at the origin so the
      // user can position them manually.
      const dataById = new Map(initialNodes.map((n) => [n.id, n.data]));
      const snapshot = untrack(() => positionSnapshot);
      const currentNodes = untrack(() => nodes);
      const currentIsHorizontal = untrack(() => layout.isHorizontal);
      const direction = currentIsHorizontal ? 'LR' : 'TB';

      const existingById = new Map(currentNodes.map((n) => [n.id, n]));
      nodes = initialNodes.map((n) => {
        const existing = existingById.get(n.id);
        const position = snapshot.get(n.id) ?? existing?.position ?? n.position;
        return {
          ...(existing ?? n),
          data: dataById.get(n.id) ?? n.data,
          position,
          sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
          targetPosition: direction === 'LR' ? Position.Left : Position.Top
        } as unknown as Node;
      });
      edges = initialEdges;
    }
  });

  function handleImportState(state: SavedState) {
    // Apply filter selections (non-empty sets prevent the lazy-init effects from overriding)
    if (state.visibleEdgeTypes.length > 0) {
      visibleEdgeTypes = new Set(state.visibleEdgeTypes);
    }
    if (state.visibleIssueTypes.length > 0) {
      visibleIssueTypes = new Set(state.visibleIssueTypes);
    }

    // Build the position snapshot from the saved state.
    const map = new Map<string, { x: number; y: number }>();
    for (const [id, pos] of Object.entries(state.positions)) {
      map.set(id, pos);
    }
    positionSnapshot = map;

    // Apply saved positions to the current nodes immediately.
    // The layout $effect won't do this because all node IDs already exist in the
    // snapshot, so it falls into the data-only merge branch and skips repositioning.
    // Update sourcePosition/targetPosition on each node so NodeWrapper's $effect fires
    // and calls store.updateNodeInternals, which re-reads data-handlepos from the DOM.
    // This keeps SvelteFlow's internal handle bounds (used for edge routing) in sync
    // with the imported layout direction. Without this, edges route to the wrong side
    // even though the Handle CSS classes (driven by layout context) are correct.
    const importedIsHorizontal = state.layout.isHorizontal;
    nodes = untrack(() => nodes).map((n) => ({
      ...n,
      position: map.get(n.id) ?? n.position,
      sourcePosition: importedIsHorizontal ? Position.Right : Position.Bottom,
      targetPosition: importedIsHorizontal ? Position.Left : Position.Top
    }));
    edges = untrack(() => edges);

    layout.isHorizontal = importedIsHorizontal;
  }

  function updatePositionSnapshot(updatedNodes: Node[]) {
    const map = new Map<string, { x: number; y: number }>();
    for (const n of updatedNodes) {
      map.set(n.id, { ...n.position });
    }
    positionSnapshot = map;
  }

  function handleDelete({
    nodes: deletedNodes,
    edges: deletedEdges
  }: {
    nodes: Node[];
    edges: Edge[];
  }) {
    const deletedNodeIds = new Set(deletedNodes.map((n) => n.id));
    const deletedEdgeIds = new Set(deletedEdges.map((e) => e.id));

    nodes = untrack(() => nodes).filter((n) => !deletedNodeIds.has(n.id));
    edges = untrack(() => edges).filter((e) => !deletedEdgeIds.has(e.id));

    // Keep the position snapshot in sync
    for (const id of deletedNodeIds) {
      positionSnapshot.delete(id);
    }
  }

  function onLayout(direction: 'LR' | 'TB') {
    layout.isHorizontal = direction === 'LR';
    const layoutedElements = getLayoutedElements(
      untrack(() => nodes),
      untrack(() => edges),
      direction
    );

    nodes = layoutedElements.nodes;
    edges = layoutedElements.edges;
    updatePositionSnapshot(layoutedElements.nodes);
  }
</script>

<div style:height="100vh">
  <SvelteFlow
    bind:nodes
    bind:edges
    {nodeTypes}
    minZoom={0.1}
    fitView
    onnodedragstop={onNodeDragStop}
    ondelete={handleDelete}
  >
    <Controls />
    <Background />
    <MiniMap />
    <Panel position="top-left">
      <ConfigureIssuesDialog bind:open={dialogOpen} />
      <SettingsDialog bind:open={settingsOpen} />
      <SaveLayoutDialog
        bind:open={saveLayoutOpen}
        {nodes}
        {layout}
        {visibleEdgeTypes}
        {visibleIssueTypes}
        onimport={handleImportState}
      />
    </Panel>
    <Panel position="top-right">
      <button class="rounded outline p-1 bg-white" onclick={() => invalidateAll()}
        >refresh data</button
      >
      <button class="rounded outline p-1 bg-white" onclick={() => onLayout('TB')}
        >vertical layout</button
      >
      <button class="rounded outline p-1 bg-white" onclick={() => onLayout('LR')}
        >horizontal layout</button
      >
      <EdgeTypeFilter
        edgeTypes={allEdgeTypes}
        {visibleEdgeTypes}
        issueTypes={allIssueTypes}
        {visibleIssueTypes}
        ontoggle={toggleEdgeType}
        ontoggleIssueType={toggleIssueType}
      />
    </Panel>
  </SvelteFlow>
</div>
