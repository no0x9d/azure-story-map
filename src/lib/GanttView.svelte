<script lang="ts">
  import { Gantt, Willow } from '@svar-ui/svelte-gantt';
  import type { Node as StoryNode, Edge as StoryEdge } from '$lib/server/storymap';
  import GanttTaskBar from '$lib/GanttTaskBar.svelte';

  interface Props {
    nodes: StoryNode[];
    edges: StoryEdge[];
  }

  let { nodes, edges }: Props = $props();

  // 1 Story Point = 1 days in the Gantt chart (durationUnit is "day")
  const DAYS_PER_SP = 1;
  const SP_DURATION_DEFAULT = 1;

  /**
   * Build Gantt tasks and links from the story map graph.
   *
   * - "Child" edges establish parent-child nesting.
   * - "Successor" edges become end-to-start dependency links.
   * - Story points determine bar duration (1 SP = 1 week = 7 days).
   * - Tasks without predecessors start at "today".
   * - Successor tasks are placed after their predecessors via topological scheduling.
   */
  let ganttData = $derived.by(() => {
    // Determine parent-child relationships from "Child" edges
    const childEdges = edges.filter((e) => e.name === 'Child');
    const successorEdges = edges.filter((e) => e.name === 'Successor');

    const nodeIds = new Set(nodes.map((n) => n.id));

    // Map of child ID -> parent ID (only for nodes present in the set)
    const parentMap = new Map<number, number>();
    childEdges.forEach((e) => {
      // "Child" edge: from = parent, to = child
      if (nodeIds.has(e.from) && nodeIds.has(e.to)) {
        parentMap.set(e.to, e.from);
      }
    });

    // Set of node IDs that have children present in the current set
    const hasChildren = new Set<number>();
    childEdges.forEach((e) => {
      if (nodeIds.has(e.from) && nodeIds.has(e.to)) {
        hasChildren.add(e.from);
      }
    });

    // Build adjacency list for successor dependencies (for topological scheduling)
    // predecessor -> successors[]
    const successors = new Map<number, number[]>();
    const predecessorCount = new Map<number, number>();

    successorEdges.forEach((e) => {
      if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) return;
      if (!successors.has(e.from)) successors.set(e.from, []);
      successors.get(e.from)!.push(e.to);
      predecessorCount.set(e.to, (predecessorCount.get(e.to) ?? 0) + 1);
    });

    // Topological sort to compute start dates
    // Tasks without predecessors start at "today"
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDates = new Map<number, Date>();
    const durationsDays = new Map<number, number>();

    // Compute duration for each node (in days: SP * 7)
    nodes.forEach((n) => {
      const sp = n.estimationStoryPoints ?? n.estimationEffort ?? SP_DURATION_DEFAULT;
      durationsDays.set(n.id, Math.max(sp, SP_DURATION_DEFAULT) * DAYS_PER_SP);
    });

    // BFS topological traversal
    const queue: number[] = [];
    nodes.forEach((n) => {
      if (!predecessorCount.has(n.id) || predecessorCount.get(n.id) === 0) {
        queue.push(n.id);
        startDates.set(n.id, new Date(today));
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentStart = startDates.get(current)!;
      const currentDuration = durationsDays.get(current) ?? DAYS_PER_SP;

      // End date = start + duration days
      const endDate = new Date(currentStart);
      endDate.setDate(endDate.getDate() + currentDuration);

      const succs = successors.get(current) ?? [];
      for (const succ of succs) {
        // Successor starts after predecessor ends
        const existingStart = startDates.get(succ);
        if (!existingStart || endDate > existingStart) {
          startDates.set(succ, new Date(endDate));
        }

        const count = (predecessorCount.get(succ) ?? 1) - 1;
        predecessorCount.set(succ, count);
        if (count <= 0) {
          queue.push(succ);
        }
      }
    }

    // Handle any nodes not reached by the traversal (isolated or cyclic)
    nodes.forEach((n) => {
      if (!startDates.has(n.id)) {
        startDates.set(n.id, new Date(today));
      }
    });

    // Adjust start dates and durations for summary tasks (parents) so they
    // span from the earliest child start to the latest child end.
    // Build a map of parent -> children IDs first.
    const childrenMap = new Map<number, number[]>();
    parentMap.forEach((parentId, childId) => {
      if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
      childrenMap.get(parentId)!.push(childId);
    });

    // Process parents bottom-up: if parents can be nested, handle deepest first.
    // We iterate until no more changes occur (handles multi-level nesting).
    let changed = true;
    while (changed) {
      changed = false;
      for (const [parentId, children] of childrenMap) {
        if (children.length === 0) continue;

        let earliestStart: Date | null = null;
        let latestEnd: Date | null = null;

        for (const childId of children) {
          const childStart = startDates.get(childId);
          const childDuration = durationsDays.get(childId) ?? DAYS_PER_SP;
          if (!childStart) continue;

          const childEnd = new Date(childStart);
          childEnd.setDate(childEnd.getDate() + childDuration);

          if (!earliestStart || childStart < earliestStart) {
            earliestStart = new Date(childStart);
          }
          if (!latestEnd || childEnd > latestEnd) {
            latestEnd = new Date(childEnd);
          }
        }

        if (earliestStart && latestEnd) {
          const newDuration = Math.round(
            (latestEnd.getTime() - earliestStart.getTime()) / (1000 * 60 * 60 * 24)
          );
          const oldStart = startDates.get(parentId);
          const oldDuration = durationsDays.get(parentId);

          if (
            !oldStart ||
            oldStart.getTime() !== earliestStart.getTime() ||
            oldDuration !== newDuration
          ) {
            startDates.set(parentId, earliestStart);
            durationsDays.set(parentId, newDuration);
            changed = true;
          }
        }
      }
    }

    // Build SVAR Gantt tasks
    // Only reference parents that exist in the current node set.
    // If a parent was filtered out, the child becomes a root-level task.
    const tasks = nodes.map((n) => {
      const start = startDates.get(n.id)!;
      const duration = durationsDays.get(n.id) ?? DAYS_PER_SP;
      const isSummary = hasChildren.has(n.id);
      const rawParent = parentMap.get(n.id);
      const parentId = rawParent !== undefined && nodeIds.has(rawParent) ? rawParent : 0;

      return {
        id: n.id,
        text: `${n.title}`,
        start: new Date(start),
        duration: duration,
        // progress: stateToProgress(n.state),
        type: isSummary ? 'summary' : ('task' as 'summary' | 'task' | 'milestone'),
        parent: parentId,
        open: isSummary,
        // Custom fields for column display
        storyPoints: n.estimationStoryPoints ?? n.estimationEffort,
        workItemType: n.type,
        state: n.state,
        webUrl: n.webUrl
      };
    });

    // Build SVAR Gantt links from Successor edges (end-to-start)
    // Only include links where both source and target exist in the task set
    const taskIds = new Set(tasks.map((t) => t.id));
    const links = successorEdges
      .filter((e) => taskIds.has(e.from) && taskIds.has(e.to))
      .map((e, i) => ({
        id: i + 1,
        source: e.from,
        target: e.to,
        type: 'e2s' as const
      }));

    return { tasks, links };
  });

  // Scale configuration: month header + week detail
  const scales = [{ unit: 'day' as const, step: 1, format: '1 SP' }];

  // Column configuration for the task grid
  const columns = [
    { id: 'id', header: 'ID', width: 70 },
    { id: 'text', header: 'Task', flexgrow: 3 },
    {
      id: 'storyPoints',
      header: 'SP',
      width: 50,
      align: 'center' as const
    },
    {
      id: 'workItemType',
      header: 'Type',
      width: 100,
      align: 'center' as const
    },
    {
      id: 'state',
      header: 'State',
      width: 110,
      align: 'center' as const
    }
  ];
</script>

<div class="gantt-container">
  {#if ganttData.tasks.length > 0}
    <Willow>
      <Gantt
        tasks={ganttData.tasks}
        links={ganttData.links}
        {scales}
        {columns}
        cellHeight={36}
        cellWidth={60}
        readonly={true}
        taskTemplate={GanttTaskBar}
      />
    </Willow>
  {:else}
    <div class="empty-state">
      <p>No tasks to display. Load work items or adjust your filters.</p>
    </div>
  {/if}
</div>

<style>
  .gantt-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #6b7280;
    font-size: 14px;
  }
</style>
