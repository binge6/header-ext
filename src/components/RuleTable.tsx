import { Button, Dropdown, Empty, Typography } from "@douyinfe/semi-ui";
import {
  IconFilterStroked as IconFilter,
  IconPlusStroked as IconPlus,
} from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";
import { HeaderRuleList } from "./HeaderRuleList";
import { TabFilterList } from "./TabFilterList";
import { FilterRowList } from "./FilterRowList";
import { MethodFilterPicker } from "./MethodFilterPicker";
import { NoFilterBanner } from "./NoFilterBanner";
import { MenuItemLabel } from "./MenuItemLabel";
import type {
  HeaderRule,
  RuleKind,
  DomainFilter,
  UrlFilter,
  ExcludeUrlFilter,
} from "@/src/core/types";

function ruleKind(r: HeaderRule): RuleKind {
  return r.kind ?? "header";
}

const { Text, Title } = Typography;

export function RuleTable() {
  const { t } = useTranslation();
  const profiles = useProfileStore((s) => s.profiles);
  const activeId = useProfileStore((s) => s.meta.activeProfileId);
  const {
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    reorderRules,
    addTabFilter,
    updateTabFilter,
    deleteTabFilter,
    toggleTabFilter,
    addDomainFilter,
    updateDomainFilter,
    deleteDomainFilter,
    toggleDomainFilter,
    addUrlFilter,
    updateUrlFilter,
    deleteUrlFilter,
    toggleUrlFilter,
    addExcludeUrlFilter,
    updateExcludeUrlFilter,
    deleteExcludeUrlFilter,
    toggleExcludeUrlFilter,
    addMethodFilter,
    setMethodFilters,
  } = useProfileActions();

  const profile = profiles.find((p) => p.id === activeId);

  if (!profile) {
    return <Empty title={t("options.noProfiles")} />;
  }

  const requestRules = profile.rules.filter(
    (r) => ruleKind(r) === "header" && r.target === "request",
  );
  const responseRules = profile.rules.filter(
    (r) => ruleKind(r) === "header" && r.target === "response",
  );
  const cookieRequestRules = profile.rules.filter(
    (r) => ruleKind(r) === "cookie-request-append",
  );
  const cookieResponseRules = profile.rules.filter(
    (r) => ruleKind(r) === "cookie-response-append",
  );
  const redirectRules = profile.rules.filter((r) => ruleKind(r) === "redirect");
  const tabFilters = profile.tabFilters ?? [];
  const domainFilters = profile.domainFilters ?? [];
  const urlFilters = profile.urlFilters ?? [];
  const excludeUrlFilters = profile.excludeUrlFilters ?? [];
  const methodFilters = profile.methodFilters ?? [];
  const hasEditorContent =
    requestRules.length +
      responseRules.length +
      cookieRequestRules.length +
      cookieResponseRules.length +
      redirectRules.length +
      tabFilters.length +
      domainFilters.length +
      urlFilters.length +
      excludeUrlFilters.length +
      methodFilters.length >
    0;

  const handleAddHeader = (target: "request" | "response") => {
    addRule(profile.id, "header", target);
  };

  const handleUpdate = (rule: HeaderRule) => {
    updateRule(profile.id, rule);
  };

  const handleAddMethodFilter = () => {
    if (methodFilters.length === 0) {
      addMethodFilter(profile.id, "GET");
    }
  };

  const modMenu = (
    <Dropdown.Menu>
      <Dropdown.Item onClick={() => handleAddHeader("request")}>
        {t("popup.addRequestHeader")}
      </Dropdown.Item>
      <Dropdown.Item onClick={() => handleAddHeader("response")}>
        {t("popup.addResponseHeader")}
      </Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item
        onClick={() => addRule(profile.id, "cookie-request-append")}
      >
        {t("popup.addCookieRequest")}
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => addRule(profile.id, "cookie-response-append")}
      >
        {t("popup.addCookieResponse")}
      </Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item onClick={() => addRule(profile.id, "redirect")}>
        {t("popup.addRedirect")}
      </Dropdown.Item>
    </Dropdown.Menu>
  );

  const filterMenu = (
    <Dropdown.Menu>
      <Dropdown.Item onClick={() => addTabFilter(profile.id)}>
        <MenuItemLabel title={t("filters.tab")} desc={t("filters.tabDesc")} />
      </Dropdown.Item>
      <Dropdown.Item onClick={() => addDomainFilter(profile.id)}>
        <MenuItemLabel
          title={t("filters.domain")}
          desc={t("filters.domainDesc")}
        />
      </Dropdown.Item>
      <Dropdown.Item onClick={() => addUrlFilter(profile.id)}>
        <MenuItemLabel title={t("filters.url")} desc={t("filters.urlDesc")} />
      </Dropdown.Item>
      <Dropdown.Item onClick={() => addExcludeUrlFilter(profile.id)}>
        <MenuItemLabel
          title={t("filters.excludeUrl")}
          desc={t("filters.excludeUrlDesc")}
        />
      </Dropdown.Item>
      <Dropdown.Item onClick={handleAddMethodFilter}>
        <MenuItemLabel
          title={t("filters.method")}
          desc={t("filters.methodDesc")}
        />
      </Dropdown.Item>
    </Dropdown.Menu>
  );

  const actionBar = (
    <div className="flex flex-wrap items-center gap-2">
      <Dropdown trigger="click" position="bottomRight" render={modMenu}>
        <Button theme="solid" type="primary" icon={<IconPlus />}>
          {t("popup.addMod")}
        </Button>
      </Dropdown>
      <Dropdown trigger="click" position="bottomRight" render={filterMenu}>
        <Button icon={<IconFilter />}>{t("filters.title")}</Button>
      </Dropdown>
    </div>
  );

  return (
    <div className="he-options-editor flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Title heading={3} className="m-0">
            {profile.name}
          </Title>
          <Text type="tertiary" size="small">
            {t("options.rules")}
          </Text>
        </div>
        {actionBar}
      </div>

      <NoFilterBanner />

      {!hasEditorContent && (
        <div className="rounded-xl border border-semi-color-border bg-semi-color-bg-1 px-6 py-10">
          <Empty
            title={t("popup.noRules")}
            description={t("popup.emptyModHint")}
          />
        </div>
      )}

      {hasEditorContent && (
        <>
          <HeaderRuleList
            variant="editor"
            kind="header"
            target="request"
            rules={requestRules}
            onAdd={() => handleAddHeader("request")}
            onUpdate={handleUpdate}
            onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
            onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
            onReorder={(ruleIds) => reorderRules(profile.id, ruleIds)}
          />

          <HeaderRuleList
            variant="editor"
            kind="header"
            target="response"
            rules={responseRules}
            onAdd={() => handleAddHeader("response")}
            onUpdate={handleUpdate}
            onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
            onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
            onReorder={(ruleIds) => reorderRules(profile.id, ruleIds)}
          />

          <HeaderRuleList
            variant="editor"
            kind="cookie-request-append"
            rules={cookieRequestRules}
            onAdd={() => addRule(profile.id, "cookie-request-append")}
            onUpdate={handleUpdate}
            onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
            onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
            onReorder={(ruleIds) => reorderRules(profile.id, ruleIds)}
          />

          <HeaderRuleList
            variant="editor"
            kind="cookie-response-append"
            rules={cookieResponseRules}
            onAdd={() => addRule(profile.id, "cookie-response-append")}
            onUpdate={handleUpdate}
            onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
            onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
            onReorder={(ruleIds) => reorderRules(profile.id, ruleIds)}
          />

          <HeaderRuleList
            variant="editor"
            kind="redirect"
            rules={redirectRules}
            onAdd={() => addRule(profile.id, "redirect")}
            onUpdate={handleUpdate}
            onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
            onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
            onReorder={(ruleIds) => reorderRules(profile.id, ruleIds)}
          />

          <TabFilterList
            variant="editor"
            filters={tabFilters}
            onAdd={() => addTabFilter(profile.id)}
            onUpdate={(f) => updateTabFilter(profile.id, f)}
            onDelete={(id) => deleteTabFilter(profile.id, id)}
            onToggle={(id) => toggleTabFilter(profile.id, id)}
          />

          <FilterRowList<DomainFilter>
            variant="editor"
            filters={domainFilters}
            valueField="domain"
            i18nKey="domainFilters"
            onAdd={() => addDomainFilter(profile.id)}
            onUpdate={(f) => updateDomainFilter(profile.id, f)}
            onDelete={(id) => deleteDomainFilter(profile.id, id)}
            onToggle={(id) => toggleDomainFilter(profile.id, id)}
          />

          <FilterRowList<UrlFilter>
            variant="editor"
            filters={urlFilters}
            valueField="regex"
            i18nKey="urlFilters"
            onAdd={() => addUrlFilter(profile.id)}
            onUpdate={(f) => updateUrlFilter(profile.id, f)}
            onDelete={(id) => deleteUrlFilter(profile.id, id)}
            onToggle={(id) => toggleUrlFilter(profile.id, id)}
          />

          <FilterRowList<ExcludeUrlFilter>
            variant="editor"
            filters={excludeUrlFilters}
            valueField="url"
            i18nKey="excludeUrlFilters"
            onAdd={() => addExcludeUrlFilter(profile.id)}
            onUpdate={(f) => updateExcludeUrlFilter(profile.id, f)}
            onDelete={(id) => deleteExcludeUrlFilter(profile.id, id)}
            onToggle={(id) => toggleExcludeUrlFilter(profile.id, id)}
          />

          <MethodFilterPicker
            variant="editor"
            filters={methodFilters}
            onChange={(methods) => setMethodFilters(profile.id, methods)}
          />
        </>
      )}
    </div>
  );
}
