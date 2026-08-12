export function getProfileBadgeText(name?: string): string {
  const trimmed = name?.trim() ?? "";
  const edgeNumber = trimmed.match(/^\d+/)?.[0] ?? trimmed.match(/\d+$/)?.[0];
  return edgeNumber ?? (trimmed.charAt(0).toUpperCase() || "H");
}
