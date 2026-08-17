import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { useProfileActions } from "@/src/application/profile-store";
import { useProfileStore } from "@/src/application/profile-store";
import type {
  DomainFilter,
  ExcludeUrlFilter,
  MethodFilter,
  UrlFilter,
} from "@/src/domain";
import { FilterRowList } from "./FilterRowList";
import { MethodFilterPicker } from "./MethodFilterPicker";
import { TabFilterList } from "./TabFilterList";
import {
  getProfileFilterErrorState,
  type ProfileFilterErrorPrefix,
} from "./profile-filter-errors";

function useProfileFilterErrors(
  profileId: string,
  prefix: ProfileFilterErrorPrefix,
  filters?: UrlFilter[],
) {
  const { t } = useTranslation();
  const errors = useProfileStore((state) => state.dnrErrors[profileId]);
  return getProfileFilterErrorState(errors, prefix, t, filters);
}

type ProfileTabFilterListProps = Omit<
  ComponentProps<typeof TabFilterList>,
  "onAdd" | "onUpdate" | "onDelete" | "onToggle"
> & {
  profileId: string;
  initialUrlFilter?: string;
};

export function ProfileTabFilterList({
  profileId,
  initialUrlFilter,
  ...props
}: ProfileTabFilterListProps) {
  const { addTabFilter, updateTabFilter, deleteTabFilter, toggleTabFilter } =
    useProfileActions();
  const errors = useProfileFilterErrors(profileId, "__tab_filter__");

  return (
    <TabFilterList
      {...props}
      {...errors}
      onAdd={() => addTabFilter(profileId, initialUrlFilter)}
      onUpdate={(filter) => updateTabFilter(profileId, filter)}
      onDelete={(filterId) => deleteTabFilter(profileId, filterId)}
      onToggle={(filterId) => toggleTabFilter(profileId, filterId)}
    />
  );
}

interface ProfileDomainFilterListProps {
  profileId: string;
  filters: DomainFilter[];
  initialDomain?: string;
  variant?: "compact" | "editor";
}

export function ProfileDomainFilterList({
  profileId,
  filters,
  initialDomain,
  variant,
}: ProfileDomainFilterListProps) {
  const {
    addDomainFilter,
    updateDomainFilter,
    deleteDomainFilter,
    toggleDomainFilter,
  } = useProfileActions();
  const errors = useProfileFilterErrors(profileId, "__domain_filter__");

  return (
    <FilterRowList<DomainFilter>
      {...errors}
      variant={variant}
      filters={filters}
      valueField="domain"
      i18nKey="domainFilters"
      onAdd={() => addDomainFilter(profileId, initialDomain)}
      onUpdate={(filter) => updateDomainFilter(profileId, filter)}
      onDelete={(filterId) => deleteDomainFilter(profileId, filterId)}
      onToggle={(filterId) => toggleDomainFilter(profileId, filterId)}
    />
  );
}

interface ProfileUrlFilterListProps {
  profileId: string;
  filters: UrlFilter[];
  initialRegex?: string;
  variant?: "compact" | "editor";
}

export function ProfileUrlFilterList({
  profileId,
  filters,
  initialRegex,
  variant,
}: ProfileUrlFilterListProps) {
  const { addUrlFilter, updateUrlFilter, deleteUrlFilter, toggleUrlFilter } =
    useProfileActions();
  const errors = useProfileFilterErrors(profileId, "__url_filter__", filters);

  return (
    <FilterRowList<UrlFilter>
      {...errors}
      variant={variant}
      filters={filters}
      valueField="regex"
      i18nKey="urlFilters"
      onAdd={() => addUrlFilter(profileId, initialRegex)}
      onUpdate={(filter) => updateUrlFilter(profileId, filter)}
      onDelete={(filterId) => deleteUrlFilter(profileId, filterId)}
      onToggle={(filterId) => toggleUrlFilter(profileId, filterId)}
    />
  );
}

interface ProfileExcludeUrlFilterListProps {
  profileId: string;
  filters: ExcludeUrlFilter[];
  initialUrl?: string;
  variant?: "compact" | "editor";
}

export function ProfileExcludeUrlFilterList({
  profileId,
  filters,
  initialUrl,
  variant,
}: ProfileExcludeUrlFilterListProps) {
  const {
    addExcludeUrlFilter,
    updateExcludeUrlFilter,
    deleteExcludeUrlFilter,
    toggleExcludeUrlFilter,
  } = useProfileActions();
  const errors = useProfileFilterErrors(profileId, "__exclude_url_filter__");

  return (
    <FilterRowList<ExcludeUrlFilter>
      {...errors}
      variant={variant}
      filters={filters}
      valueField="url"
      i18nKey="excludeUrlFilters"
      onAdd={() => addExcludeUrlFilter(profileId, initialUrl)}
      onUpdate={(filter) => updateExcludeUrlFilter(profileId, filter)}
      onDelete={(filterId) => deleteExcludeUrlFilter(profileId, filterId)}
      onToggle={(filterId) => toggleExcludeUrlFilter(profileId, filterId)}
    />
  );
}

type ProfileMethodFilterPickerProps = Omit<
  ComponentProps<typeof MethodFilterPicker>,
  "onChange"
> & {
  profileId: string;
  filters: MethodFilter[];
};

export function ProfileMethodFilterPicker({
  profileId,
  ...props
}: ProfileMethodFilterPickerProps) {
  const { setMethodFilters } = useProfileActions();

  return (
    <MethodFilterPicker
      {...props}
      onChange={(methods) => setMethodFilters(profileId, methods)}
    />
  );
}
