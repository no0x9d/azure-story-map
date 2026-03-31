import type { Node, Edge } from '$lib/server/storymap';

/**
 * Client-side representation of a story card's data.
 * This is a subset of the server-side `Node` type, containing only
 * the fields needed for rendering story cards and detail dialogs.
 */
export interface StoryData {
  id: number;
  title: string;
  state: string;
  estimationStoryPoints?: number;
  estimationEffort?: number;
  type?: string;
  description?: string;
  acceptanceCriteria?: string;
  webUrl: string;
  iterationPath?: string;
}

export type { Node, Edge };
