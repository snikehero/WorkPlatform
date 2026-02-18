import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { assetStore } from "@/stores/asset-store";
import { peopleStore } from "@/stores/people-store";
import type { Asset, AssetHistoryEvent, AssetStatus } from "@/types/asset";
import type { ManagedPerson } from "@/types/person";
import { useI18n } from "@/i18n/i18n";

type AssetDraft = {
  assetTag: string;
  qrCode: string;
  qrClass: "A" | "B" | "C";
  location: string;
  serialNumber: string;
  category: string;
  manufacturer: string;
  model: string;
  supplier: string;
  status: AssetStatus;
  user: string;
  condition: string;
  notes: string;
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
  "NAS",
  "Plotter",
  "Otro",
];

const SUPPLIER_OPTIONS = [
  "TDC-COMPRAS",
  "TDC-ADMINISTRACION",
  "TDC-ALMACEN",
];

const UNASSIGNED_USER = "Unassigned";
const QR_CLASS_OPTIONS = ["A", "B", "C"] as const;

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

const getCurrentYear2Digits = () => String(new Date().getFullYear() % 100).padStart(2, "0");

const getAssetTagConsecutive = (assetTag: string) => {
  const match = /^TDC-(\d{4,})$/i.exec(assetTag.trim());
  if (!match) return 1;
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : 1;
};

const buildQrCode = (assetTag: string, qrClass: "A" | "B" | "C") =>
  `TDC-${getCurrentYear2Digits()}-${String(getAssetTagConsecutive(assetTag)).padStart(4, "0")}-${qrClass}`;

const buildQrImageUrl = (value: string, size: number) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;

const parseQrClass = (qrCode: string): "A" | "B" | "C" => {
  const match = /^TDC-\d{2}-\d{4}-([ABC])$/i.exec((qrCode || "").trim());
  if (!match) return "A";
  return match[1].toUpperCase() as "A" | "B" | "C";
};

const EMPTY_DRAFT: AssetDraft = {
  assetTag: "",
  qrCode: "",
  qrClass: "A",
  location: "",
  serialNumber: "",
  category: "",
  manufacturer: "",
  model: "",
  supplier: "",
  status: "active",
  user: UNASSIGNED_USER,
  condition: "",
  notes: "",
};

export const AssetInventoryPage = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { assetId } = useParams<{ assetId: string }>();
  const isEditMode = Boolean(assetId);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [history, setHistory] = useState<AssetHistoryEvent[]>([]);
  const [people, setPeople] = useState<ManagedPerson[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<AssetDraft>(EMPTY_DRAFT);
  const nextAssetTag = useMemo(() => getNextAssetTag(assets), [assets]);
  const qrPreviewUrl = useMemo(() => buildQrImageUrl(draft.qrCode, 240), [draft.qrCode]);
  const manufacturerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          assets
            .map((item) => item.manufacturer.trim().toLocaleUpperCase("es-MX"))
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [assets]
  );
  const modelOptions = useMemo(
    () =>
      Array.from(
        new Set(
          assets
            .map((item) => item.model.trim().toLocaleUpperCase("es-MX"))
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [assets]
  );

  const peopleOptions = useMemo(
    () => [...people].sort((a, b) => a.name.localeCompare(b.name, "es-MX")),
    [people]
  );

  const loadAssets = async () => {
    const data = await assetStore.all();
    setAssets(data);
  };

  const loadPeople = async () => {
    const data = await peopleStore.all();
    setPeople(data);
  };

  const loadHistory = async () => {
    if (!assetId) {
      setHistory([]);
      return;
    }
    const events = await assetStore.history(assetId);
    setHistory(events);
  };

  useEffect(() => {
    Promise.all([loadAssets(), loadPeople()]).catch(() => {
      setAssets([]);
      setPeople([]);
    });
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      setHistory([]);
      return;
    }
    loadHistory().catch(() => setHistory([]));
  }, [assetId, isEditMode]);

  useEffect(() => {
    if (isEditMode) return;
    setDraft((current) => ({
      ...current,
      assetTag: nextAssetTag,
      qrCode: buildQrCode(nextAssetTag, current.qrClass),
    }));
  }, [isEditMode, nextAssetTag]);

  useEffect(() => {
    if (!isEditMode || !assetId) return;
    const item = assets.find((asset) => asset.id === assetId);
    if (!item) return;
    setDraft({
      assetTag: item.assetTag,
      qrCode: item.qrCode,
      qrClass: parseQrClass(item.qrCode),
      location: item.location,
      serialNumber: item.serialNumber,
      category: item.category,
      manufacturer: item.manufacturer,
      model: item.model,
      supplier: item.supplier,
      status: item.status,
      user: item.user || UNASSIGNED_USER,
      condition: item.condition,
      notes: item.notes || "",
    });
  }, [assetId, assets, isEditMode]);

  const resetForm = () => {
    if (isEditMode) {
      navigate("/assets/list");
      return;
    }
    setDraft({
      ...EMPTY_DRAFT,
      assetTag: nextAssetTag,
      qrCode: buildQrCode(nextAssetTag, EMPTY_DRAFT.qrClass),
    });
  };

  useEffect(() => {
    if (isEditMode) {
      setDraft((current) => ({
        ...current,
        qrCode: buildQrCode(current.assetTag, current.qrClass),
      }));
      return;
    }
    setDraft((current) => ({ ...current, qrCode: buildQrCode(current.assetTag, current.qrClass) }));
  }, [draft.qrClass, draft.assetTag, isEditMode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!draft.assetTag.trim()) {
      const errorMessage = t("assets.requiredFields");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
      return;
    }

    const payload = { ...draft };

    try {
      if (isEditMode && assetId) {
        await assetStore.update(assetId, payload);
        const successMessage = t("assets.updated");
        setMessage(successMessage);
        showToast(successMessage, "success");
        await loadHistory();
      } else {
        await assetStore.add(payload);
        const successMessage = t("assets.created");
        setMessage(successMessage);
        showToast(successMessage, "success");
      }
      if (isEditMode) {
        navigate("/assets/list");
      } else {
        resetForm();
      }
      await loadAssets();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("assets.saveFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    }
  };

  const openQrInNewTab = () => {
    window.open(qrPreviewUrl, "_blank", "noopener,noreferrer");
  };

  const downloadQr = async () => {
    const response = await fetch(qrPreviewUrl);
    if (!response.ok) throw new Error("Failed to generate QR");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${draft.qrCode || "asset-qr"}.png`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
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
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-qr-class">{t("assets.qrClass")}</Label>
                <Select
                  id="asset-qr-class"
                  value={draft.qrClass}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, qrClass: event.target.value as "A" | "B" | "C" }))
                  }
                >
                  {QR_CLASS_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
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
                  list="asset-manufacturer-options"
                  value={draft.manufacturer}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, manufacturer: event.target.value.toLocaleUpperCase("es-MX") }))
                  }
                />
                <datalist id="asset-manufacturer-options">
                  {manufacturerOptions.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-model">{t("assets.model")}</Label>
                <Input
                  id="asset-model"
                  list="asset-model-options"
                  value={draft.model}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, model: event.target.value.toLocaleUpperCase("es-MX") }))
                  }
                />
                <datalist id="asset-model-options">
                  {modelOptions.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-supplier">{t("assets.supplier")}</Label>
                <Select
                  id="asset-supplier"
                  value={draft.supplier}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, supplier: event.target.value.toLocaleUpperCase("es-MX") }))
                  }
                >
                  <option value=""></option>
                  {SUPPLIER_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-user">{t("assets.user")}</Label>
                <Select
                  id="asset-user"
                  value={draft.user}
                  onChange={(event) => setDraft((current) => ({ ...current, user: event.target.value }))}
                >
                  <option value={UNASSIGNED_USER}>{t("assets.unassigned")}</option>
                  {peopleOptions.map((person) => (
                    <option key={person.id} value={person.name}>
                      {person.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-condition">{t("assets.condition")}</Label>
                <Input
                  id="asset-condition"
                  value={draft.condition}
                  onChange={(event) => setDraft((current) => ({ ...current, condition: event.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="asset-notes">{t("assets.notes")}</Label>
                <Textarea
                  id="asset-notes"
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  rows={6}
                />
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit">{isEditMode ? t("common.save") : t("assets.create")}</Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  {isEditMode ? t("assets.cancelEdit") : t("common.clear")}
                </Button>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("assets.generateQr")}</Label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={openQrInNewTab}>
                    {t("assets.generateQr")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() =>
                      downloadQr().catch(() => {
                        const errorMessage = t("assets.qrDownloadFailed");
                        setMessage(errorMessage);
                        showToast(errorMessage, "error");
                      })
                    }
                  >
                    {t("assets.downloadQr")}
                  </Button>
                </div>
                <img src={qrPreviewUrl} alt={`QR ${draft.qrCode}`} className="h-32 w-32 rounded border border-border p-1" />
              </div>
          </form>
          {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
      {isEditMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Asset Lifecycle</CardTitle>
            <CardDescription>Change history and maintenance activity for this asset.</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No lifecycle events yet.</p>
            ) : (
              <ul className="space-y-3">
                {history.map((event) => (
                  <li key={event.id} className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium text-foreground">
                      {event.eventType}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString()} | {event.actorEmail ?? "system"}
                    </p>
                    <pre className="mt-2 overflow-auto rounded bg-muted/40 p-2 text-xs text-muted-foreground">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
