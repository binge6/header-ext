import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useProfileActions } from "@/src/application";
import { Button } from "@/src/shared/ui";

export function DnrRecoveryControl() {
  const { t } = useTranslation();
  const { reinitializeRules } = useProfileActions();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await reinitializeRules();
      toast.success(t("options.reinitializeRulesSuccess"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      toast.error(t("options.reinitializeRulesFailed", { message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={() => void handleClick()}
    >
      <RefreshCw
        aria-hidden="true"
        className={loading ? "animate-spin" : undefined}
      />
      {t("options.reinitializeRules")}
    </Button>
  );
}
