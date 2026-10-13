import type { Series } from "../types/domain";

export const seriesStorageKey = "pulpito-biblico-series-v1";
export const seriesChangedEvent = "pulpito-biblico:series-changed";

function isSeries(value: unknown): value is Series {
  if (!value || typeof value !== "object") return false;
  const series = value as Partial<Series>;
  return (
    typeof series.id === "string" &&
    typeof series.ownerId === "string" &&
    typeof series.name === "string" &&
    typeof series.description === "string" &&
    (series.imagePath === null || typeof series.imagePath === "string") &&
    (series.startsOn === null || typeof series.startsOn === "string") &&
    (series.endsOn === null || typeof series.endsOn === "string") &&
    Array.isArray(series.items) &&
    series.items.every((item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.ownerId === "string" &&
      typeof item.seriesId === "string" &&
      typeof item.contentId === "string" &&
      ["sermon", "study"].includes(item.contentType) &&
      typeof item.order === "number" &&
      typeof item.createdAt === "string" &&
      typeof item.updatedAt === "string"
    ) &&
    typeof series.createdAt === "string" &&
    typeof series.updatedAt === "string"
  );
}

export const seriesStorage = {
  list(): Series[] {
    const serialized = localStorage.getItem(seriesStorageKey);
    if (serialized === null) return [];

    const records: unknown = JSON.parse(serialized);
    if (!Array.isArray(records)) throw new Error("El almacenamiento de series tiene un formato no válido.");

    const compatibleRecords = records.map((record) => {
      if (record && typeof record === "object" && !Array.isArray(record) && !("items" in record)) {
        return { ...record, items: [] };
      }
      return record;
    });
    if (!compatibleRecords.every(isSeries)) {
      throw new Error("El almacenamiento de series tiene un formato no válido.");
    }
    return compatibleRecords;
  },

  save(series: Series[]): void {
    localStorage.setItem(seriesStorageKey, JSON.stringify(series));
  },
};
