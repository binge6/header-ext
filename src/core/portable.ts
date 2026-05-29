// 自有 JSON 导入/导出
import type { Profile, AppMeta } from './types';

export interface ExportPayload {
  schema: 'header-ext.v1';
  exportedAt: number;
  profiles: Profile[];
  meta?: Pick<AppMeta, 'activeProfileId' | 'globalPaused'>;
}

export function buildExport(
  profiles: Profile[],
  meta: AppMeta,
): ExportPayload {
  return {
    schema: 'header-ext.v1',
    exportedAt: Date.now(),
    profiles,
    meta: {
      activeProfileId: meta.activeProfileId,
      globalPaused: meta.globalPaused,
    },
  };
}

export function downloadJson(filename: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
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
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function parseImport(text: string): {
  profiles: Profile[];
  meta?: Partial<AppMeta>;
} {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON');
  }
  const profiles = (data.profiles ?? []) as Profile[];
  if (!Array.isArray(profiles)) {
    throw new Error('profiles must be an array');
  }
  // 简单校验
  for (const p of profiles) {
    if (!p.id || !Array.isArray(p.rules)) {
      throw new Error('profile schema invalid');
    }
  }
  return { profiles, meta: data.meta };
}
