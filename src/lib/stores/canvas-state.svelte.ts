import { type Edge, type Node, Position, MarkerType } from '@xyflow/svelte';
import { untrack } from 'svelte';
import { getLayoutedElements } from '$lib/layout/dagre';
import type { Node as StoryNode, Edge as StoryEdge } from '$lib/types';

export interface ImportedLayoutState {
  layout: { isHorizontal: boolean };
  visibleEdgeTypes: string[];
  visibleStatesByType: Record<string, string[]>;
  positions: Record<string, { x: number; y: number }>;
}

/**
 * Manages the SvelteFlow canvas state: node/edge arrays, positions,
 * deletions, and layout orchestration.
 */
export class CanvasState {
  nodes = $state.raw<Node[]>([]);
  edges = $state.raw<Edge[]>([]);

  /** Set of node IDs interactively deleted from the canvas */
  deletedNodeIds = $state(new Set<string>());

  /** Set of node IDs that are collapsed (their children are hidden) */
  collapsedNodeIds = $state(new Set<string>());

  /** Snapshot of node positions (id -> position) */
  positionSnapshot = new Map<string, { x: number; y: number }>();

  /** Last graph-node key used for layout — tracks when to re-layout */
  #lastLayoutKey = $state('');

  #getFilteredNodes: () => StoryNode[] = () => [];
  #getFilteredEdges: () => StoryEdge[] = () => [];
  #getGraphNodes: () => StoryNode[] = () => [];
  #layout: { isHorizontal: boolean } = { isHorizontal: false };

  /** Map of parent ID -> set of direct child IDs, built from "Child" edges */
  #childrenMap = $derived.by(() => {
    const map = new Map<string, Set<string>>();
    for (const e of this.#getFilteredEdges()) {
      if (e.name === 'Child') {
        const parentId = e.from.toString(10);
        const childId = e.to.toString(10);
        if (!map.has(parentId)) map.set(parentId, new Set());
        map.get(parentId)!.add(childId);
      }
    }
    return map;
  });

  /** Set of all node IDs hidden due to collapsed ancestors */
  #hiddenNodeIds = $derived.by(() => {
    const hidden = new Set<string>();
    const collapse = (parentId: string) => {
      const children = this.#childrenMap.get(parentId);
      if (!children) return;
      for (const childId of children) {
        if (!hidden.has(childId)) {
          hidden.add(childId);
          // Recursively hide descendants regardless of their own collapse state
          collapse(childId);
        }
      }
    };
    for (const id of this.collapsedNodeIds) {
      collapse(id);
    }
    return hidden;
  });

  /** SvelteFlow-formatted initial nodes derived from filtered data */
  #initialNodes = $derived.by(() =>
    this.#getFilteredNodes()
      .filter((n) => !this.#hiddenNodeIds.has(n.id.toString(10)))
      .map((n) => ({
        id: n.id.toString(10),
        type: 'storyCard' as const,
        data: n,
        position: { x: 0, y: 0 }
      }))
  );

  /** SvelteFlow-formatted initial edges derived from filtered data */
  #initialEdges = $derived.by(() =>
    this.#getFilteredEdges()
      .filter((e) => {
        const sourceId = e.from.toString(10);
        const targetId = e.to.toString(10);
        return !this.#hiddenNodeIds.has(sourceId) && !this.#hiddenNodeIds.has(targetId);
      })
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

  /** Sorted node-ID key from server graph — changes when query result changes */
  #graphNodeKey = $derived(
    this.#getGraphNodes()
      .map((n) => n.id)
      .sort()
      .join(',')
  );

  constructor(opts: {
    getFilteredNodes: () => StoryNode[];
    getFilteredEdges: () => StoryEdge[];
    getGraphNodes: () => StoryNode[];
    layout: { isHorizontal: boolean };
  }) {
    this.#getFilteredNodes = opts.getFilteredNodes;
    this.#getFilteredEdges = opts.getFilteredEdges;
    this.#getGraphNodes = opts.getGraphNodes;
    this.#layout = opts.layout;

    // Main layout/merge effect
    $effect(() => {
      const currentKey = this.#graphNodeKey;
      const isNewQuery = currentKey !== untrack(() => this.#lastLayoutKey);

      if (isNewQuery) {
        untrack(() => {
          this.#lastLayoutKey = currentKey;
          this.deletedNodeIds = new Set<string>();
        });
        const nodesWithPositions = this.#initialNodes.map((n) => ({
          ...n,
          position: this.positionSnapshot.get(n.id) ?? n.position
        })) as unknown as Node[];
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          nodesWithPositions,
          this.#initialEdges as unknown as Edge[]
        );
        this.nodes = layoutedNodes;
        this.edges = layoutedEdges;

        const hasNewNodes = this.#initialNodes.some((n) => !this.positionSnapshot.has(n.id));
        if (hasNewNodes) {
          setTimeout(() => {
            this.onLayout(this.#layout.isHorizontal ? 'LR' : 'TB');
          }, 5);
        }
      } else {
        const dataById = new Map(this.#initialNodes.map((n) => [n.id, n.data]));
        const snapshot = untrack(() => this.positionSnapshot);
        const currentNodes = untrack(() => this.nodes);
        const currentIsHorizontal = untrack(() => this.#layout.isHorizontal);
        const direction = currentIsHorizontal ? 'LR' : 'TB';

        const existingById = new Map(currentNodes.map((n) => [n.id, n]));
        this.nodes = this.#initialNodes.map((n) => {
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
        this.edges = this.#initialEdges as unknown as Edge[];
      }
    });
  }

  onNodeDragStop() {
    this.updatePositionSnapshot(this.nodes);
  }

  updatePositionSnapshot(updatedNodes: Node[]) {
    const map = new Map<string, { x: number; y: number }>();
    for (const n of updatedNodes) {
      map.set(n.id, { ...n.position });
    }
    this.positionSnapshot = map;
  }

  handleDelete({ nodes: deletedNodes, edges: deletedEdges }: { nodes: Node[]; edges: Edge[] }) {
    const removedNodeIds = new Set(deletedNodes.map((n) => n.id));
    const removedEdgeIds = new Set(deletedEdges.map((e) => e.id));

    this.nodes = untrack(() => this.nodes).filter((n) => !removedNodeIds.has(n.id));
    this.edges = untrack(() => this.edges).filter((e) => !removedEdgeIds.has(e.id));

    this.deletedNodeIds = new Set([...this.deletedNodeIds, ...removedNodeIds]);

    for (const id of removedNodeIds) {
      this.positionSnapshot.delete(id);
    }
  }

  onLayout(direction: 'LR' | 'TB') {
    this.#layout.isHorizontal = direction === 'LR';
    const layoutedElements = getLayoutedElements(
      untrack(() => this.nodes),
      untrack(() => this.edges),
      direction
    );

    this.nodes = layoutedElements.nodes;
    this.edges = layoutedElements.edges;
    this.updatePositionSnapshot(layoutedElements.nodes);
  }

  /**
   * Toggle collapse state of a node. Only collapses if the node has children.
   * When collapsed, all descendant nodes are hidden from the canvas.
   * When expanded, direct children become visible again.
   */
  toggleCollapseNode(nodeId: string) {
    const hasChildren = this.#childrenMap.has(nodeId);
    if (!hasChildren) return;

    const next = new Set(this.collapsedNodeIds);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    this.collapsedNodeIds = next;
  }

  /** Returns the number of direct children for a given node */
  getChildCount(nodeId: string): number {
    return this.#childrenMap.get(nodeId)?.size ?? 0;
  }

  /** Returns whether a node is currently collapsed */
  isCollapsed(nodeId: string): boolean {
    return this.collapsedNodeIds.has(nodeId);
  }

  handleImportState(state: ImportedLayoutState) {
    const map = new Map<string, { x: number; y: number }>();
    for (const [id, pos] of Object.entries(state.positions)) {
      map.set(id, pos);
    }
    this.positionSnapshot = map;

    const importedIsHorizontal = state.layout.isHorizontal;
    this.nodes = untrack(() => this.nodes).map((n) => ({
      ...n,
      position: map.get(n.id) ?? n.position,
      sourcePosition: importedIsHorizontal ? Position.Right : Position.Bottom,
      targetPosition: importedIsHorizontal ? Position.Left : Position.Top
    }));
    this.edges = untrack(() => this.edges);

    this.#layout.isHorizontal = importedIsHorizontal;
  }
}
