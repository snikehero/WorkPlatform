import { useState, type FormEvent } from "react";
import { createMaintenanceChecks, maintenanceCheckDefinitions } from "@/lib/maintenance-checks";
import type { MaintenanceCheck } from "@/types/maintenance-record";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MaintenanceFormProps = {
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

export const MaintenanceForm = ({ onCreateRecord }: MaintenanceFormProps) => {
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
  const [responsibleName, setResponsibleName] = useState("");
  const [selectedChecks, setSelectedChecks] = useState<Set<string>>(new Set());
  const [observationsById, setObservationsById] = useState<Record<string, string>>({});

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
    setResponsibleName("");
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo Mantenimiento de PC</CardTitle>
        <CardDescription>Captura el formato que hoy llevas en Excel.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maintenance-date">Fecha</Label>
              <Input
                id="maintenance-date"
                type="date"
                value={maintenanceDate}
                onChange={(event) => setMaintenanceDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-qr">QR</Label>
              <Input
                id="maintenance-qr"
                value={qr}
                onChange={(event) => setQr(toUpper(event.target.value))}
                placeholder="TDC-26-0147-B"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-model">Modelo</Label>
              <Input
                id="maintenance-model"
                value={model}
                onChange={(event) => setModel(toUpper(event.target.value))}
                placeholder="NITRO AN515-44"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-brand">Marca</Label>
              <Input
                id="maintenance-brand"
                value={brand}
                onChange={(event) => setBrand(toUpper(event.target.value))}
                placeholder="ACER"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-user">Usuario</Label>
              <Input
                id="maintenance-user"
                value={user}
                onChange={(event) => setUser(toUpper(event.target.value))}
                placeholder="Nombre del usuario"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-serial">No. de Serie</Label>
              <Input
                id="maintenance-serial"
                value={serialNumber}
                onChange={(event) => setSerialNumber(toUpper(event.target.value))}
                placeholder="Serie del equipo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-consecutive">Consecutivo</Label>
              <Input
                id="maintenance-consecutive"
                value={consecutive}
                onChange={(event) => setConsecutive(toUpper(event.target.value))}
                placeholder="0022"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo (P | C)</Label>
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
              <Label htmlFor="maintenance-location">Ubicacion</Label>
              <Input
                id="maintenance-location"
                value={location}
                onChange={(event) => setLocation(toUpper(event.target.value))}
                placeholder="Ubicacion fisica"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="maintenance-responsible">Nombre responsable de mantenimiento</Label>
              <Input
                id="maintenance-responsible"
                value={responsibleName}
                onChange={(event) => setResponsibleName(toUpper(event.target.value))}
                placeholder="Nombre y firma responsable"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">Hardware</p>
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
                      <span>{item.label}</span>
                    </label>
                    <Input
                      className="mt-2"
                      placeholder="Observacion (opcional)"
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
              <p className="text-sm font-medium text-foreground">Software</p>
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
                      <span>{item.label}</span>
                    </label>
                    <Input
                      className="mt-2"
                      placeholder="Observacion (opcional)"
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

          <Button type="submit">Guardar mantenimiento</Button>
        </form>
      </CardContent>
    </Card>
  );
};
