import { useState } from "react";
import { useLocation } from "react-router-dom";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n";
import { maintenanceStore } from "@/stores/maintenance-store";
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

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("maintenance.createPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("maintenance.createPageSubtitle")}</p>
      </section>
      <MaintenanceForm
        key={formKey}
        responsibleName={responsibleName}
        initialValues={prefill}
        onCreateRecord={handleCreateRecord}
      />
    </div>
  );
};
