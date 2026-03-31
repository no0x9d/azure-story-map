import type { Node, Edge } from '$lib/types';

/**
 * Reactive filter state for the story map.
 *
 * Accepts getter functions for graph data so that `$derived` fields
 * can react to upstream changes.
 */
export class FilterState {
  // Getter functions are stored as $state so derived fields can read them.
  // They are assigned a no-op default so TypeScript is happy with declaration
  // order, then immediately overwritten in the constructor.
  #getNodes: () => Node[] = () => [];
  #getEdges: () => Edge[] = () => [];

  /** All distinct edge type names derived from graph edges */
  allEdgeTypes = $derived.by(() => {
    const types = new Set<string>();
    this.#getEdges().forEach((e) => {
      if (e.name) types.add(e.name);
    });
    return Array.from(types).sort();
  });

  /** Map of issue type -> set of states, derived from graph nodes */
  statesByType = $derived.by(() => {
    const map = new Map<string, Set<string>>();
    this.#getNodes().forEach((n) => {
      if (!n.type) return;
      if (!map.has(n.type)) map.set(n.type, new Set());
      if (n.state) map.get(n.type)!.add(n.state);
    });
    const sorted = new Map<string, Set<string>>();
    Array.from(map.keys())
      .sort()
      .forEach((type) => {
        sorted.set(type, new Set(Array.from(map.get(type)!).sort()));
      });
    return sorted;
  });

  /** Edge types currently visible (user-toggleable) */
  visibleEdgeTypes = $state(new Set<string>());

  /** Visible states per issue type (user-toggleable) */
  visibleStatesByType = $state(new Map<string, Set<string>>());

  /** Filtered nodes based on visible states */
  filteredNodes = $derived(
    this.#getNodes().filter((n) => {
      const visibleStates = this.visibleStatesByType.get(n.type);
      return visibleStates !== undefined && visibleStates.has(n.state);
    })
  );

  /** Filtered edges based on visible edge types */
  filteredEdges = $derived(this.#getEdges().filter((e) => this.visibleEdgeTypes.has(e.name)));

  constructor(getNodes: () => Node[], getEdges: () => Edge[]) {
    this.#getNodes = getNodes;
    this.#getEdges = getEdges;

    // Initialize visible edge types when available
    $effect(() => {
      if (this.allEdgeTypes.length > 0 && this.visibleEdgeTypes.size === 0) {
        this.visibleEdgeTypes = new Set(this.allEdgeTypes);
      }
    });

    // Initialize / extend visibleStatesByType when statesByType changes
    $effect(() => {
      const available = this.statesByType;
      const current = this.visibleStatesByType;
      let changed = false;
      available.forEach((states, type) => {
        if (!current.has(type)) {
          current.set(type, new Set(states));
          changed = true;
        }
      });
      if (changed) {
        this.visibleStatesByType = new Map(current);
      }
    });
  }

  toggleEdgeType(edgeType: string) {
    const newVisible = new Set(this.visibleEdgeTypes);
    if (newVisible.has(edgeType)) {
      newVisible.delete(edgeType);
    } else {
      newVisible.add(edgeType);
    }
    this.visibleEdgeTypes = newVisible;
  }

  toggleIssueType(issueType: string) {
    const next = new Map(this.visibleStatesByType);
    const allStates = this.statesByType.get(issueType) ?? new Set<string>();
    const current = next.get(issueType);
    const allSelected = current !== undefined && current.size === allStates.size;
    next.set(issueType, allSelected ? new Set() : new Set(allStates));
    this.visibleStatesByType = next;
  }

  toggleIssueState(issueType: string, issueState: string) {
    const next = new Map(this.visibleStatesByType);
    const states = new Set(next.get(issueType) ?? []);
    if (states.has(issueState)) {
      states.delete(issueState);
    } else {
      states.add(issueState);
    }
    next.set(issueType, states);
    this.visibleStatesByType = next;
  }
}
