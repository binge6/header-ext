import type { ReactNode } from "react";
import { Filter, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MenuItemLabel } from "./MenuItemLabel";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui";

interface ModificationMenuProps {
  disabled?: boolean;
  compact?: boolean;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  trigger?: ReactNode;
  onAddRequestHeader: () => void;
  onAddResponseHeader: () => void;
  onAddRequestCookie: () => void;
  onAddResponseCookie: () => void;
  onAddRedirect: () => void;
}

export function ModificationMenu({
  disabled,
  compact,
  align = "start",
  side,
  trigger,
  onAddRequestHeader,
  onAddResponseHeader,
  onAddRequestCookie,
  onAddResponseCookie,
  onAddRedirect,
}: ModificationMenuProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {trigger ?? (
          <Button disabled={disabled}>
            <Plus aria-hidden="true" />
            {t("popup.addMod")}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        className={compact ? "w-56" : "w-72"}
      >
        {!compact && (
          <DropdownMenuLabel>{t("popup.headerMods")}</DropdownMenuLabel>
        )}
        <DropdownMenuItem onClick={onAddRequestHeader}>
          {compact ? (
            t("popup.addRequestHeader")
          ) : (
            <MenuItemLabel
              title={t("popup.addRequestHeader")}
              desc={t("popup.addRequestHeaderDesc")}
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddResponseHeader}>
          {compact ? (
            t("popup.addResponseHeader")
          ) : (
            <MenuItemLabel
              title={t("popup.addResponseHeader")}
              desc={t("popup.addResponseHeaderDesc")}
            />
          )}
        </DropdownMenuItem>
        {!compact && <DropdownMenuSeparator />}
        {!compact && (
          <DropdownMenuLabel>{t("popup.cookieAndRedirect")}</DropdownMenuLabel>
        )}
        <DropdownMenuItem onClick={onAddRequestCookie}>
          {compact ? (
            t("popup.addCookieRequest")
          ) : (
            <MenuItemLabel
              title={t("popup.addCookieRequest")}
              desc={t("popup.addCookieRequestDesc")}
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddResponseCookie}>
          {compact ? (
            t("popup.addCookieResponse")
          ) : (
            <MenuItemLabel
              title={t("popup.addCookieResponse")}
              desc={t("popup.addCookieResponseDesc")}
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddRedirect}>
          {compact ? (
            t("popup.addRedirect")
          ) : (
            <MenuItemLabel
              title={t("popup.addRedirect")}
              desc={t("popup.addRedirectDesc")}
            />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface FilterMenuProps {
  disabled?: boolean;
  compact?: boolean;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  trigger?: ReactNode;
  onAddTab: () => void;
  onAddDomain: () => void;
  onAddUrl: () => void;
  onAddExcludeUrl: () => void;
  onAddMethod: () => void;
}

export function FilterMenu({
  disabled,
  compact,
  align = "start",
  side,
  trigger,
  onAddTab,
  onAddDomain,
  onAddUrl,
  onAddExcludeUrl,
  onAddMethod,
}: FilterMenuProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {trigger ?? (
          <Button variant="outline" disabled={disabled}>
            <Filter aria-hidden="true" />
            {t("filters.title")}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        className={compact ? "w-56" : "w-80"}
      >
        {!compact && (
          <DropdownMenuLabel>{t("filters.addFilter")}</DropdownMenuLabel>
        )}
        <DropdownMenuItem onClick={onAddTab}>
          {compact ? (
            t("filters.tab")
          ) : (
            <MenuItemLabel
              title={t("filters.tab")}
              desc={t("filters.tabDesc")}
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddDomain}>
          {compact ? (
            t("filters.domain")
          ) : (
            <MenuItemLabel
              title={t("filters.domain")}
              desc={t("filters.domainDesc")}
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddUrl}>
          {compact ? (
            t("filters.url")
          ) : (
            <MenuItemLabel
              title={t("filters.url")}
              desc={t("filters.urlDesc")}
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddExcludeUrl}>
          {compact ? (
            t("filters.excludeUrl")
          ) : (
            <MenuItemLabel
              title={t("filters.excludeUrl")}
              desc={t("filters.excludeUrlDesc")}
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddMethod}>
          {compact ? (
            t("filters.method")
          ) : (
            <MenuItemLabel
              title={t("filters.method")}
              desc={t("filters.methodDesc")}
            />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
