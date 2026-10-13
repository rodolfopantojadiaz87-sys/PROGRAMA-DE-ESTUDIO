import type { BibleStudy } from "../types/domain";

export const studyStorageKey = "pulpito-biblico-studies-v1";

function isStudy(value: unknown): value is BibleStudy {
  if (!value || typeof value !== "object") return false;
  const study = value as Partial<BibleStudy>;
  return (
    typeof study.id === "string" &&
    typeof study.ownerId === "string" &&
    typeof study.title === "string" &&
    typeof study.mainBibleReference === "string" &&
    typeof study.objective === "string" &&
    typeof study.introduction === "string" &&
    typeof study.context === "string" &&
    typeof study.observation === "string" &&
    typeof study.interpretation === "string" &&
    typeof study.explanation === "string" &&
    Array.isArray(study.questions) &&
    study.questions.every((question) =>
      question &&
      typeof question.id === "string" &&
      typeof question.question === "string" &&
      typeof question.answer === "string" &&
      typeof question.application === "string" &&
      typeof question.order === "number" &&
      ["projectable", "private"].includes(question.visibility)
    ) &&
    typeof study.applications === "string" &&
    typeof study.discussion === "string" &&
    typeof study.conclusion === "string" &&
    typeof study.personalReflection === "string" &&
    typeof study.weeklyAssignment === "string" &&
    ["draft", "prepared", "preached", "archived"].includes(study.status ?? "") &&
    (study.seriesId === null || typeof study.seriesId === "string") &&
    (!study.privateFields || Array.isArray(study.privateFields)) &&
    Array.isArray(study.tagIds) &&
    typeof study.createdAt === "string" &&
    typeof study.updatedAt === "string"
  );
}

export const studyStorage = {
  list(): BibleStudy[] {
    const serialized = localStorage.getItem(studyStorageKey);
    if (serialized === null) return [];

    const records: unknown = JSON.parse(serialized);
    if (!Array.isArray(records) || !records.every(isStudy)) {
      throw new Error("El almacenamiento de estudios tiene un formato no válido.");
    }
    return records.map((record) => ({ ...record, privateFields: record.privateFields ?? [] }));
  },

  save(studies: BibleStudy[]): void {
    localStorage.setItem(studyStorageKey, JSON.stringify(studies));
  },
};
