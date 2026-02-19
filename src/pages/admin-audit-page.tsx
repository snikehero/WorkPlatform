import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableShell } from "@/components/ui/data-table-shell";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n";
import { adminAuditStore } from "@/stores/admin-audit-store";
import type { AuditLog, AuditLogFilters, AuditStatus } from "@/types/audit";

type AuditFilterDraft = {
  from: string;
  to: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  status: "" | AuditStatus;
};

const EMPTY_FILTERS: AuditFilterDraft = {
  from: "",
  to: "",
  actorEmail: "",
  action: "",
  targetType: "",
  targetId: "",
  status: "",
};

const toIsoOrUndefined = (value: string): string | undefined => {
  const raw = value.trim();
  if (!raw) return undefined;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

const buildAppliedFilters = (draft: AuditFilterDraft): AuditLogFilters => {
  const output: AuditLogFilters = {};
  const from = toIsoOrUndefined(draft.from);
  const to = toIsoOrUndefined(draft.to);
  if (from) output.from = from;
  if (to) output.to = to;
  if (draft.actorEmail.trim()) output.actorEmail = draft.actorEmail.trim();
  if (draft.action.trim()) output.action = draft.action.trim().toLowerCase();
  if (draft.targetType.trim()) output.targetType = draft.targetType.trim().toLowerCase();
  if (draft.targetId.trim()) output.targetId = draft.targetId.trim();
  if (draft.status) output.status = draft.status;
  return output;
};

export const AdminAuditPage = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<AuditFilterDraft>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const data = await adminAuditStore.list(filters, cursor);
      setLogs(data.items);
      setNextCursor(data.nextCursor);
    } catch (error) {
      setLogs([]);
      setNextCursor(null);
      setLoadError(error instanceof Error ? error.message : t("admin.auditLoadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [cursor, filters, t]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const hasActiveFilters = useMemo(
    () => Object.values(draft).some((value) => value !== ""),
    [draft]
  );

  const handleApply = () => {
    setFilters(buildAppliedFilters(draft));
    setCursor(null);
    setCursorHistory([]);
  };

  const handleClear = () => {
    setDraft(EMPTY_FILTERS);
    setFilters({});
    setCursor(null);
    setCursorHistory([]);
  };

  const handleNext = () => {
    if (!nextCursor) return;
    setCursorHistory((current) => [...current, cursor ?? ""]);
    setCursor(nextCursor);
  };

  const handlePrev = () => {
    setCursorHistory((current) => {
      if (current.length === 0) return current;
      const next = [...current];
      const previous = next.pop() ?? "";
      setCursor(previous || null);
      return next;
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await adminAuditStore.exportCsv(filters);
      showToast(t("admin.auditExported"), "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("admin.auditExportFailed"), "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("admin.auditPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.auditPageSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.auditFiltersTitle")}</CardTitle>
          <CardDescription>{t("admin.auditFiltersSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              type="datetime-local"
              value={draft.from}
              onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}
              placeholder={t("admin.auditFrom")}
            />
            <Input
              type="datetime-local"
              value={draft.to}
              onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
              placeholder={t("admin.auditTo")}
            />
            <Input
              value={draft.actorEmail}
              onChange={(event) => setDraft((current) => ({ ...current, actorEmail: event.target.value }))}
              placeholder={t("admin.auditActorEmail")}
            />
            <Input
              value={draft.action}
              onChange={(event) => setDraft((current) => ({ ...current, action: event.target.value }))}
              placeholder={t("admin.auditAction")}
            />
            <Input
              value={draft.targetType}
              onChange={(event) => setDraft((current) => ({ ...current, targetType: event.target.value }))}
              placeholder={t("admin.auditTargetType")}
            />
            <Input
              value={draft.targetId}
              onChange={(event) => setDraft((current) => ({ ...current, targetId: event.target.value }))}
              placeholder={t("admin.auditTargetId")}
            />
            <Select
              value={draft.status}
              onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as "" | AuditStatus }))}
            >
              <option value="">{t("admin.auditStatusAny")}</option>
              <option value="success">{t("admin.auditStatusSuccess")}</option>
              <option value="failure">{t("admin.auditStatusFailure")}</option>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleApply}>{t("admin.auditApplyFilters")}</Button>
            <Button type="button" variant="secondary" onClick={handleClear} disabled={!hasActiveFilters}>
              {t("admin.auditClearFilters")}
            </Button>
            <Button type="button" variant="secondary" onClick={handleExport} disabled={isExporting}>
              {isExporting ? t("admin.auditExporting") : t("admin.auditExportCsv")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.auditTableTitle")}</CardTitle>
          <CardDescription>{t("admin.auditTableSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <LoadingState /> : null}
          {!isLoading && loadError ? <ErrorState label={loadError} onRetry={loadLogs} /> : null}
          {!isLoading && !loadError && logs.length === 0 ? <EmptyState label={t("admin.auditNoLogs")} /> : null}

          {!isLoading && !loadError && logs.length > 0 ? (
            <>
              <DataTableShell minWidthClass="min-w-[1200px]">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">{t("admin.auditDateColumn")}</th>
                    <th className="px-3 py-2 text-left font-medium">{t("admin.auditActorColumn")}</th>
                    <th className="px-3 py-2 text-left font-medium">{t("admin.auditActionColumn")}</th>
                    <th className="px-3 py-2 text-left font-medium">{t("admin.auditTargetColumn")}</th>
                    <th className="px-3 py-2 text-left font-medium">{t("admin.auditStatusColumn")}</th>
                    <th className="px-3 py-2 text-left font-medium">{t("admin.auditRequestIdColumn")}</th>
                    <th className="px-3 py-2 text-left font-medium">{t("admin.auditDetailsColumn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((item) => (
                    <tr key={item.id} className="border-t border-border align-top">
                      <td className="px-3 py-2 text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        <div>{item.actorEmail || "-"}</div>
                        <div className="text-xs">{item.actorRole || "-"}</div>
                      </td>
                      <td className="px-3 py-2 text-foreground">{item.action}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.targetType}:{item.targetId ?? "-"}</td>
                      <td className="px-3 py-2">
                        <span className={item.status === "success" ? "text-emerald-600" : "text-rose-600"}>
                          {item.status === "success" ? t("admin.auditStatusSuccess") : t("admin.auditStatusFailure")}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{item.requestId}</td>
                      <td className="max-w-[420px] px-3 py-2 text-xs text-muted-foreground">
                        <details>
                          <summary className="cursor-pointer">{t("admin.auditDetailsExpand")}</summary>
                          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(item.payload, null, 2)}</pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTableShell>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={handlePrev} disabled={cursorHistory.length === 0}>
                  {t("admin.auditPrevious")}
                </Button>
                <Button type="button" variant="secondary" onClick={handleNext} disabled={!nextCursor}>
                  {t("admin.auditNext")}
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
