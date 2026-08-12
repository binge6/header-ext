export const editorSectionClassName =
  "he-editor-section overflow-hidden rounded-xl border border-border bg-card shadow-soft";

export const editorSectionHeaderClassName =
  "he-editor-section-header flex min-h-12 items-center justify-between border-b border-border bg-muted/40 px-3.5 py-2.5";

export const editorSectionIconClassName =
  "he-editor-section-icon inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg [&_svg]:h-3.75 [&_svg]:w-3.75";

export const editorSectionCountClassName =
  "he-editor-section-count inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-secondary px-1.5 text-micro font-bold text-muted-foreground";

export const editorSectionTitleClassName =
  "he-section-title text-group-title font-bold text-foreground";

export const editorRuleRowClassName =
  "he-editor-rule-row flex min-h-13 items-center gap-1.5 border-t border-border px-3 py-2 transition-colors first:border-t-0 hover:bg-accent/40";

export const editorRuleDragOverClassName =
  "he-editor-rule-row-drag-over bg-primary/10 ring-2 ring-inset ring-primary";

export const editorFieldClassName = "he-editor-field bg-background/65";

export const mutedTextClassName =
  "he-muted-text text-xs leading-4.5 text-muted-foreground";

export const emptyStateClassName =
  "flex min-h-55 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/70 p-8 text-center text-muted-foreground";

export const editorSectionIconVariants = {
  request: "bg-info-soft text-info",
  response: "bg-purple-soft text-purple",
  cookie: "bg-orange-soft text-orange",
  redirect: "bg-success-soft text-success",
  filter: "bg-primary/10 text-primary",
  variable: "bg-purple-soft text-purple",
} as const;
