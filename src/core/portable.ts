// 自有 JSON 导入/导出
import { nanoid } from "nanoid";
import type {
  Profile,
  AppMeta,
  HeaderRule,
  RuleKind,
  Target,
  HeaderAction,
  RuleCondition,
  ResourceType,
  TabFilter,
  DomainFilter,
  UrlFilter,
  ExcludeUrlFilter,
  MethodFilter,
} from "./types";

export interface ExportPayload {
  schema: "header-ext.v1";
  exportedAt: number;
  profiles: Profile[];
  meta?: Pick<AppMeta, "activeProfileId" | "enabledProfileIds" | "globalPaused">;
}

// selectedIds 为空数组时导出全部；提供时仅导出包含的 profiles
export function buildExport(
  profiles: Profile[],
  meta: AppMeta,
  selectedIds?: string[]
): ExportPayload {
  const filtered =
    selectedIds && selectedIds.length > 0
      ? profiles.filter((p) => selectedIds.includes(p.id))
      : profiles;
  return {
    schema: "header-ext.v1",
    exportedAt: Date.now(),
    profiles: filtered,
    meta: {
      activeProfileId: meta.activeProfileId,
      enabledProfileIds: (meta.enabledProfileIds ?? []).filter((id) =>
        filtered.some((profile) => profile.id === id),
      ),
      globalPaused: meta.globalPaused,
    },
  };
}

export function downloadJson(filename: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

const RULE_KINDS: RuleKind[] = [
  "header",
  "cookie-request-append",
  "cookie-response-append",
  "redirect",
];
const HEADER_ACTIONS: HeaderAction[] = ["set", "append", "remove"];
const RESOURCE_TYPES: ResourceType[] = [
  "main_frame",
  "sub_frame",
  "stylesheet",
  "script",
  "image",
  "font",
  "object",
  "xmlhttprequest",
  "ping",
  "csp_report",
  "media",
  "websocket",
  "webtransport",
  "webbundle",
  "other",
];

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

// 把导入的原始条件归一化为合法 RuleCondition，剔除非法枚举，避免脏数据落库
function normalizeCondition(raw: unknown): RuleCondition {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const condition: RuleCondition = {};
  if (typeof source.urlFilter === "string") condition.urlFilter = source.urlFilter;
  if (typeof source.useRegex === "boolean") condition.useRegex = source.useRegex;
  const excludedDomains = asStringArray(source.excludedDomains);
  if (excludedDomains.length) condition.excludedDomains = excludedDomains;
  const resourceTypes = asStringArray(source.resourceTypes).filter(
    (item): item is ResourceType =>
      (RESOURCE_TYPES as string[]).includes(item),
  );
  if (resourceTypes.length) condition.resourceTypes = resourceTypes;
  const requestMethods = asStringArray(source.requestMethods);
  if (requestMethods.length) condition.requestMethods = requestMethods;
  return condition;
}

// 把导入的原始 rule 归一化为结构完整的 HeaderRule；始终重新生成 id 避免跨 profile 冲突
function normalizeRule(raw: unknown): HeaderRule {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const kind = RULE_KINDS.includes(source.kind as RuleKind)
    ? (source.kind as RuleKind)
    : "header";
  const target: Target = source.target === "response" ? "response" : "request";
  const action = HEADER_ACTIONS.includes(source.action as HeaderAction)
    ? (source.action as HeaderAction)
    : "set";
  return {
    id: nanoid(),
    enabled: typeof source.enabled === "boolean" ? source.enabled : true,
    kind,
    target,
    action,
    name: asString(source.name),
    value: asString(source.value),
    condition: normalizeCondition(source.condition),
  };
}

// 归一化 profile 级过滤器：保留合法条目并补全 id/enabled，剔除非对象项
function normalizeStringFilters<T extends { id: string; enabled: boolean }>(
  raw: unknown,
  key: keyof T,
): T[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object"),
    )
    .map(
      (item) =>
        ({
          id: typeof item.id === "string" ? item.id : nanoid(),
          enabled: typeof item.enabled === "boolean" ? item.enabled : true,
          [key]: asString(item[key as string]),
        }) as T,
    );
}

// 把导入的原始 profile 归一化为结构完整的 Profile；丢弃缺 id 的条目
function normalizeProfile(raw: unknown): Profile | null {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  if (!source.id || typeof source.id !== "string") return null;
  if (!Array.isArray(source.rules)) return null;
  const now = Date.now();
  return {
    id: source.id,
    name: asString(source.name, "Imported"),
    color: asString(source.color, "#1677ff"),
    rules: source.rules.map(normalizeRule),
    tabFilters: normalizeStringFilters<TabFilter>(
      source.tabFilters,
      "urlFilter",
    ),
    domainFilters: normalizeStringFilters<DomainFilter>(
      source.domainFilters,
      "domain",
    ),
    urlFilters: normalizeStringFilters<UrlFilter>(source.urlFilters, "regex"),
    excludeUrlFilters: normalizeStringFilters<ExcludeUrlFilter>(
      source.excludeUrlFilters,
      "url",
    ),
    methodFilters: normalizeStringFilters<MethodFilter>(
      source.methodFilters,
      "method",
    ),
    createdAt: typeof source.createdAt === "number" ? source.createdAt : now,
    updatedAt: typeof source.updatedAt === "number" ? source.updatedAt : now,
  };
}

export function parseImport(text: string): {
  profiles: Profile[];
  meta?: Partial<AppMeta>;
} {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") {
    throw new Error("Invalid JSON");
  }
  if (data.schema !== "header-ext.v1") {
    throw new Error("Unsupported schema");
  }
  const rawProfiles = data.profiles ?? [];
  if (!Array.isArray(rawProfiles)) {
    throw new Error("profiles must be an array");
  }
  // 逐条归一化，补全缺失字段并剔除非法值，避免畸形数据落库导致渲染崩溃
  const profiles = rawProfiles
    .map(normalizeProfile)
    .filter((profile): profile is Profile => profile !== null);
  if (!profiles.length) {
    throw new Error("no valid profile");
  }
  return { profiles, meta: data.meta };
}
