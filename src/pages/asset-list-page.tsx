import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { assetStore } from "@/stores/asset-store";
import type { Asset } from "@/types/asset";
import { useI18n } from "@/i18n/i18n";

type SortKey =
  | "assetTag"
  | "qrCode"
  | "location"
  | "serialNumber"
  | "category"
  | "manufacturer"
  | "model"
  | "supplier"
  | "status"
  | "user"
  | "condition";

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  "dd externo": "border-amber-300/40 bg-amber-400/10 text-amber-700 dark:text-amber-300",
  desktop: "border-indigo-300/40 bg-indigo-400/10 text-indigo-700 dark:text-indigo-300",
  impresora: "border-orange-300/40 bg-orange-400/10 text-orange-700 dark:text-orange-300",
  laptop: "border-cyan-300/40 bg-cyan-400/10 text-cyan-700 dark:text-cyan-300",
  monitor: "border-violet-300/40 bg-violet-400/10 text-violet-700 dark:text-violet-300",
  mouse: "border-lime-300/40 bg-lime-400/10 text-lime-700 dark:text-lime-300",
  nas: "border-fuchsia-300/40 bg-fuchsia-400/10 text-fuchsia-700 dark:text-fuchsia-300",
  otro: "border-slate-300/40 bg-slate-400/10 text-slate-700 dark:text-slate-300",
  plotter: "border-pink-300/40 bg-pink-400/10 text-pink-700 dark:text-pink-300",
  printer: "border-orange-300/40 bg-orange-400/10 text-orange-700 dark:text-orange-300",
  server: "border-rose-300/40 bg-rose-400/10 text-rose-700 dark:text-rose-300",
  servidor: "border-rose-300/40 bg-rose-400/10 text-rose-700 dark:text-rose-300",
  tablet: "border-teal-300/40 bg-teal-400/10 text-teal-700 dark:text-teal-300",
  teclado: "border-emerald-300/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
  webcam: "border-sky-300/40 bg-sky-400/10 text-sky-700 dark:text-sky-300",
  phone: "border-lime-300/40 bg-lime-400/10 text-lime-700 dark:text-lime-300",
  "network equipment": "border-fuchsia-300/40 bg-fuchsia-400/10 text-fuchsia-700 dark:text-fuchsia-300",
  accessory: "border-slate-300/40 bg-slate-400/10 text-slate-700 dark:text-slate-300",
};

const getCategoryBadgeClass = (category: string) => {
  const normalized = category.trim().toLowerCase();
  return CATEGORY_BADGE_CLASSES[normalized] ?? "border-border bg-muted/40 text-foreground";
};

export const AssetListPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [manufacturerFilter, setManufacturerFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("assetTag");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  const locationOptions = useMemo(
    () => Array.from(new Set(assets.map((item) => item.location).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [assets]
  );
  const categoryOptions = useMemo(
    () => Array.from(new Set(assets.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [assets]
  );
  const manufacturerOptions = useMemo(
    () => Array.from(new Set(assets.map((item) => item.manufacturer).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [assets]
  );
  const supplierOptions = useMemo(
    () => Array.from(new Set(assets.map((item) => item.supplier).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [assets]
  );
  const conditionOptions = useMemo(
    () => Array.from(new Set(assets.map((item) => item.condition).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [assets]
  );
  const filteredAndSortedAssets = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = assets.filter((item) => {
      const matchesSearch = !term
        ? true
        : [
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
            .includes(term);

      if (!matchesSearch) return false;
      if (locationFilter && item.location !== locationFilter) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (manufacturerFilter && item.manufacturer !== manufacturerFilter) return false;
      if (supplierFilter && item.supplier !== supplierFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (conditionFilter && item.condition !== conditionFilter) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const aValue = (a[sortKey] ?? "").toString().toLowerCase();
      const bValue = (b[sortKey] ?? "").toString().toLowerCase();
      const result = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? result : -result;
    });
  }, [
    assets,
    search,
    locationFilter,
    categoryFilter,
    manufacturerFilter,
    supplierFilter,
    statusFilter,
    conditionFilter,
    sortKey,
    sortDirection,
  ]);

  const setSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="size-3 text-muted-foreground" />;
    return sortDirection === "asc" ? <ArrowUpAZ className="size-3" /> : <ArrowDownAZ className="size-3" />;
  };

  const clearFilters = () => {
    setSearch("");
    setLocationFilter("");
    setCategoryFilter("");
    setManufacturerFilter("");
    setSupplierFilter("");
    setStatusFilter("");
    setConditionFilter("");
  };

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
          <div className="mb-3 grid gap-3 lg:grid-cols-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("assets.searchPlaceholder")}
            />
            <Select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
              <option value="">{t("common.location")}</option>
              {locationOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="">{t("common.category")}</option>
              {categoryOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            <Select value={manufacturerFilter} onChange={(event) => setManufacturerFilter(event.target.value)}>
              <option value="">{t("assets.manufacturer")}</option>
              {manufacturerOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            <Select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}>
              <option value="">{t("assets.supplier")}</option>
              {supplierOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">{t("common.status")}</option>
              <option value="active">{t("assets.status.active")}</option>
              <option value="maintenance">{t("assets.status.maintenance")}</option>
              <option value="retired">{t("assets.status.retired")}</option>
              <option value="lost">{t("assets.status.lost")}</option>
            </Select>
            <Select value={conditionFilter} onChange={(event) => setConditionFilter(event.target.value)}>
              <option value="">{t("assets.condition")}</option>
              {conditionOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            <Button type="button" variant="secondary" onClick={clearFilters}>
              {t("common.clear")}
            </Button>
          </div>
          {filteredAndSortedAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("assets.empty")}</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort("assetTag")}>
                        {t("assets.assetTag")} {renderSortIcon("assetTag")}
                      </button>
                    </th>
                    <th className="px-3 py-2">
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort("qrCode")}>
                        {t("assets.qrCode")} {renderSortIcon("qrCode")}
                      </button>
                    </th>
                    <th className="px-3 py-2">
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort("location")}>
                        {t("common.location")} {renderSortIcon("location")}
                      </button>
                    </th>
                    <th className="px-3 py-2">
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort("serialNumber")}>
                        {t("assets.serialNumber")} {renderSortIcon("serialNumber")}
                      </button>
                    </th>
                    <th className="px-3 py-2">
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort("category")}>
                        {t("common.category")} {renderSortIcon("category")}
                      </button>
                    </th>
                    <th className="px-3 py-2">
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort("manufacturer")}>
                        {t("assets.manufacturer")} {renderSortIcon("manufacturer")}
                      </button>
                    </th>
                    <th className="px-3 py-2">
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort("model")}>
                        {t("assets.model")} {renderSortIcon("model")}
                      </button>
                    </th>
                    <th className="px-3 py-2">
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort("supplier")}>
                        {t("assets.supplier")} {renderSortIcon("supplier")}
                      </button>
                    </th>
                    <th className="px-3 py-2">
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort("status")}>
                        {t("common.status")} {renderSortIcon("status")}
                      </button>
                    </th>
                    <th className="px-3 py-2">
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort("user")}>
                        {t("assets.user")} {renderSortIcon("user")}
                      </button>
                    </th>
                    <th className="px-3 py-2">
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort("condition")}>
                        {t("assets.condition")} {renderSortIcon("condition")}
                      </button>
                    </th>
                    <th className="px-3 py-2">{t("common.view")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedAssets.map((item) => (
                    <tr key={item.id} className="border-t border-border align-top">
                      <td className="px-3 py-2">{item.assetTag}</td>
                      <td className="px-3 py-2">{item.qrCode || "-"}</td>
                      <td className="px-3 py-2">{item.location || "-"}</td>
                      <td className="px-3 py-2">{item.serialNumber || "-"}</td>
                      <td className="px-3 py-2">
                        {item.category ? (
                          <Badge variant="neutral" className={getCategoryBadgeClass(item.category)}>
                            {item.category}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2">{item.manufacturer || "-"}</td>
                      <td className="px-3 py-2">{item.model || "-"}</td>
                      <td className="px-3 py-2">{item.supplier || "-"}</td>
                      <td className="px-3 py-2">
                        <Badge variant={item.status === "active" ? "success" : item.status === "maintenance" ? "warning" : "neutral"}>
                          {t(`assets.status.${item.status}`)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">{item.user || t("assets.unassigned")}</td>
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
