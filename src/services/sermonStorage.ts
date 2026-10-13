import type { Sermon } from "../types/domain";

export const sermonStorageKey = "pulpito-biblico-sermons-v1";

function isSermon(value: unknown): value is Sermon {
  if (!value || typeof value !== "object") return false;
  const sermon = value as Partial<Sermon>;
  return (
    typeof sermon.id === "string" &&
    typeof sermon.ownerId === "string" &&
    typeof sermon.title === "string" &&
    typeof sermon.mainBibleReference === "string" &&
    typeof sermon.topic === "string" &&
    (sermon.seriesId === null || typeof sermon.seriesId === "string") &&
    (sermon.date === null || typeof sermon.date === "string") &&
    typeof sermon.author === "string" &&
    ["draft", "prepared", "preached", "archived"].includes(sermon.status ?? "") &&
    typeof sermon.centralIdea === "string" &&
    typeof sermon.preachingObjective === "string" &&
    typeof sermon.introduction === "string" &&
    typeof sermon.historicalContext === "string" &&
    typeof sermon.literaryContext === "string" &&
    typeof sermon.biblicalContext === "string" &&
    typeof sermon.passageStructure === "string" &&
    typeof sermon.development === "string" &&
    typeof sermon.conclusion === "string" &&
    typeof sermon.finalChallenge === "string" &&
    Array.isArray(sermon.sections) &&
    sermon.sections.every((section) =>
      section &&
      typeof section.id === "string" &&
      typeof section.title === "string" &&
      typeof section.bibleReference === "string" &&
      typeof section.explanation === "string" &&
      typeof section.observation === "string" &&
      typeof section.illustration === "string" &&
      typeof section.application === "string" &&
      Array.isArray(section.additionalReferences) &&
      typeof section.privateNote === "string" &&
      ["projectable", "private"].includes(section.visibility) &&
      typeof section.order === "number"
    ) &&
    (!sermon.privateFields || Array.isArray(sermon.privateFields)) &&
    Array.isArray(sermon.tagIds) &&
    typeof sermon.createdAt === "string" &&
    typeof sermon.updatedAt === "string"
  );
}

export const sermonStorage = {
  list(): Sermon[] {
    const serialized = localStorage.getItem(sermonStorageKey);
    if (serialized === null) return [];

    const records: unknown = JSON.parse(serialized);
    if (!Array.isArray(records) || !records.every(isSermon)) {
      throw new Error("El almacenamiento de sermones tiene un formato no válido.");
    }
    return records.map((record) => ({
      ...record,
      privateFields: record.privateFields ?? [],
    }));
  },

  save(sermons: Sermon[]): void {
    localStorage.setItem(sermonStorageKey, JSON.stringify(sermons));
  },
};
