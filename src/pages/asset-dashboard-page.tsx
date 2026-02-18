import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/i18n/i18n";
import { assetStore } from "@/stores/asset-store";
import type { Asset } from "@/types/asset";

const normalizeValue = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

export const AssetDashboardPage = () => {
  const { t } = useI18n();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeCardKey, setActiveCardKey] = useState<string | null>(null);

  useEffect(() => {
    assetStore
      .all()
      .then((data) => setAssets(data))
      .catch(() => setAssets([]));
  }, []);

  const summary = useMemo(() => {
    const totalAssetsList = assets;
    const desktopAssets = assets.filter((item) => normalizeValue(item.category) === "desktop");
    const laptopAssets = assets.filter((item) => normalizeValue(item.category) === "laptop");
    const unregisteredAssetsList = assets.filter((item) => {
      const user = normalizeValue(item.user);
      return user === "" || user === "unassigned" || user === "sin asignar";
    });
    const assignedAssetsList = assets.filter((item) => {
      const user = normalizeValue(item.user);
      return !(user === "" || user === "unassigned" || user === "sin asignar");
    });
    const activeAssetsList = assets.filter((item) => item.status === "active");
    const maintenanceAssetsList = assets.filter((item) => item.status === "maintenance");
    const retiredOrLostAssetsList = assets.filter((item) => item.status === "retired" || item.status === "lost");
    const missingQrAssetsList = assets.filter((item) => normalizeValue(item.qrCode) === "");
    const totalAssets = totalAssetsList.length;
    const totalDesktops = desktopAssets.length;
    const totalLaptops = laptopAssets.length;
    const unregisteredAssets = unregisteredAssetsList.length;
    const assignedAssets = assignedAssetsList.length;
    const activeAssets = activeAssetsList.length;
    const maintenanceAssets = maintenanceAssetsList.length;
    const retiredOrLostAssets = retiredOrLostAssetsList.length;
    const missingQrAssets = missingQrAssetsList.length;
    const assignmentRate = totalAssets > 0 ? Math.round((assignedAssets / totalAssets) * 100) : 0;

    const statusRows: Array<{ label: string; count: number; variant: "success" | "warning" | "neutral" }> = [
      { label: "active", count: activeAssets, variant: "success" },
      { label: "maintenance", count: maintenanceAssets, variant: "warning" },
      { label: "retired", count: assets.filter((item) => item.status === "retired").length, variant: "neutral" },
      { label: "lost", count: assets.filter((item) => item.status === "lost").length, variant: "neutral" },
    ];

    const topCategories = Object.entries(
      assets.reduce<Record<string, number>>((acc, item) => {
        const key = item.category.trim();
        if (!key) return acc;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topLocations = Object.entries(
      assets.reduce<Record<string, number>>((acc, item) => {
        const key = item.location.trim();
        if (!key) return acc;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalAssets,
      totalDesktops,
      totalLaptops,
      unregisteredAssets,
      assignedAssets,
      activeAssets,
      maintenanceAssets,
      retiredOrLostAssets,
      missingQrAssets,
      assignmentRate,
      statusRows,
      topCategories,
      topLocations,
      cards: [
        { key: "total-assets", labelKey: "assets.totalAssets", count: totalAssets, assets: totalAssetsList },
        { key: "total-desktops", labelKey: "assets.totalDesktops", count: totalDesktops, assets: desktopAssets },
        { key: "total-laptops", labelKey: "assets.totalLaptops", count: totalLaptops, assets: laptopAssets },
        { key: "unregistered-assets", labelKey: "assets.unregisteredAssets", count: unregisteredAssets, assets: unregisteredAssetsList },
        { key: "assigned-assets", labelKey: "assets.assignedAssets", count: assignedAssets, assets: assignedAssetsList, suffix: `${assignmentRate}%` },
        { key: "active-assets", labelKey: "assets.activeAssets", count: activeAssets, assets: activeAssetsList },
        { key: "maintenance-assets", labelKey: "assets.maintenanceAssets", count: maintenanceAssets, assets: maintenanceAssetsList },
        { key: "retired-lost-assets", labelKey: "assets.retiredOrLostAssets", count: retiredOrLostAssets, assets: retiredOrLostAssetsList },
        { key: "missing-qr-assets", labelKey: "assets.missingQrAssets", count: missingQrAssets, assets: missingQrAssetsList },
      ] as Array<{ key: string; labelKey: string; count: number; assets: Asset[]; suffix?: string }>,
    };
  }, [assets]);
  const activeCard = summary.cards.find((card) => card.key === activeCardKey) ?? null;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("assets.dashboardTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("assets.dashboardSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("assets.dashboardTitle")}</CardTitle>
          <CardDescription>{t("assets.dashboardSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {summary.cards.map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={() => setActiveCardKey(card.key)}
                className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
              >
                <p className="text-xs text-muted-foreground">{t(card.labelKey)}</p>
                <p className="text-2xl font-bold text-foreground">{card.count}</p>
                {card.suffix ? <p className="text-xs text-muted-foreground">{card.suffix}</p> : null}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>{t("assets.byStatus")}</CardTitle>
            <CardDescription>{t("assets.byStatusSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.statusRows.map((row) => {
              const percent = summary.totalAssets > 0 ? Math.round((row.count / summary.totalAssets) * 100) : 0;
              return (
                <div key={row.label} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={row.variant}>{t(`assets.status.${row.label}`)}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {row.count} ({percent}%)
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>{t("assets.topCategories")}</CardTitle>
            <CardDescription>{t("assets.topCategoriesSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">-</p>
            ) : (
              summary.topCategories.map(([label, count]) => (
                <div key={label} className="flex items-center justify-between rounded-md border border-border p-3">
                  <p className="text-sm text-foreground">{label}</p>
                  <p className="text-sm font-semibold text-foreground">{count}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>{t("assets.topLocations")}</CardTitle>
            <CardDescription>{t("assets.topLocationsSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.topLocations.length === 0 ? (
              <p className="text-sm text-muted-foreground">-</p>
            ) : (
              summary.topLocations.map(([label, count]) => (
                <div key={label} className="flex items-center justify-between rounded-md border border-border p-3">
                  <p className="text-sm text-foreground">{label}</p>
                  <p className="text-sm font-semibold text-foreground">{count}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={activeCard !== null} onOpenChange={(open) => !open && setActiveCardKey(null)}>
        <DialogContent className="max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{activeCard ? t(activeCard.labelKey) : ""}</DialogTitle>
            <DialogDescription>
              {t("assets.modalTotal")}: {activeCard?.assets.length ?? 0}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto px-4">
            {activeCard && activeCard.assets.length > 0 ? (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">{t("assets.assetTag")}</th>
                      <th className="px-3 py-2">{t("assets.qrCode")}</th>
                      <th className="px-3 py-2">{t("common.category")}</th>
                      <th className="px-3 py-2">{t("common.status")}</th>
                      <th className="px-3 py-2">{t("assets.user")}</th>
                      <th className="px-3 py-2">{t("common.location")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCard.assets.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-3 py-2">{item.assetTag || "-"}</td>
                        <td className="px-3 py-2">{item.qrCode || "-"}</td>
                        <td className="px-3 py-2">{item.category || "-"}</td>
                        <td className="px-3 py-2">{t(`assets.status.${item.status}`)}</td>
                        <td className="px-3 py-2">{item.user || t("assets.unassigned")}</td>
                        <td className="px-3 py-2">{item.location || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("assets.modalEmpty")}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("common.close")}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
