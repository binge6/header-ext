import { Empty } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";
import { HeaderRuleList } from "./HeaderRuleList";
import { TabFilterList } from "./TabFilterList";
import { FilterRowList } from "./FilterRowList";
import { MethodFilterPicker } from "./MethodFilterPicker";
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

export function RuleTable() {
  const { t } = useTranslation();
  const profiles = useProfileStore((s) => s.profiles);
  const activeId = useProfileStore((s) => s.meta.activeProfileId);
  const {
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
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
    (r) => ruleKind(r) === "header" && r.target === "request"
  );
  const responseRules = profile.rules.filter(
    (r) => ruleKind(r) === "header" && r.target === "response"
  );
  const cookieRequestRules = profile.rules.filter(
    (r) => ruleKind(r) === "cookie-request-append"
  );
  const cookieResponseRules = profile.rules.filter(
    (r) => ruleKind(r) === "cookie-response-append"
  );
  const redirectRules = profile.rules.filter((r) => ruleKind(r) === "redirect");

  const handleAddHeader = (target: "request" | "response") => {
    addRule(profile.id, "header", target);
  };

  const handleUpdate = (rule: HeaderRule) => {
    updateRule(profile.id, rule);
  };

  const card = (children: React.ReactNode) => (
    <div
      style={{
        background: "var(--he-bg-surface)",
        borderRadius: 6,
        padding: 16,
        border: "1px solid var(--he-border)",
      }}
    >
      {children}
    </div>
  );

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h3 style={{ margin: 0 }}>{profile.name}</h3>

      {card(
        <HeaderRuleList
          kind="header"
          target="request"
          rules={requestRules}
          onAdd={() => handleAddHeader("request")}
          onUpdate={handleUpdate}
          onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
          onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
        />
      )}

      {card(
        <HeaderRuleList
          kind="header"
          target="response"
          rules={responseRules}
          onAdd={() => handleAddHeader("response")}
          onUpdate={handleUpdate}
          onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
          onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
        />
      )}

      {card(
        <HeaderRuleList
          kind="cookie-request-append"
          rules={cookieRequestRules}
          onAdd={() => addRule(profile.id, "cookie-request-append")}
          onUpdate={handleUpdate}
          onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
          onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
        />
      )}

      {card(
        <HeaderRuleList
          kind="cookie-response-append"
          rules={cookieResponseRules}
          onAdd={() => addRule(profile.id, "cookie-response-append")}
          onUpdate={handleUpdate}
          onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
          onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
        />
      )}

      {card(
        <HeaderRuleList
          kind="redirect"
          rules={redirectRules}
          onAdd={() => addRule(profile.id, "redirect")}
          onUpdate={handleUpdate}
          onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
          onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
        />
      )}

      {card(
        <TabFilterList
          filters={profile.tabFilters ?? []}
          onAdd={() => addTabFilter(profile.id)}
          onUpdate={(f) => updateTabFilter(profile.id, f)}
          onDelete={(id) => deleteTabFilter(profile.id, id)}
          onToggle={(id) => toggleTabFilter(profile.id, id)}
        />
      )}

      {card(
        <FilterRowList<DomainFilter>
          filters={profile.domainFilters ?? []}
          valueField="domain"
          i18nKey="domainFilters"
          onAdd={() => addDomainFilter(profile.id)}
          onUpdate={(f) => updateDomainFilter(profile.id, f)}
          onDelete={(id) => deleteDomainFilter(profile.id, id)}
          onToggle={(id) => toggleDomainFilter(profile.id, id)}
        />
      )}

      {card(
        <FilterRowList<UrlFilter>
          filters={profile.urlFilters ?? []}
          valueField="regex"
          i18nKey="urlFilters"
          onAdd={() => addUrlFilter(profile.id)}
          onUpdate={(f) => updateUrlFilter(profile.id, f)}
          onDelete={(id) => deleteUrlFilter(profile.id, id)}
          onToggle={(id) => toggleUrlFilter(profile.id, id)}
        />
      )}

      {card(
        <FilterRowList<ExcludeUrlFilter>
          filters={profile.excludeUrlFilters ?? []}
          valueField="url"
          i18nKey="excludeUrlFilters"
          onAdd={() => addExcludeUrlFilter(profile.id)}
          onUpdate={(f) => updateExcludeUrlFilter(profile.id, f)}
          onDelete={(id) => deleteExcludeUrlFilter(profile.id, id)}
          onToggle={(id) => toggleExcludeUrlFilter(profile.id, id)}
        />
      )}

      {card(
        <MethodFilterPicker
          filters={profile.methodFilters ?? []}
          onChange={(methods) => {
            // 首次配置且为空时，引导用户至少有一项默认值出现面板
            if (
              methods.length === 0 &&
              (profile.methodFilters ?? []).length === 0
            ) {
              addMethodFilter(profile.id, "GET");
              return;
            }
            setMethodFilters(profile.id, methods);
          }}
        />
      )}
    </div>
  );
}
