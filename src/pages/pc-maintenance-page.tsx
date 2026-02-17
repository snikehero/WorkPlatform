import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { MaintenanceList } from "@/components/maintenance/maintenance-list";
import { exportMaintenanceRecordToExcel } from "@/lib/maintenance-excel";
import { maintenanceStore } from "@/stores/maintenance-store";
import type { MaintenanceCheck, MaintenanceRecord } from "@/types/maintenance-record";

export const PcMaintenancePage = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [version, setVersion] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const records = useMemo(() => maintenanceStore.all(), [version]);
  const filteredRecords = useMemo(
    () => records.filter((record) => record.maintenanceDate === selectedDate),
    [records, selectedDate]
  );

  const refresh = () => setVersion((current) => current + 1);

  const handleCreateRecord = (input: {
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
    maintenanceStore.add(input);
    refresh();
  };

  const handleDeleteRecord = (recordId: string) => {
    maintenanceStore.remove(recordId);
    refresh();
  };

  const handleTemplateUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setTemplateFile(file);
    setTemplateName(file.name);
    setExportMessage(`Template loaded: ${file.name}`);
    event.target.value = "";
  };

  const handleExportRecord = async (record: MaintenanceRecord) => {
    if (!templateFile) {
      setExportMessage("Upload your Excel template first.");
      return;
    }

    try {
      await exportMaintenanceRecordToExcel(record, templateFile);
      setExportMessage(`Exported ${record.qr || record.serialNumber} to Excel.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected export error.";
      setExportMessage(`Failed to export: ${message}`);
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">PC Maintenance</h1>
        <p className="text-sm text-muted-foreground">
          Registra mantenimientos con el formato operativo de hardware y software.
        </p>
      </section>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="maintenance-date-filter">
                Filter by date
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
              Today
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xlsm"
              className="hidden"
              onChange={handleTemplateUpload}
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              {templateName ? "Replace Template" : "Load Excel Template"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Template: {templateName ?? "Not loaded"}
          </p>
          {exportMessage ? <p className="mt-1 text-sm text-muted-foreground">{exportMessage}</p> : null}
        </CardContent>
      </Card>

      <MaintenanceForm onCreateRecord={handleCreateRecord} />
      <MaintenanceList
        records={filteredRecords}
        onDeleteRecord={handleDeleteRecord}
        onExportRecord={handleExportRecord}
        canExport={Boolean(templateFile)}
      />
    </div>
  );
};
