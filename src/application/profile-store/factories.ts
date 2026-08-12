import { nanoid } from "nanoid";
import type {
  DomainFilter,
  HeaderRule,
  Profile,
  ProfileVariable,
  RuleKind,
  TabFilter,
} from "@/src/domain";

export function createRule(
  kind: RuleKind = "header",
  target?: "request" | "response",
): HeaderRule {
  const isCookieRequest = kind === "cookie-request-append";
  const isCookieResponse = kind === "cookie-response-append";
  const finalTarget: "request" | "response" = isCookieResponse
    ? "response"
    : (target ?? "request");

  return {
    id: nanoid(),
    enabled: true,
    kind,
    target: finalTarget,
    action: isCookieRequest || isCookieResponse ? "append" : "set",
    name: "",
    value: "",
    condition: { urlFilter: "" },
  };
}

export function createProfile(name: string): Profile {
  const now = Date.now();
  return {
    id: nanoid(),
    name,
    color: "#1677ff",
    rules: [],
    tabFilters: [],
    variables: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createTabFilter(urlFilter = ""): TabFilter {
  return {
    id: nanoid(),
    enabled: true,
    urlFilter,
  };
}

export function createDomainFilter(domain = ""): DomainFilter {
  return {
    id: nanoid(),
    enabled: true,
    domain,
  };
}

export function createVariable(name = "", value = ""): ProfileVariable {
  return {
    id: nanoid(),
    enabled: true,
    name,
    value,
  };
}
