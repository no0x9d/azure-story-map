export const STATE_COLORS: Record<string, string> = {
  New: 'rgb(178, 178, 178)',
  Ready: 'rgb(168, 206, 75)',
  Active: 'rgb(0, 122, 204)',
  Refinement: 'rgb(215, 229, 135)',
  Resolved: 'rgb(255, 157, 0)',
  Closed: 'rgb(51, 153, 51)',
  'Product Increment': 'rgb(0, 122, 204)',
  Confirmed: 'rgb(215, 229, 135)'
};

export const TYPE_COLORS: Record<string, string> = {
  'User Story': 'rgb(0, 152, 199)',
  Bug: 'rgb(204, 41, 61)',
  Task: 'rgb(164, 136, 10)',
  Epic: 'rgb(224, 108, 0)',
  Feature: 'rgb(119, 59, 147)'
};

const FALLBACK_COLOR = '#6b7280';

export function getStateColor(state: string): string {
  return STATE_COLORS[state] ?? FALLBACK_COLOR;
}

export function getTypeColor(type?: string): string {
  return (type && TYPE_COLORS[type]) ?? FALLBACK_COLOR;
}
