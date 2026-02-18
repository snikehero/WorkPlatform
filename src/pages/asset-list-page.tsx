import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { assetStore } from "@/stores/asset-store";
import type { Asset } from "@/types/asset";
import { useI18n } from "@/i18n/i18n";

export const AssetListPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");

  const loadAssets = async () => {
    const data = await assetStore.all();
    setAssets(data);
  };

  useEffect(() => {
    loadAssets().catch(() => setAssets([]));
  }, []);

  const handleDelete = async (assetId: string) => {
    await assetStore.remove(assetId);
    await loadAssets();
  };

  const handleStartMaintenance = (item: Asset) => {
    const consecutive = item.assetTag.replace(/^TDC-/i, "").replace(/\D/g, "").padStart(4, "0").slice(-4);
    navigate("/asset-maintenance", {
      state: {
        prefill: {
          qr: item.qrCode,
          brand: item.manufacturer,
          model: item.model,
          user: item.user,
          serialNumber: item.serialNumber,
          consecutive,
          maintenanceType: "P",
          location: item.location,
        },
      },
    });
  };

  const filteredAssets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return assets;
    return assets.filter((item) =>
      [
        item.assetTag,
        item.qrCode,
        item.location,
        item.serialNumber,
        item.category,
        item.manufacturer,
        item.model,
        item.supplier,
        item.status,
        item.user,
        item.condition,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [assets, search]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("assets.listPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("assets.listPageSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("assets.inventoryTitle")}</CardTitle>
          <CardDescription>{t("assets.inventorySubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("assets.searchPlaceholder")}
            />
          </div>
          {filteredAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("assets.empty")}</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">{t("assets.assetTag")}</th>
                    <th className="px-3 py-2">{t("assets.qrCode")}</th>
                    <th className="px-3 py-2">{t("common.location")}</th>
                    <th className="px-3 py-2">{t("assets.serialNumber")}</th>
                    <th className="px-3 py-2">{t("common.category")}</th>
                    <th className="px-3 py-2">{t("assets.manufacturer")}</th>
                    <th className="px-3 py-2">{t("assets.model")}</th>
                    <th className="px-3 py-2">{t("assets.supplier")}</th>
                    <th className="px-3 py-2">{t("common.status")}</th>
                    <th className="px-3 py-2">{t("assets.user")}</th>
                    <th className="px-3 py-2">{t("assets.condition")}</th>
                    <th className="px-3 py-2">{t("common.view")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((item) => (
                    <tr key={item.id} className="border-t border-border align-top">
                      <td className="px-3 py-2">{item.assetTag}</td>
                      <td className="px-3 py-2">{item.qrCode || "-"}</td>
                      <td className="px-3 py-2">{item.location || "-"}</td>
                      <td className="px-3 py-2">{item.serialNumber || "-"}</td>
                      <td className="px-3 py-2">{item.category || "-"}</td>
                      <td className="px-3 py-2">{item.manufacturer || "-"}</td>
                      <td className="px-3 py-2">{item.model || "-"}</td>
                      <td className="px-3 py-2">{item.supplier || "-"}</td>
                      <td className="px-3 py-2">
                        <Badge variant={item.status === "active" ? "success" : item.status === "maintenance" ? "warning" : "neutral"}>
                          {t(`assets.status.${item.status}`)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">{item.user || "-"}</td>
                      <td className="px-3 py-2">{item.condition || "-"}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <Button variant="default" size="sm" onClick={() => handleStartMaintenance(item)}>
                            {t("assets.startMaintenance")}
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => navigate(`/assets/register/${item.id}`)}>
                            {t("assets.edit")}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                            {t("common.delete")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
