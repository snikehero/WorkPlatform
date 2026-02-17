import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { assetStore } from "@/stores/asset-store";
import type { Asset, AssetStatus } from "@/types/asset";
import { useI18n } from "@/i18n/i18n";

type AssetDraft = {
  assetTag: string;
  name: string;
  category: string;
  status: AssetStatus;
  assignedTo: string;
  serialNumber: string;
  location: string;
  purchaseDate: string;
  warrantyUntil: string;
  notes: string;
};

const EMPTY_DRAFT: AssetDraft = {
  assetTag: "",
  name: "",
  category: "",
  status: "active",
  assignedTo: "",
  serialNumber: "",
  location: "",
  purchaseDate: "",
  warrantyUntil: "",
  notes: "",
};

export const AssetInventoryPage = () => {
  const { t } = useI18n();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AssetDraft>(EMPTY_DRAFT);

  const loadAssets = async () => {
    const data = await assetStore.all();
    setAssets(data);
  };

  useEffect(() => {
    loadAssets().catch(() => setAssets([]));
  }, []);

  const filteredAssets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return assets;
    return assets.filter((item) =>
      [item.assetTag, item.name, item.category, item.status, item.assignedTo, item.serialNumber, item.location]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [assets, search]);

  const resetForm = () => {
    setActiveId(null);
    setDraft(EMPTY_DRAFT);
  };

  const handleEdit = (item: Asset) => {
    setActiveId(item.id);
    setDraft({
      assetTag: item.assetTag,
      name: item.name,
      category: item.category,
      status: item.status,
      assignedTo: item.assignedTo,
      serialNumber: item.serialNumber,
      location: item.location,
      purchaseDate: item.purchaseDate ?? "",
      warrantyUntil: item.warrantyUntil ?? "",
      notes: item.notes,
    });
    setMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!draft.assetTag.trim() || !draft.name.trim()) {
      setMessage(t("assets.requiredFields"));
      return;
    }

    const payload = {
      ...draft,
      purchaseDate: draft.purchaseDate.trim() ? draft.purchaseDate.trim() : null,
      warrantyUntil: draft.warrantyUntil.trim() ? draft.warrantyUntil.trim() : null,
    };

    try {
      if (activeId) {
        await assetStore.update(activeId, payload);
        setMessage(t("assets.updated"));
      } else {
        await assetStore.add(payload);
        setMessage(t("assets.created"));
      }
      resetForm();
      await loadAssets();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("assets.saveFailed"));
    }
  };

  const handleDelete = async (assetId: string) => {
    await assetStore.remove(assetId);
    if (activeId === assetId) resetForm();
    await loadAssets();
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("assets.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("assets.pageSubtitle")}</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{activeId ? t("assets.editTitle") : t("assets.createTitle")}</CardTitle>
            <CardDescription>{t("assets.formSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="asset-tag">{t("assets.assetTag")}</Label>
                <Input
                  id="asset-tag"
                  value={draft.assetTag}
                  onChange={(event) => setDraft((current) => ({ ...current, assetTag: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-name">{t("common.title")}</Label>
                <Input
                  id="asset-name"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-category">{t("common.category")}</Label>
                <Input
                  id="asset-category"
                  value={draft.category}
                  onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-status">{t("common.status")}</Label>
                <Select
                  id="asset-status"
                  value={draft.status}
                  onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as AssetStatus }))}
                >
                  <option value="active">{t("assets.status.active")}</option>
                  <option value="maintenance">{t("assets.status.maintenance")}</option>
                  <option value="retired">{t("assets.status.retired")}</option>
                  <option value="lost">{t("assets.status.lost")}</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-assigned">{t("assets.assignedTo")}</Label>
                <Input
                  id="asset-assigned"
                  value={draft.assignedTo}
                  onChange={(event) => setDraft((current) => ({ ...current, assignedTo: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-serial">{t("assets.serialNumber")}</Label>
                <Input
                  id="asset-serial"
                  value={draft.serialNumber}
                  onChange={(event) => setDraft((current) => ({ ...current, serialNumber: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-location">{t("common.location")}</Label>
                <Input
                  id="asset-location"
                  value={draft.location}
                  onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-purchase">{t("assets.purchaseDate")}</Label>
                <Input
                  id="asset-purchase"
                  type="date"
                  value={draft.purchaseDate}
                  onChange={(event) => setDraft((current) => ({ ...current, purchaseDate: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-warranty">{t("assets.warrantyUntil")}</Label>
                <Input
                  id="asset-warranty"
                  type="date"
                  value={draft.warrantyUntil}
                  onChange={(event) => setDraft((current) => ({ ...current, warrantyUntil: event.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="asset-notes">{t("common.details")}</Label>
                <Textarea
                  id="asset-notes"
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                />
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit">{activeId ? t("common.save") : t("assets.create")}</Button>
                {activeId ? (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    {t("assets.cancelEdit")}
                  </Button>
                ) : null}
              </div>
            </form>
            {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
        </Card>

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
              <ul className="space-y-3">
                {filteredAssets.map((item) => (
                  <li key={item.id} className="rounded-md border border-border bg-card p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.assetTag} - {item.name}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {item.category ? <span>{item.category}</span> : null}
                          {item.location ? <span>{item.location}</span> : null}
                        </div>
                        <div className="mt-2">
                          <Badge variant={item.status === "active" ? "success" : item.status === "maintenance" ? "warning" : "neutral"}>
                            {t(`assets.status.${item.status}`)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(item)}>
                          {t("assets.edit")}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                          {t("common.delete")}
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
