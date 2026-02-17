type ParsedDailyNote = {
  title: string;
  content: string;
  noteDate: string;
};

const MONTHS_ES: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

const normalizeHeading = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseDateFromSpanishText = (value: string): string | null => {
  const clean = value.trim();
  const match = clean.match(/(\d{1,2})\s+de\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s+d(?:e|el)\s+(\d{4})/i);
  if (!match) return null;

  const day = Number(match[1]);
  const monthName = normalizeHeading(match[2]);
  const year = Number(match[3]);
  const month = MONTHS_ES[monthName];

  if (!day || !month || !year) return null;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
};

const parseDateFromFilename = (filename: string): string | null => {
  const match = filename.match(/(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  const year = Number(`20${match[1]}`);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
};

const sectionLabel = (heading: string): string | null => {
  const normalized = normalizeHeading(heading);

  if (normalized.includes("fecha")) return "Fecha";
  if (normalized.includes("hice ayer")) return "Que hice ayer";
  if (normalized.includes("hare hoy")) return "Que hare hoy";
  if (normalized.includes("problema ayer")) return "Problemas";
  if (normalized.includes("preguntas para el daily")) return "Preguntas";

  return null;
};

export const parseObsidianDailyMarkdown = (filename: string, markdown: string): ParsedDailyNote => {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const sections: Array<{ heading: string; body: string[] }> = [];
  let current: { heading: string; body: string[] } | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+\*\*(.+?)\*\*\s*$/);
    if (headingMatch) {
      current = { heading: headingMatch[1].trim(), body: [] };
      sections.push(current);
      continue;
    }

    if (current) {
      current.body.push(line);
    }
  }

  const sectionMap = new Map<string, string>();
  let noteDate = parseDateFromFilename(filename);

  for (const section of sections) {
    const label = sectionLabel(section.heading);
    if (!label) continue;
    const text = section.body.join("\n").trim();
    sectionMap.set(label, text);

    if (label === "Fecha") {
      const fromContent = parseDateFromSpanishText(text);
      if (fromContent) noteDate = fromContent;
    }
  }

  if (!noteDate) {
    noteDate = new Date().toISOString().slice(0, 10);
  }

  const contentParts = [
    ["Que hice ayer", sectionMap.get("Que hice ayer") ?? ""],
    ["Que hare hoy", sectionMap.get("Que hare hoy") ?? ""],
    ["Problemas", sectionMap.get("Problemas") ?? ""],
    ["Preguntas", sectionMap.get("Preguntas") ?? ""],
  ]
    .filter(([, body]) => body.trim().length > 0)
    .map(([label, body]) => `${label}:\n${body.trim()}`);

  const content = contentParts.join("\n\n");

  return {
    title: `Daily ${noteDate}`,
    content,
    noteDate,
  };
};
