<script lang="ts">
  import {
    SvelteFlow,
    Controls,
    Background,
    MiniMap,
    MarkerType,
    Panel,
    type Node,
    type Edge, Position
  } from '@xyflow/svelte';
  import dagre from '@dagrejs/dagre';

  import "@xyflow/svelte/dist/style.css";
  import StoryCard from "./Story-Card.svelte";

  const nodeTypes = {
    storyCard: StoryCard,
  };

  const graph = await fetch('/graph').then(res => res.json()); // TODO add types

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  let initialNodes = graph.nodes.map(n => ({
      id: n.id.toString(10),
      type: "storyCard",
      data: n,
      position: { x: 0, y: 0 },
    }))


  let initialEdges = graph.edges.map(e => ({
    id: `${e.from}-${e.to}`,
    source: e.from.toString(10),
    target: e.to.toString(10),
    label: e.name,
    markerEnd: {
      type: MarkerType.Arrow,
    },
  }))

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
          y: nodeWithPosition.y - nodeHeight(node) / 2,
        },
      };
    });

    console.log(layoutedNodes);

    return { nodes: layoutedNodes, edges };
  }

  function nodeWidth(node: Node) {
    return node.measured?.width ?? 240;
  }

  function nodeHeight(node: Node) {
    return node.measured?.height ?? 36;
  }

  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    initialNodes,
    initialEdges,
  );

  let nodes = $state.raw<Node[]>(layoutedNodes);
  let edges = $state.raw<Edge[]>(layoutedEdges);

  function onLayout(direction: 'LR' | 'TB') {
    const layoutedElements = getLayoutedElements(nodes, edges, direction);

    nodes = layoutedElements.nodes;
    edges = layoutedElements.edges;
  }

  setTimeout(() => {
    // Force re-layout after initial render to get correct node sizes
    onLayout('TB');
  }, 5);
</script>

<div style:height="100vh">
  <SvelteFlow bind:nodes bind:edges {nodeTypes} fitView>
    <Controls />
    <Background />
    <MiniMap />
    <Panel position="top-right">
      <button onclick={() => onLayout('TB')}>vertical layout</button>
      <button onclick={() => onLayout('LR')}>horizontal layout</button>
    </Panel>
  </SvelteFlow>
</div>
