import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MaintenanceRecord } from "@/types/maintenance-record";
import { useI18n } from "@/i18n/i18n";

type MaintenanceListProps = {
  records: MaintenanceRecord[];
  onDeleteRecord: (recordId: string) => void;
  onExportRecord: (record: MaintenanceRecord) => void;
  canExport: boolean;
};

export const MaintenanceList = ({
  records,
  onDeleteRecord,
  onExportRecord,
  canExport,
}: MaintenanceListProps) => {
  const { t } = useI18n();
  const getCheckLabel = (checkId: string, fallback: string) => {
    const key = `maintenance.check.${checkId}`;
    const translated = t(key);
    return translated === key ? fallback : translated;
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("maintenance.listTitle")}</CardTitle>
        <CardDescription>{t("maintenance.listSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("maintenance.empty")}</p>
        ) : (
          <ul className="space-y-4">
            {records.map((record) => {
              const checkedCount = record.checks.filter((check) => check.checked).length;
              const totalCount = record.checks.length;
              const checkedHardware = record.checks.filter(
                (check) => check.category === "hardware" && check.checked
              );
              const checkedSoftware = record.checks.filter(
                (check) => check.category === "software" && check.checked
              );

              return (
                <li key={record.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {record.model} · {record.serialNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("maintenance.brandPrefix")}: {record.brand}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("maintenance.qrUserPrefix")}: {record.qr} · {t("maintenance.userPrefix")}: {record.user}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("maintenance.consecutivePrefix")}: {record.consecutive}{record.maintenanceType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("maintenance.locationResponsiblePrefix")}: {record.location} · {t("maintenance.responsiblePrefix")}: {record.responsibleName}
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        {t("maintenance.datePrefix")}: {format(new Date(`${record.maintenanceDate}T00:00:00`), "PPP")}
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        {t("maintenance.reviewedCountPrefix")}: {checkedCount}/{totalCount}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onExportRecord(record)}
                        disabled={!canExport}
                      >
                        {t("maintenance.exportExcel")}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onDeleteRecord(record.id)}>
                        {t("common.delete")}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                        {t("maintenance.hardwareChecked")}
                      </p>
                      {checkedHardware.length === 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">{t("maintenance.noChecks")}</p>
                      ) : (
                        <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                          {checkedHardware.map((item) => (
                            <li key={item.id}>
                              - {getCheckLabel(item.id, item.label)}
                              {item.observation ? ` (${item.observation})` : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                        {t("maintenance.softwareChecked")}
                      </p>
                      {checkedSoftware.length === 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">{t("maintenance.noChecks")}</p>
                      ) : (
                        <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                          {checkedSoftware.map((item) => (
                            <li key={item.id}>
                              - {getCheckLabel(item.id, item.label)}
                              {item.observation ? ` (${item.observation})` : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
