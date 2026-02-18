import { useEffect, useMemo, useState } from "react";
import { addDays, differenceInCalendarDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/i18n";
import { assetStore } from "@/stores/asset-store";
import { maintenanceStore } from "@/stores/maintenance-store";
import type { Asset } from "@/types/asset";
import type { MaintenanceRecord } from "@/types/maintenance-record";

type MaintenanceDueItem = {
  assetId: string;
  assetTag: string;
  qrCode: string;
  serialNumber: string;
  user: string;
  location: string;
  lastMaintenanceDate: string | null;
  nextDueDate: string;
  daysToDue: number;
  state: "due" | "upcoming";
};

const DEFAULT_CYCLE_DAYS = 90;
const UPCOMING_WINDOW_DAYS = 14;

export const MaintenanceDashboardPage = () => {
  const { t } = useI18n();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);

  useEffect(() => {
    Promise.all([assetStore.all(), maintenanceStore.all()])
      .then(([assetData, recordData]) => {
        setAssets(assetData);
        setRecords(recordData);
      })
      .catch(() => {
        setAssets([]);
        setRecords([]);
      });
  }, []);

  const summary = useMemo(() => {
    const now = new Date();
    const recordsByIdentity = new Map<string, MaintenanceRecord[]>();
    for (const record of records) {
      const qrKey = record.qr.trim().toUpperCase();
      const serialKey = record.serialNumber.trim().toUpperCase();
      if (qrKey) {
        const current = recordsByIdentity.get(`qr:${qrKey}`) ?? [];
        current.push(record);
        recordsByIdentity.set(`qr:${qrKey}`, current);
      }
      if (serialKey) {
        const current = recordsByIdentity.get(`serial:${serialKey}`) ?? [];
        current.push(record);
        recordsByIdentity.set(`serial:${serialKey}`, current);
      }
    }

    const dueItems: MaintenanceDueItem[] = assets.map((asset) => {
      const qrKey = `qr:${asset.qrCode.trim().toUpperCase()}`;
      const serialKey = `serial:${asset.serialNumber.trim().toUpperCase()}`;
      const related = [...(recordsByIdentity.get(qrKey) ?? []), ...(recordsByIdentity.get(serialKey) ?? [])];
      const latest = related
        .map((record) => record.maintenanceDate)
        .sort((a, b) => (a < b ? 1 : -1))[0] ?? null;
      const baseDate = latest ? new Date(`${latest}T00:00:00`) : now;
      const nextDueDate = addDays(baseDate, DEFAULT_CYCLE_DAYS);
      const daysToDue = differenceInCalendarDays(nextDueDate, now);
      return {
        assetId: asset.id,
        assetTag: asset.assetTag,
        qrCode: asset.qrCode,
        serialNumber: asset.serialNumber,
        user: asset.user,
        location: asset.location,
        lastMaintenanceDate: latest,
        nextDueDate: nextDueDate.toISOString().slice(0, 10),
        daysToDue,
        state: daysToDue <= 0 ? "due" : "upcoming",
      };
    });

    const dueNow = dueItems.filter((item) => item.daysToDue <= 0);
    const upcoming = dueItems.filter((item) => item.daysToDue > 0 && item.daysToDue <= UPCOMING_WINDOW_DAYS);
    const tracked = dueNow.length + upcoming.length;

    return {
      dueNow,
      upcoming,
      tracked,
      totalAssets: assets.length,
    };
  }, [assets, records]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("maintenance.dashboardPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("maintenance.dashboardPageSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("maintenance.dashboardSummaryTitle")}</CardTitle>
          <CardDescription>{t("maintenance.dashboardSummarySubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-border p-4">
              <p className="text-xs text-muted-foreground">{t("maintenance.dashboardTotalAssets")}</p>
              <p className="text-2xl font-bold text-foreground">{summary.totalAssets}</p>
            </div>
            <div className="rounded-md border border-border p-4">
              <p className="text-xs text-muted-foreground">{t("maintenance.dashboardDueNow")}</p>
              <p className="text-2xl font-bold text-foreground">{summary.dueNow.length}</p>
            </div>
            <div className="rounded-md border border-border p-4">
              <p className="text-xs text-muted-foreground">{t("maintenance.dashboardUpcoming")}</p>
              <p className="text-2xl font-bold text-foreground">{summary.upcoming.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("maintenance.dashboardTrackedTitle")}</CardTitle>
          <CardDescription>{t("maintenance.dashboardTrackedSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.tracked === 0 ? (
            <p className="text-sm text-muted-foreground">{t("maintenance.dashboardNoDue")}</p>
          ) : (
            <ul className="space-y-3">
              {[...summary.dueNow, ...summary.upcoming]
                .sort((a, b) => a.daysToDue - b.daysToDue)
                .map((item) => (
                  <li key={item.assetId} className="rounded-md border border-border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {item.assetTag} · {item.serialNumber || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("maintenance.userPrefix")}: {item.user || t("common.unassigned")} · {t("maintenance.location")}: {item.location || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("maintenance.dashboardLastMaintenance")}: {item.lastMaintenanceDate ?? "-"} · {t("maintenance.dashboardNextDue")}: {item.nextDueDate}
                        </p>
                      </div>
                      <Badge variant={item.state === "due" ? "warning" : "info"}>
                        {item.state === "due"
                          ? t("maintenance.dashboardDueBadge")
                          : t("maintenance.dashboardUpcomingBadge", { days: String(item.daysToDue) })}
                      </Badge>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
