import type { MaintenanceCheck, MaintenanceCategory } from "@/types/maintenance-record";

type MaintenanceCheckDefinition = {
  id: string;
  label: string;
  category: MaintenanceCategory;
  reviewedCell: string;
  observationCell: string;
};

export const maintenanceCheckDefinitions: MaintenanceCheckDefinition[] = [
  {
    id: "hardware-general-cleaning",
    label: "Limpieza General equipo y periféricos.",
    category: "hardware",
    reviewedCell: "N12",
    observationCell: "Q12",
  },
  {
    id: "hardware-internal-components-cleaning",
    label: "Limpieza componentes internos.",
    category: "hardware",
    reviewedCell: "N13",
    observationCell: "Q13",
  },
  {
    id: "hardware-peripherals-validation",
    label: "Validación correcto funcionamiento periféricos.",
    category: "hardware",
    reviewedCell: "N14",
    observationCell: "Q14",
  },
  {
    id: "hardware-power-system-validation",
    label:
      "Validación del correcto funcionamiento sistema de alimentación. (batería, módulo de carga, fuente de corriente, eliminador).",
    category: "hardware",
    reviewedCell: "N15",
    observationCell: "Q15",
  },
  {
    id: "hardware-network-card-validation",
    label: "Validación del correcto funcionamiento tarjeta de red (alámbrica e inalámbrica).",
    category: "hardware",
    reviewedCell: "N16",
    observationCell: "Q16",
  },
  {
    id: "software-os-diagnosis-correction",
    label: "Diagnóstico y corrección del sistema operativo.",
    category: "software",
    reviewedCell: "N19",
    observationCell: "Q19",
  },
  {
    id: "software-os-driver-updates",
    label: "Actualización sistema operativo, drivers y registros.",
    category: "software",
    reviewedCell: "N20",
    observationCell: "Q20",
  },
  {
    id: "software-system-files-cleanup",
    label: "Depuración de archivos de sistema.",
    category: "software",
    reviewedCell: "N21",
    observationCell: "Q21",
  },
  {
    id: "software-disk-optimization",
    label: "Optimización de disco duro.",
    category: "software",
    reviewedCell: "N22",
    observationCell: "Q22",
  },
  {
    id: "software-antivirus-check",
    label: "Revisiones de antivirus.",
    category: "software",
    reviewedCell: "N23",
    observationCell: "Q23",
  },
  {
    id: "software-virus-definitions-update",
    label: "Actualización de archivos de definición de virus (DATS).",
    category: "software",
    reviewedCell: "N24",
    observationCell: "Q24",
  },
  {
    id: "software-service-pack-installation",
    label: "Instalación de service pack, mejoras, versiones de software.",
    category: "software",
    reviewedCell: "N25",
    observationCell: "Q25",
  },
  {
    id: "software-ram-optimization",
    label: "Optimización de memoria RAM.",
    category: "software",
    reviewedCell: "N26",
    observationCell: "Q26",
  },
  {
    id: "software-disk-capacity-optimization",
    label: "Optimización en capacidad de disco duro.",
    category: "software",
    reviewedCell: "N27",
    observationCell: "Q27",
  },
  {
    id: "software-authorized-software-policies",
    label: "Revisión de software autorizado y políticas.",
    category: "software",
    reviewedCell: "N28",
    observationCell: "Q28",
  },
];

export const createMaintenanceChecks = (
  checkedIds: Set<string>,
  observationsById: Record<string, string>
) =>
  maintenanceCheckDefinitions.map<MaintenanceCheck>((item) => ({
    ...item,
    checked: checkedIds.has(item.id),
    observation: observationsById[item.id]?.trim() ?? "",
  }));
