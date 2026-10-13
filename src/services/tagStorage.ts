import type { Tag } from "../types/domain";

export const tagStorageKey = "pulpito-biblico-tags-v1";
export const tagChangedEvent = "pulpito-biblico:tags-changed";

function isTag(value: unknown): value is Tag {
  if (!value || typeof value !== "object") return false;
  const tag = value as Partial<Tag>;
  return typeof tag.id === "string"
    && typeof tag.ownerId === "string"
    && typeof tag.name === "string"
    && typeof tag.createdAt === "string"
    && typeof tag.updatedAt === "string";
}

export const tagStorage = {
  list(): Tag[] {
    const serialized = localStorage.getItem(tagStorageKey);
    if (serialized === null) return [];
    const records: unknown = JSON.parse(serialized);
    if (!Array.isArray(records) || !records.every(isTag)) {
      throw new Error("El almacenamiento de etiquetas tiene un formato no válido.");
    }
    return records;
  },

  save(tags: Tag[]): void {
    localStorage.setItem(tagStorageKey, JSON.stringify(tags));
    window.dispatchEvent(new Event(tagChangedEvent));
  },
};
