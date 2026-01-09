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
  import { setLayoutContext } from '$lib/state.svelte.js';
  import StoryCard from '$lib/Story-Card.svelte';
  import ConfigureIssuesDialog from '$lib/ConfigureIssuesDialog.svelte';
  import SettingsDialog from '$lib/SettingsDialog.svelte';
  import EdgeTypeFilter from '$lib/EdgeTypeFilter.svelte';
  import type { PageProps } from './$types';

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

  // Edge type filtering
  let allEdgeTypes = $derived.by(() => {
    const types = new Set<string>();
    graph.edges.forEach(e => {
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

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  let initialNodes = $derived.by(() => graph.nodes.map(n => ({
    id: n.id.toString(10),
    type: 'storyCard',
    data: n,
    position: { x: 0, y: 0 }
  })));


  let initialEdges = $derived.by(() => graph.edges
    .filter(e => visibleEdgeTypes.has(e.name))
    .map(e => ({
      id: `${e.from}-${e.to}`,
      source: e.from.toString(10),
      target: e.to.toString(10),
      label: e.name,
      markerEnd: {
        type: MarkerType.Arrow
      }
    })));

  function getLayoutedElements(nodes: Node[], edges: Edge[], direction: 'LR' | 'TB' = 'TB') {
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

  function toggleEdgeType(edgeType: string) {
    const newVisible = new Set(visibleEdgeTypes);
    if (newVisible.has(edgeType)) {
      newVisible.delete(edgeType);
    } else {
      newVisible.add(edgeType);
    }
    visibleEdgeTypes = newVisible;
  }

  $effect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );
    nodes = layoutedNodes;
    edges = layoutedEdges;

    setTimeout(() => {
      // Force re-layout after initial render to get correct node sizes
      onLayout('TB');
    }, 5);
  });

  function onLayout(direction: 'LR' | 'TB') {
    layout.isHorizontal = direction === 'LR';
    const layoutedElements = getLayoutedElements(nodes, edges, direction);

    nodes = layoutedElements.nodes;
    edges = layoutedElements.edges;
  }
</script>

<div style:height="100vh">
  <SvelteFlow bind:nodes bind:edges {nodeTypes} fitView>
    <Controls />
    <Background />
    <MiniMap />
    <Panel position="top-left">
      <ConfigureIssuesDialog bind:open={dialogOpen} />
      <SettingsDialog bind:open={settingsOpen} />

    </Panel>
    <Panel position="top-right">
      <button class="rounded outline p-1 bg-white" onclick={() => onLayout('TB')}>vertical layout</button>
      <button class="rounded outline p-1 bg-white" onclick={() => onLayout('LR')}>horizontal layout</button>
      <EdgeTypeFilter
        edgeTypes={allEdgeTypes}
        {visibleEdgeTypes}
        ontoggle={toggleEdgeType}
      />
    </Panel>
  </SvelteFlow>
</div>
