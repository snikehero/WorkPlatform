import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useLocation } from "react-router-dom";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n";
import { maintenanceStore } from "@/stores/maintenance-store";
import { maintenanceTemplateStore } from "@/stores/maintenance-template-store";
import { useAuthStore } from "@/stores/auth-store";
import type { MaintenanceCheck } from "@/types/maintenance-record";

type MaintenancePrefillState = {
  prefill?: {
    qr?: string;
    brand?: string;
    model?: string;
    user?: string;
    serialNumber?: string;
    consecutive?: string;
    maintenanceType?: "P" | "C";
    location?: string;
  };
};

export const MaintenanceCreatePage = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const location = useLocation();
  const navigationState = (location.state as MaintenancePrefillState | null) ?? null;
  const prefill = navigationState?.prefill ?? null;
  const userEmail = useAuthStore.getState().userEmail ?? "";
  const responsibleName = userEmail.split("@", 1)[0].toLocaleUpperCase("es-MX");
  const [formKey, setFormKey] = useState(0);
  const [templateState, setTemplateState] = useState(maintenanceTemplateStore.getState());
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCreateRecord = async (input: {
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
  }) => {
    try {
      await maintenanceStore.add({ ...input, responsibleName });
      showToast(t("maintenance.recordSaved"), "success");
      setFormKey((current) => current + 1);
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("maintenance.recordSaveFailed"), "error");
    }
  };

  useEffect(() => {
    const unsubscribe = maintenanceTemplateStore.subscribe((next) => setTemplateState(next));
    return unsubscribe;
  }, []);

  const handleTemplateUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await maintenanceTemplateStore.setTemplateFromFile(file);
      const infoMessage = `${t("maintenance.templateLoaded")}: ${file.name}`;
      setTemplateMessage(infoMessage);
      showToast(infoMessage, "info");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("maintenance.unexpectedExportError");
      showToast(message, "error");
    }
    event.target.value = "";
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("maintenance.createPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("maintenance.createPageSubtitle")}</p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>{t("maintenance.templateLabel")}</CardTitle>
          <CardDescription>{t("maintenance.uploadTemplateFirst")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xlsm"
            className="hidden"
            onChange={handleTemplateUpload}
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            {templateState.name ? t("maintenance.replaceTemplate") : t("maintenance.loadTemplate")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("maintenance.templateLabel")}: {templateState.name ?? t("maintenance.notLoaded")}
          </p>
          {templateMessage ? <p className="text-sm text-muted-foreground">{templateMessage}</p> : null}
        </CardContent>
      </Card>
      <MaintenanceForm
        key={formKey}
        responsibleName={responsibleName}
        initialValues={prefill}
        onCreateRecord={handleCreateRecord}
      />
    </div>
  );
};
