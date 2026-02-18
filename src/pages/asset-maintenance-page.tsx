import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { MaintenanceList } from "@/components/maintenance/maintenance-list";
import { useToast } from "@/components/ui/toast";
import { exportMaintenanceRecordToExcel } from "@/lib/maintenance-excel";
import { maintenanceStore } from "@/stores/maintenance-store";
import { useAuthStore } from "@/stores/auth-store";
import type { MaintenanceCheck, MaintenanceRecord } from "@/types/maintenance-record";
import { useI18n } from "@/i18n/i18n";

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

export const AssetMaintenancePage = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const location = useLocation();
  const navigationState = (location.state as MaintenancePrefillState | null) ?? null;
  const prefill = navigationState?.prefill ?? null;
  const userEmail = useAuthStore.getState().userEmail ?? "";
  const responsibleName = userEmail.split("@", 1)[0].toLocaleUpperCase("es-MX");
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadRecords = async () => {
    const data = await maintenanceStore.all();
    setRecords(data);
  };

  useEffect(() => {
    loadRecords().catch(() => setRecords([]));
  }, []);

  const filteredRecords = useMemo(
    () => records.filter((record) => record.maintenanceDate === selectedDate),
    [records, selectedDate]
  );

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
      await loadRecords();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("maintenance.recordSaveFailed"), "error");
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      await maintenanceStore.remove(recordId);
      showToast(t("maintenance.recordDeleted"), "success");
      await loadRecords();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("maintenance.recordDeleteFailed"), "error");
    }
  };

  const handleTemplateUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setTemplateFile(file);
    setTemplateName(file.name);
    const infoMessage = `${t("maintenance.templateLoaded")}: ${file.name}`;
    setExportMessage(infoMessage);
    showToast(infoMessage, "info");
    event.target.value = "";
  };

  const handleExportRecord = async (record: MaintenanceRecord) => {
    if (!templateFile) {
      const errorMessage = t("maintenance.uploadTemplateFirst");
      setExportMessage(errorMessage);
      showToast(errorMessage, "error");
      return;
    }

    try {
      await exportMaintenanceRecordToExcel(record, templateFile);
      const successMessage = t("maintenance.exported", { id: record.qr || record.serialNumber });
      setExportMessage(successMessage);
      showToast(successMessage, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("maintenance.unexpectedExportError");
      const errorMessage = `${t("maintenance.exportFailed")}: ${message}`;
      setExportMessage(errorMessage);
      showToast(errorMessage, "error");
    }
  };

  const calendarClassNames = {
    months: "flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0",
    month: "space-y-4",
    month_caption: "flex items-center justify-center pt-1 relative",
    caption_label: "text-sm font-medium",
    nav: "flex items-center justify-between",
    button_previous: "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100",
    button_next: "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100",
    month_grid: "w-full border-collapse space-y-1",
    weekdays: "flex",
    weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
    week: "flex w-full mt-2",
    day: "h-9 w-9 text-center text-sm p-0 relative",
    day_button: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("maintenance.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("maintenance.pageSubtitle")}
        </p>
      </section>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="maintenance-date-filter">
                {t("maintenance.filterByDate")}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary" className="min-w-[220px] justify-start">
                    {format(new Date(`${selectedDate}T00:00:00`), "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(`${selectedDate}T00:00:00`)}
                    onSelect={(date) => {
                      if (!date) return;
                      setSelectedDate(format(date, "yyyy-MM-dd"));
                    }}
                    classNames={calendarClassNames}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button variant="secondary" onClick={() => setSelectedDate(today)}>
              {t("common.today")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xlsm"
              className="hidden"
              onChange={handleTemplateUpload}
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              {templateName ? t("maintenance.replaceTemplate") : t("maintenance.loadTemplate")}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("maintenance.templateLabel")}: {templateName ?? t("maintenance.notLoaded")}
          </p>
          {exportMessage ? <p className="mt-1 text-sm text-muted-foreground">{exportMessage}</p> : null}
        </CardContent>
      </Card>

      <MaintenanceForm responsibleName={responsibleName} initialValues={prefill} onCreateRecord={handleCreateRecord} />
      <MaintenanceList
        records={filteredRecords}
        onDeleteRecord={handleDeleteRecord}
        onExportRecord={handleExportRecord}
        canExport={Boolean(templateFile)}
      />
    </div>
  );
};
