// 自有 JSON 导入/导出
import type { AppMeta, Profile } from "./models";
import { importedProfileSchema, importPayloadSchema } from "./schemas";

export interface ExportPayload {
  schema: "header-ext.v1";
  exportedAt: number;
  profiles: Profile[];
  meta?: Pick<
    AppMeta,
    "activeProfileId" | "enabledProfileIds" | "globalPaused"
  >;
}

// selectedIds 为空数组时导出全部；提供时仅导出包含的 profiles
export function buildExport(
  profiles: Profile[],
  meta: AppMeta,
  selectedIds?: string[],
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

export function parseImport(text: string): {
  profiles: Profile[];
  meta?: Partial<AppMeta>;
} {
  const data: unknown = JSON.parse(text);
  if (!data || typeof data !== "object") {
    throw new Error("Invalid JSON");
  }

  const source = data as Record<string, unknown>;
  if (source.schema !== "header-ext.v1") {
    throw new Error("Unsupported schema");
  }
  const rawProfiles = source.profiles ?? [];
  if (!Array.isArray(rawProfiles)) {
    throw new Error("profiles must be an array");
  }

  const payload = importPayloadSchema.parse({
    ...source,
    profiles: rawProfiles,
  });
  const profiles = payload.profiles.flatMap((rawProfile) => {
    const result = importedProfileSchema.safeParse(rawProfile);
    return result.success ? [result.data] : [];
  });
  if (!profiles.length) {
    throw new Error("no valid profile");
  }
  return { profiles, meta: payload.meta };
}
