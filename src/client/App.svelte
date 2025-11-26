<script lang="ts">
  import {
    SvelteFlow,
    Controls,
    Background,
    MiniMap,
    type Node,
    type Edge,
  } from "@xyflow/svelte";

  import "@xyflow/svelte/dist/style.css";
  import StoryCard from "./Story-Card.svelte";

  const nodeTypes = {
    storyCard: StoryCard,
  };

  let nodes = $state.raw<Node[]>([
    {
      id: "1",
      type: "storyCard",
      data: {
        id: 12345,
        title: "Implement user authentication",
        state: "Active",
        estimation: 8,
        type: "User Story",
      },
      position: { x: 0, y: 0 },
    },
    {
      id: "2",
      type: "storyCard",
      data: {
        id: 12346,
        title: "Create login form with validation",
        state: "New",
        estimation: 5,
        type: "Task",
      },
      position: { x: 300, y: 150 },
    },
    {
      id: "3",
      type: "storyCard",
      data: {
        id: 12347,
        title: "Fix password reset bug",
        state: "Resolved",
        estimation: 3,
        type: "Bug",
      },
      position: { x: 0, y: 300 },
    },
  ]);

  let edges = $state.raw<Edge[]>([
    {
      id: "1-2",
      source: "1",
      target: "2",
    },
    {
      id: "1-3",
      source: "1",
      target: "3",
    },
  ]);
</script>

<div style:height="100vh">
  <SvelteFlow bind:nodes bind:edges {nodeTypes} fitView>
    <Controls />
    <Background />
    <MiniMap />
  </SvelteFlow>
</div>
