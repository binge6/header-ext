import { nanoid } from "nanoid";
import { z } from "zod";
import { HEADER_ACTIONS, RESOURCE_TYPES, RULE_KINDS, TARGETS } from "./models";
import type {
  AppMeta,
  DomainFilter,
  ExcludeUrlFilter,
  HeaderRule,
  MethodFilter,
  Profile,
  ProfileVariable,
  ResourceType,
  RuleCondition,
  TabFilter,
  UrlFilter,
} from "./models";

type UnknownRecord = Record<string, unknown>;

export interface ParsedAppState {
  profiles: Profile[];
  meta: Partial<AppMeta>;
}

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toRecord(value: unknown): UnknownRecord {
  return isObject(value) ? { ...value } : {};
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function addStableIds(
  value: unknown,
  prefix: string,
  includeNonObjects = false,
): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((item, index) => {
    if (!isObject(item) && !includeNonObjects) return item;

    const source = toRecord(item);
    return {
      ...source,
      id: isNonEmptyString(source.id) ? source.id : `legacy:${prefix}:${index}`,
    };
  });
}

function prepareStoredProfile(value: unknown): UnknownRecord {
  const profile = toRecord(value);
  const profileId = isNonEmptyString(profile.id) ? profile.id : "profile";
  const createdAt = isFiniteNumber(profile.createdAt)
    ? profile.createdAt
    : isFiniteNumber(profile.updatedAt)
      ? profile.updatedAt
      : 0;
  const updatedAt = isFiniteNumber(profile.updatedAt)
    ? profile.updatedAt
    : createdAt;

  return {
    ...profile,
    rules: addStableIds(profile.rules, `${profileId}:rule`, true),
    tabFilters: addStableIds(profile.tabFilters, `${profileId}:tab-filter`),
    domainFilters: addStableIds(
      profile.domainFilters,
      `${profileId}:domain-filter`,
    ),
    urlFilters: addStableIds(profile.urlFilters, `${profileId}:url-filter`),
    excludeUrlFilters: addStableIds(
      profile.excludeUrlFilters,
      `${profileId}:exclude-url-filter`,
    ),
    methodFilters: addStableIds(
      profile.methodFilters,
      `${profileId}:method-filter`,
    ),
    variables: addStableIds(profile.variables, `${profileId}:variable`),
    createdAt,
    updatedAt,
  };
}

function optionalStringArray<T extends string>(
  allowedValues?: readonly T[],
): z.ZodType<T[] | undefined> {
  const allowed = allowedValues ? new Set<string>(allowedValues) : undefined;

  return z
    .array(z.unknown())
    .transform((items): T[] | undefined => {
      const strings = items.filter(
        (item): item is T =>
          typeof item === "string" && (!allowed || allowed.has(item)),
      );
      return strings.length > 0 ? strings : undefined;
    })
    .optional()
    .catch(undefined);
}

function objectArray<T>(itemSchema: z.ZodType<T>): z.ZodType<T[]> {
  return z
    .array(z.unknown())
    .catch([])
    .transform((items) =>
      items.filter(isObject).map((item) => itemSchema.parse(item)),
    );
}

function compactCondition(condition: Record<string, unknown>): RuleCondition {
  return Object.fromEntries(
    Object.entries(condition).filter(([, value]) => value !== undefined),
  ) as RuleCondition;
}

const generatedIdSchema = z
  .string()
  .min(1)
  .catch(() => nanoid());

const conditionSchema = z
  .preprocess(
    toRecord,
    z.object({
      urlFilter: z.string().optional().catch(undefined),
      useRegex: z.boolean().optional().catch(undefined),
      includedDomains: optionalStringArray<string>(),
      excludedDomains: optionalStringArray<string>(),
      resourceTypes: optionalStringArray<ResourceType>(RESOURCE_TYPES),
      requestMethods: optionalStringArray<string>(),
    }),
  )
  .transform((condition) =>
    compactCondition(condition as Record<string, unknown>),
  );

const ruleFields = {
  enabled: z.boolean().catch(true),
  kind: z.enum(RULE_KINDS).catch("header"),
  target: z.enum(TARGETS).catch("request"),
  action: z.enum(HEADER_ACTIONS).catch("set"),
  name: z.string().catch(""),
  value: z.string().catch(""),
  condition: conditionSchema,
};

// 导入规则必须生成新 ID，避免合并多个 Profile 后与现有 DNR 映射冲突。
const importedRuleSchema = z
  .preprocess(toRecord, z.object(ruleFields))
  .transform((rule): HeaderRule => ({
    id: nanoid(),
    ...rule,
  }));

// storage 中的合法 ID 必须保留；仅对缺失或空 ID 做兼容补全。
const storedRuleSchema = z
  .preprocess(
    toRecord,
    z.object({
      id: z.string().min(1),
      ...ruleFields,
    }),
  )
  .transform((rule): HeaderRule => rule);

const filterBaseFields = {
  id: generatedIdSchema,
  enabled: z.boolean().catch(true),
};

const tabFilterSchema = z
  .preprocess(
    toRecord,
    z.object({
      ...filterBaseFields,
      urlFilter: z.string().catch(""),
    }),
  )
  .transform((filter): TabFilter => filter);

const domainFilterSchema = z
  .preprocess(
    toRecord,
    z.object({
      ...filterBaseFields,
      domain: z.string().catch(""),
    }),
  )
  .transform((filter): DomainFilter => filter);

const urlFilterSchema = z
  .preprocess(
    toRecord,
    z.object({
      ...filterBaseFields,
      regex: z.string().catch(""),
    }),
  )
  .transform((filter): UrlFilter => filter);

const excludeUrlFilterSchema = z
  .preprocess(
    toRecord,
    z.object({
      ...filterBaseFields,
      url: z.string().catch(""),
    }),
  )
  .transform((filter): ExcludeUrlFilter => filter);

const methodFilterSchema = z
  .preprocess(
    toRecord,
    z.object({
      ...filterBaseFields,
      method: z.string().catch(""),
    }),
  )
  .transform((filter): MethodFilter => filter);

const variableSchema = z
  .preprocess(
    toRecord,
    z.object({
      ...filterBaseFields,
      name: z.string().catch(""),
      value: z.string().catch(""),
    }),
  )
  .transform((variable): ProfileVariable => variable);

function createProfileSchema(
  ruleSchema: z.ZodType<HeaderRule>,
  preprocessProfile: (value: unknown) => UnknownRecord = toRecord,
): z.ZodType<Profile> {
  return z
    .preprocess(
      preprocessProfile,
      z.object({
        id: z.string().min(1),
        name: z.string().catch("Imported"),
        color: z.string().catch("#1677ff"),
        rules: z.array(ruleSchema),
        tabFilters: objectArray(tabFilterSchema),
        domainFilters: objectArray(domainFilterSchema),
        urlFilters: objectArray(urlFilterSchema),
        excludeUrlFilters: objectArray(excludeUrlFilterSchema),
        methodFilters: objectArray(methodFilterSchema),
        variables: objectArray(variableSchema),
        createdAt: z.number().optional().catch(undefined),
        updatedAt: z.number().optional().catch(undefined),
      }),
    )
    .transform((profile): Profile => {
      const now = Date.now();
      return {
        ...profile,
        createdAt: profile.createdAt ?? now,
        updatedAt: profile.updatedAt ?? now,
      };
    });
}

export const importedProfileSchema = createProfileSchema(importedRuleSchema);
export const storedProfileSchema = createProfileSchema(
  storedRuleSchema,
  prepareStoredProfile,
);

export const partialAppMetaSchema = z
  .preprocess(
    toRecord,
    z.object({
      activeProfileId: z.string().nullable().optional().catch(undefined),
      enabledProfileIds: z
        .array(z.unknown())
        .transform((items) =>
          items.filter((item): item is string => typeof item === "string"),
        )
        .optional()
        .catch(undefined),
      globalPaused: z.boolean().optional().catch(undefined),
      lockedTabId: z.number().nullable().optional().catch(undefined),
      language: z
        .enum(["zh-CN", "en-US"])
        .nullable()
        .optional()
        .catch(undefined),
      theme: z.enum(["light", "dark", "system"]).optional().catch(undefined),
    }),
  )
  .transform(
    (meta): Partial<AppMeta> =>
      Object.fromEntries(
        Object.entries(meta).filter(([, value]) => value !== undefined),
      ) as Partial<AppMeta>,
  );

export const importPayloadSchema = z.object({
  schema: z.literal("header-ext.v1"),
  profiles: z.array(z.unknown()),
  meta: partialAppMetaSchema.optional(),
});

export const storedAppStateSchema = z
  .preprocess(
    toRecord,
    z.object({
      profiles: z.array(z.unknown()),
      meta: partialAppMetaSchema,
    }),
  )
  .transform((state): ParsedAppState => ({
    profiles: state.profiles.flatMap((rawProfile) => {
      const result = storedProfileSchema.safeParse(rawProfile);
      return result.success ? [result.data] : [];
    }),
    meta: state.meta,
  }));
