import { useEffect, useState, type FormEvent } from "react";
import { createMaintenanceChecks, maintenanceCheckDefinitions } from "@/lib/maintenance-checks";
import type { MaintenanceCheck } from "@/types/maintenance-record";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/i18n";

type MaintenanceFormProps = {
  responsibleName: string;
  initialValues?: {
    qr?: string;
    brand?: string;
    model?: string;
    user?: string;
    serialNumber?: string;
    consecutive?: string;
    maintenanceType?: "P" | "C";
    location?: string;
  } | null;
  onCreateRecord: (input: {
    maintenanceDate: string;
    qr: string;
    brand: string;
    model: string;
    user: string;
    serialNumber: string;
    consecutive: string;
    maintenanceType: "P" | "C";
    location: string;
    responsibleName: string;
    checks: MaintenanceCheck[];
  }) => void;
};

export const MaintenanceForm = ({ responsibleName, initialValues, onCreateRecord }: MaintenanceFormProps) => {
  const { t } = useI18n();
  const toUpper = (value: string) => value.toLocaleUpperCase("es-MX");
  const today = new Date().toISOString().slice(0, 10);
  const [maintenanceDate, setMaintenanceDate] = useState(today);
  const [qr, setQr] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [user, setUser] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [consecutive, setConsecutive] = useState("");
  const [maintenanceType, setMaintenanceType] = useState<"P" | "C">("P");
  const [location, setLocation] = useState("");
  const [selectedChecks, setSelectedChecks] = useState<Set<string>>(new Set());
  const [observationsById, setObservationsById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialValues) return;
    setQr(toUpper(initialValues.qr ?? ""));
    setBrand(toUpper(initialValues.brand ?? ""));
    setModel(toUpper(initialValues.model ?? ""));
    setUser(toUpper(initialValues.user ?? ""));
    setSerialNumber(toUpper(initialValues.serialNumber ?? ""));
    setConsecutive(toUpper(initialValues.consecutive ?? ""));
    setMaintenanceType(initialValues.maintenanceType ?? "P");
    setLocation(toUpper(initialValues.location ?? ""));
  }, [initialValues]);

  const toggleCheck = (checkId: string) => {
    setSelectedChecks((current) => {
      const next = new Set(current);
      if (next.has(checkId)) {
        next.delete(checkId);
      } else {
        next.add(checkId);
      }
      return next;
    });
  };

  const resetForm = () => {
    setMaintenanceDate(today);
    setQr("");
    setBrand("");
    setModel("");
    setUser("");
    setSerialNumber("");
    setConsecutive("");
    setMaintenanceType("P");
    setLocation("");
    setSelectedChecks(new Set());
    setObservationsById({});
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !maintenanceDate.trim() ||
      !qr.trim() ||
      !brand.trim() ||
      !model.trim() ||
      !user.trim() ||
      !serialNumber.trim() ||
      !consecutive.trim() ||
      !location.trim() ||
      !responsibleName.trim()
    ) {
      return;
    }

    onCreateRecord({
      maintenanceDate: maintenanceDate.trim(),
      qr: qr.trim(),
      brand: brand.trim(),
      model: model.trim(),
      user: user.trim(),
      serialNumber: serialNumber.trim(),
      consecutive: consecutive.trim(),
      maintenanceType,
      location: location.trim(),
      responsibleName: responsibleName.trim(),
      checks: createMaintenanceChecks(selectedChecks, observationsById),
    });

    resetForm();
  };

  const hardwareChecks = maintenanceCheckDefinitions.filter((item) => item.category === "hardware");
  const softwareChecks = maintenanceCheckDefinitions.filter((item) => item.category === "software");
  const getCheckLabel = (checkId: string, fallback: string) => {
    const labelKey = `maintenance.check.${checkId}`;
    const translated = t(labelKey);
    return translated === labelKey ? fallback : translated;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("maintenance.formTitle")}</CardTitle>
        <CardDescription>{t("maintenance.formSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maintenance-date">{t("maintenance.date")}</Label>
              <Input
                id="maintenance-date"
                type="date"
                value={maintenanceDate}
                onChange={(event) => setMaintenanceDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-qr">{t("maintenance.qr")}</Label>
              <Input
                id="maintenance-qr"
                value={qr}
                onChange={(event) => setQr(toUpper(event.target.value))}
                placeholder="TDC-26-0147-B"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-model">{t("maintenance.model")}</Label>
              <Input
                id="maintenance-model"
                value={model}
                onChange={(event) => setModel(toUpper(event.target.value))}
                placeholder="NITRO AN515-44"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-brand">{t("maintenance.brand")}</Label>
              <Input
                id="maintenance-brand"
                value={brand}
                onChange={(event) => setBrand(toUpper(event.target.value))}
                placeholder="ACER"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-user">{t("maintenance.user")}</Label>
              <Input
                id="maintenance-user"
                value={user}
                onChange={(event) => setUser(toUpper(event.target.value))}
                placeholder={t("maintenance.userPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-serial">{t("maintenance.serialNumber")}</Label>
              <Input
                id="maintenance-serial"
                value={serialNumber}
                onChange={(event) => setSerialNumber(toUpper(event.target.value))}
                placeholder={t("maintenance.serialPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-consecutive">{t("maintenance.consecutive")}</Label>
              <Input
                id="maintenance-consecutive"
                value={consecutive}
                onChange={(event) => setConsecutive(toUpper(event.target.value))}
                placeholder="0022"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("maintenance.type")}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={maintenanceType === "P" ? "default" : "secondary"}
                  onClick={() => setMaintenanceType("P")}
                >
                  P
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={maintenanceType === "C" ? "default" : "secondary"}
                  onClick={() => setMaintenanceType("C")}
                >
                  C
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-location">{t("maintenance.location")}</Label>
              <Input
                id="maintenance-location"
                value={location}
                onChange={(event) => setLocation(toUpper(event.target.value))}
                placeholder={t("maintenance.locationPlaceholder")}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="maintenance-responsible">{t("maintenance.responsible")}</Label>
              <Input
                id="maintenance-responsible"
                value={responsibleName}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">{t("maintenance.hardware")}</p>
              <div className="mt-2 space-y-2">
                {hardwareChecks.map((item) => (
                  <div key={item.id} className="rounded-md border border-border p-2">
                    <label className="flex items-start gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={selectedChecks.has(item.id)}
                        onChange={() => toggleCheck(item.id)}
                        className="mt-0.5"
                      />
                      <span>{getCheckLabel(item.id, item.label)}</span>
                    </label>
                    <Input
                      className="mt-2"
                      placeholder={t("maintenance.observationOptional")}
                      value={observationsById[item.id] ?? ""}
                      onChange={(event) =>
                        setObservationsById((current) => ({
                          ...current,
                          [item.id]: toUpper(event.target.value),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t("maintenance.software")}</p>
              <div className="mt-2 space-y-2">
                {softwareChecks.map((item) => (
                  <div key={item.id} className="rounded-md border border-border p-2">
                    <label className="flex items-start gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={selectedChecks.has(item.id)}
                        onChange={() => toggleCheck(item.id)}
                        className="mt-0.5"
                      />
                      <span>{getCheckLabel(item.id, item.label)}</span>
                    </label>
                    <Input
                      className="mt-2"
                      placeholder={t("maintenance.observationOptional")}
                      value={observationsById[item.id] ?? ""}
                      onChange={(event) =>
                        setObservationsById((current) => ({
                          ...current,
                          [item.id]: toUpper(event.target.value),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button type="submit">{t("maintenance.save")}</Button>
        </form>
      </CardContent>
    </Card>
  );
};

