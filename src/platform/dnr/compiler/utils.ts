export function cleanDomains(domains: string[] | undefined): string[] {
  return (domains ?? []).map((domain) => domain.trim()).filter(Boolean);
}

function isSameOrSubdomain(domain: string, scope: string): boolean {
  const normalizedDomain = domain.toLowerCase();
  const normalizedScope = scope.toLowerCase();
  return (
    normalizedDomain === normalizedScope ||
    normalizedDomain.endsWith(`.${normalizedScope}`)
  );
}

export function intersectDomainScopes(
  left: string[],
  right: string[],
): string[] {
  const result = new Set<string>();
  for (const leftDomain of left) {
    for (const rightDomain of right) {
      if (isSameOrSubdomain(leftDomain, rightDomain)) {
        result.add(leftDomain);
      } else if (isSameOrSubdomain(rightDomain, leftDomain)) {
        result.add(rightDomain);
      }
    }
  }
  return Array.from(result);
}
