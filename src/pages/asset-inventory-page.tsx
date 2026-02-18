import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { assetStore } from "@/stores/asset-store";
import type { Asset, AssetStatus } from "@/types/asset";
import { useI18n } from "@/i18n/i18n";

type AssetDraft = {
  assetTag: string;
  qrCode: string;
  location: string;
  serialNumber: string;
  category: string;
  manufacturer: string;
  model: string;
  supplier: string;
  status: AssetStatus;
  user: string;
  condition: string;
};

const LOCATION_OPTIONS = [
  "Francisco Tres Guerras #230",
  "Francisco de P. Mariel #120",
  "BMW G.O",
  "Guadalajara",
];

const CATEGORY_OPTIONS = [
  "Desktop",
  "Laptop",
  "Servidor",
  "Impresora",
  "Mouse",
  "Teclado",
  "Monitor",
  "HDD",
  "WebCam",
];

const getNextAssetTag = (items: Asset[]) => {
  let highest = 0;
  for (const item of items) {
    const match = /^TDC-(\d{4,})$/i.exec(item.assetTag.trim());
    if (!match) continue;
    const value = Number.parseInt(match[1], 10);
    if (Number.isFinite(value) && value > highest) highest = value;
  }
  return `TDC-${String(highest + 1).padStart(4, "0")}`;
};

const EMPTY_DRAFT: AssetDraft = {
  assetTag: "",
  qrCode: "",
  location: "",
  serialNumber: "",
  category: "",
  manufacturer: "",
  model: "",
  supplier: "",
  status: "active",
  user: "",
  condition: "",
};

export const AssetInventoryPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { assetId } = useParams<{ assetId: string }>();
  const isEditMode = Boolean(assetId);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<AssetDraft>(EMPTY_DRAFT);
  const nextAssetTag = useMemo(() => getNextAssetTag(assets), [assets]);

  const loadAssets = async () => {
    const data = await assetStore.all();
    setAssets(data);
  };

  useEffect(() => {
    loadAssets().catch(() => setAssets([]));
  }, []);

  useEffect(() => {
    if (isEditMode) return;
    setDraft((current) => ({ ...current, assetTag: nextAssetTag }));
  }, [isEditMode, nextAssetTag]);

  useEffect(() => {
    if (!isEditMode || !assetId) return;
    const item = assets.find((asset) => asset.id === assetId);
    if (!item) return;
    setDraft({
      assetTag: item.assetTag,
      qrCode: item.qrCode,
      location: item.location,
      serialNumber: item.serialNumber,
      category: item.category,
      manufacturer: item.manufacturer,
      model: item.model,
      supplier: item.supplier,
      status: item.status,
      user: item.user,
      condition: item.condition,
    });
  }, [assetId, assets, isEditMode]);

  const resetForm = () => {
    if (isEditMode) {
      navigate("/assets/list");
      return;
    }
    setDraft({ ...EMPTY_DRAFT, assetTag: nextAssetTag });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!draft.assetTag.trim()) {
      setMessage(t("assets.requiredFields"));
      return;
    }

    const payload = { ...draft };

    try {
      if (isEditMode && assetId) {
        await assetStore.update(assetId, payload);
        setMessage(t("assets.updated"));
      } else {
        await assetStore.add(payload);
        setMessage(t("assets.created"));
      }
      if (isEditMode) {
        navigate("/assets/list");
      } else {
        resetForm();
      }
      await loadAssets();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("assets.saveFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isEditMode ? t("assets.editTitle") : t("assets.registerPageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEditMode ? t("assets.formSubtitle") : t("assets.registerPageSubtitle")}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? t("assets.editTitle") : t("assets.createTitle")}</CardTitle>
          <CardDescription>{t("assets.formSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="asset-tag">{t("assets.assetTag")}</Label>
                <Input
                  id="asset-tag"
                  value={draft.assetTag}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-qr-code">{t("assets.qrCode")}</Label>
                <Input
                  id="asset-qr-code"
                  value={draft.qrCode}
                  onChange={(event) => setDraft((current) => ({ ...current, qrCode: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-location">{t("common.location")}</Label>
                <Select
                  id="asset-location"
                  value={draft.location}
                  onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
                >
                  <option value=""></option>
                  {LOCATION_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
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
                <Label htmlFor="asset-category">{t("common.category")}</Label>
                <Select
                  id="asset-category"
                  value={draft.category}
                  onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                >
                  <option value=""></option>
                  {CATEGORY_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
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
                <Label htmlFor="asset-manufacturer">{t("assets.manufacturer")}</Label>
                <Input
                  id="asset-manufacturer"
                  value={draft.manufacturer}
                  onChange={(event) => setDraft((current) => ({ ...current, manufacturer: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-model">{t("assets.model")}</Label>
                <Input
                  id="asset-model"
                  value={draft.model}
                  onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-supplier">{t("assets.supplier")}</Label>
                <Input
                  id="asset-supplier"
                  value={draft.supplier}
                  onChange={(event) => setDraft((current) => ({ ...current, supplier: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-user">{t("assets.user")}</Label>
                <Input
                  id="asset-user"
                  value={draft.user}
                  onChange={(event) => setDraft((current) => ({ ...current, user: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-condition">{t("assets.condition")}</Label>
                <Input
                  id="asset-condition"
                  value={draft.condition}
                  onChange={(event) => setDraft((current) => ({ ...current, condition: event.target.value }))}
                />
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit">{isEditMode ? t("common.save") : t("assets.create")}</Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  {isEditMode ? t("assets.cancelEdit") : t("common.clear")}
                </Button>
              </div>
          </form>
          {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
};
