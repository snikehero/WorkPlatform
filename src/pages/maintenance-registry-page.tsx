import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { exportMaintenanceRecordToExcel } from "@/lib/maintenance-excel";
import { useI18n } from "@/i18n/i18n";
import { maintenanceStore } from "@/stores/maintenance-store";
import { maintenanceTemplateStore } from "@/stores/maintenance-template-store";
import type { MaintenanceRecord } from "@/types/maintenance-record";
import { MaintenanceList } from "@/components/maintenance/maintenance-list";

export const MaintenanceRegistryPage = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [filterMode, setFilterMode] = useState<"all" | "date">("all");
  const [templateState, setTemplateState] = useState(maintenanceTemplateStore.getState());
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const loadRecords = async () => {
    const data = await maintenanceStore.all();
    setRecords(data);
  };

  useEffect(() => {
    loadRecords().catch(() => setRecords([]));
  }, []);

  useEffect(() => {
    const unsubscribe = maintenanceTemplateStore.subscribe((next) => setTemplateState(next));
    return unsubscribe;
  }, []);

  const visibleRecords = useMemo(() => {
    if (filterMode === "all") return records;
    return records.filter((record) => record.maintenanceDate === selectedDate);
  }, [filterMode, records, selectedDate]);

  const handleDeleteRecord = async (recordId: string) => {
    try {
      await maintenanceStore.remove(recordId);
      showToast(t("maintenance.recordDeleted"), "success");
      await loadRecords();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("maintenance.recordDeleteFailed"), "error");
    }
  };

  const handleExportRecord = async (record: MaintenanceRecord) => {
    const templateFile = templateState.file;
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("maintenance.registryPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("maintenance.registryPageSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("maintenance.listTitle")}</CardTitle>
          <CardDescription>{t("maintenance.listSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-52 space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="maintenance-filter-mode">
                {t("maintenance.registryFilter")}
              </label>
              <Select
                id="maintenance-filter-mode"
                value={filterMode}
                onChange={(event) => setFilterMode(event.target.value as "all" | "date")}
              >
                <option value="all">{t("maintenance.registryFilterAll")}</option>
                <option value="date">{t("maintenance.registryFilterDate")}</option>
              </Select>
            </div>
            {filterMode === "date" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("maintenance.filterByDate")}</label>
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
            ) : null}
          </div>
          {exportMessage ? <p className="text-sm text-muted-foreground">{exportMessage}</p> : null}
        </CardContent>
      </Card>

      <MaintenanceList
        records={visibleRecords}
        onDeleteRecord={handleDeleteRecord}
        onExportRecord={handleExportRecord}
        canExport={Boolean(templateState.file)}
      />
    </div>
  );
};
