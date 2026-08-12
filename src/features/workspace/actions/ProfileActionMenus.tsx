import type { ComponentProps } from "react";
import { useProfileActions } from "@/src/application/profile-store";
import type { MethodFilter } from "@/src/domain";
import { FilterMenu, ModificationMenu } from "./RuleActionMenus";

type ProfileModificationMenuProps = Omit<
  ComponentProps<typeof ModificationMenu>,
  | "onAddRequestHeader"
  | "onAddResponseHeader"
  | "onAddRequestCookie"
  | "onAddResponseCookie"
  | "onAddRedirect"
> & {
  profileId: string;
};

export function ProfileModificationMenu({
  profileId,
  ...props
}: ProfileModificationMenuProps) {
  const { addRule } = useProfileActions();

  return (
    <ModificationMenu
      {...props}
      onAddRequestHeader={() => addRule(profileId, "header", "request")}
      onAddResponseHeader={() => addRule(profileId, "header", "response")}
      onAddRequestCookie={() => addRule(profileId, "cookie-request-append")}
      onAddResponseCookie={() => addRule(profileId, "cookie-response-append")}
      onAddRedirect={() => addRule(profileId, "redirect")}
    />
  );
}

type ProfileFilterMenuProps = Omit<
  ComponentProps<typeof FilterMenu>,
  "onAddTab" | "onAddDomain" | "onAddUrl" | "onAddExcludeUrl" | "onAddMethod"
> & {
  profileId: string;
  methodFilters?: MethodFilter[];
  initialTabUrlFilter?: string;
  initialDomain?: string;
  initialUrlRegex?: string;
  initialExcludeUrl?: string;
};

export function ProfileFilterMenu({
  profileId,
  methodFilters = [],
  initialTabUrlFilter,
  initialDomain,
  initialUrlRegex,
  initialExcludeUrl,
  ...props
}: ProfileFilterMenuProps) {
  const {
    addTabFilter,
    addDomainFilter,
    addUrlFilter,
    addExcludeUrlFilter,
    addMethodFilter,
  } = useProfileActions();

  return (
    <FilterMenu
      {...props}
      onAddTab={() => addTabFilter(profileId, initialTabUrlFilter)}
      onAddDomain={() => addDomainFilter(profileId, initialDomain)}
      onAddUrl={() => addUrlFilter(profileId, initialUrlRegex)}
      onAddExcludeUrl={() => addExcludeUrlFilter(profileId, initialExcludeUrl)}
      onAddMethod={() => {
        if (methodFilters.length === 0) addMethodFilter(profileId, "GET");
      }}
    />
  );
}
