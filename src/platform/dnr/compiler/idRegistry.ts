const idMap = new Map<string, number>();
let nextDnrId = 1;

export function getDnrId(ruleId: string): number {
  let id = idMap.get(ruleId);
  if (id == null) {
    id = nextDnrId++;
    idMap.set(ruleId, id);
  }
  return id;
}

export function createDnrId(): number {
  return nextDnrId++;
}

export function clearIdMap(): void {
  idMap.clear();
  nextDnrId = 1;
}
