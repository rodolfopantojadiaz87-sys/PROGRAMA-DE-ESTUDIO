import type { BibleStudy, Series, Sermon, Tag } from "../types/domain";

export type LibraryEntryType =
  | "sermon"
  | "study"
  | "series"
  | "reference"
  | "illustration"
  | "application"
  | "note";

export interface LibraryEntry {
  id: string;
  type: LibraryEntryType;
  title: string;
  body: string;
  reference: string;
  updatedAt: string;
  href: string;
  searchableText: string;
  tags: string[];
}

interface LibrarySource {
  sermons: Sermon[];
  studies: BibleStudy[];
  series: Series[];
  tags: Tag[];
}

function createEntry(
  entry: Omit<LibraryEntry, "searchableText" | "tags">,
  additionalSearchText = "",
  tags: string[] = [],
): LibraryEntry {
  return {
    ...entry,
    tags,
    searchableText: [
      entry.title,
      entry.body,
      entry.reference,
      additionalSearchText,
      tags.join(" "),
    ].join(" ").toLocaleLowerCase(),
  };
}

export function buildLibraryIndex({ sermons, studies, series, tags }: LibrarySource): LibraryEntry[] {
  const seriesNames = new Map(series.map((item) => [item.id, item.name]));
  const sermonSeriesNames = new Map(sermons.map((sermon) => {
    const relatedSeries = series.filter((item) =>
      item.items.some((entry) => entry.contentType === "sermon" && entry.contentId === sermon.id),
    );
    const legacySeries = sermon.seriesId ? seriesNames.get(sermon.seriesId) : undefined;
    return [sermon.id, [...new Set([...relatedSeries.map((item) => item.name), ...(legacySeries ? [legacySeries] : [])])].join(" ")] as const;
  }));
  const tagNames = new Map(tags.map((tag) => [tag.id, tag.name]));
  const entries: LibraryEntry[] = [];

  sermons.forEach((sermon) => {
    const seriesName = sermonSeriesNames.get(sermon.id) ?? "";
    const sermonTags = sermon.tagIds.map((tagId) => tagNames.get(tagId)).filter((name): name is string => Boolean(name));
    const href = `/sermons/${sermon.id}/edit`;
    entries.push(createEntry({
      id: `sermon-${sermon.id}`,
      type: "sermon",
      title: sermon.title || "Sermón sin título",
      body: [sermon.topic, sermon.centralIdea, sermon.development, sermon.conclusion]
        .filter(Boolean).join(" · "),
      reference: sermon.mainBibleReference,
      updatedAt: sermon.updatedAt,
      href,
    }, `${seriesName} ${sermon.author} ${sermon.preachingObjective} ${sermon.introduction} ${sermon.historicalContext} ${sermon.literaryContext} ${sermon.biblicalContext} ${sermon.passageStructure} ${sermon.finalChallenge} ${sermon.sections.map((section) => [
      section.title,
      section.bibleReference,
      ...section.additionalReferences,
      section.explanation,
      section.observation,
      section.illustration,
      section.application,
      section.privateNote,
    ].join(" ")).join(" ")}`, sermonTags));

    const sermonReferences = [
      { reference: sermon.mainBibleReference, context: sermon.title },
      ...sermon.sections.flatMap((section) => [
        section.bibleReference,
        ...section.additionalReferences,
      ].map((reference) => ({
        reference,
        context: section.title || sermon.title,
      }))),
    ];
    const uniqueReferences = new Map<string, { reference: string; context: string }>();
    sermonReferences.forEach(({ reference, context }) => {
      const normalizedReference = reference.trim().toLocaleLowerCase();
      if (normalizedReference && !uniqueReferences.has(normalizedReference)) {
        uniqueReferences.set(normalizedReference, { reference: reference.trim(), context });
      }
    });
    uniqueReferences.forEach(({ reference, context }, index) => {
      entries.push(createEntry({
        id: `reference-sermon-${sermon.id}-${index}`,
        type: "reference",
        title: reference,
        body: context,
        reference,
        updatedAt: sermon.updatedAt,
        href,
      }, `${sermon.topic} ${seriesName}`));
    });

    sermon.sections.forEach((section) => {
      if (section.illustration.trim()) {
        entries.push(createEntry({
          id: `illustration-${sermon.id}-${section.id}`,
          type: "illustration",
          title: section.title ? `Ilustración: ${section.title}` : `Ilustración: ${sermon.title}`,
          body: section.illustration,
          reference: section.bibleReference || sermon.mainBibleReference,
          updatedAt: sermon.updatedAt,
          href,
        }, `${sermon.title} ${sermon.topic} ${seriesName}`));
      }
      if (section.application.trim()) {
        entries.push(createEntry({
          id: `application-sermon-${sermon.id}-${section.id}`,
          type: "application",
          title: section.title ? `Aplicación: ${section.title}` : `Aplicación: ${sermon.title}`,
          body: section.application,
          reference: section.bibleReference || sermon.mainBibleReference,
          updatedAt: sermon.updatedAt,
          href,
        }, `${sermon.title} ${sermon.topic} ${seriesName}`));
      }
      if (section.privateNote.trim()) {
        entries.push(createEntry({
          id: `note-sermon-${sermon.id}-${section.id}`,
          type: "note",
          title: section.title ? `Nota privada: ${section.title}` : `Nota privada: ${sermon.title}`,
          body: section.privateNote,
          reference: section.bibleReference || sermon.mainBibleReference,
          updatedAt: sermon.updatedAt,
          href,
        }, `${sermon.title} ${sermon.topic} ${seriesName}`));
      }
    });
  });

  studies.forEach((study) => {
    const seriesName = study.seriesId ? seriesNames.get(study.seriesId) ?? "" : "";
    const studyTags = study.tagIds.map((tagId) => tagNames.get(tagId)).filter((name): name is string => Boolean(name));
    const href = `/studies/${study.id}/edit`;
    entries.push(createEntry({
      id: `study-${study.id}`,
      type: "study",
      title: study.title || "Estudio sin título",
      body: [study.objective, study.introduction, study.explanation, study.conclusion]
        .filter(Boolean).join(" · "),
      reference: study.mainBibleReference,
      updatedAt: study.updatedAt,
      href,
    }, `${seriesName} ${study.context} ${study.observation} ${study.interpretation} ${study.discussion} ${study.applications} ${study.personalReflection} ${study.weeklyAssignment} ${study.questions.map((item) => `${item.question} ${item.answer} ${item.application}`).join(" ")}`, studyTags));

    if (study.applications.trim()) {
      entries.push(createEntry({
        id: `application-study-${study.id}`,
        type: "application",
        title: `Aplicaciones: ${study.title}`,
        body: study.applications,
        reference: study.mainBibleReference,
        updatedAt: study.updatedAt,
        href,
      }, `${study.objective} ${seriesName}`));
    }
    [study.mainBibleReference].filter((reference) => reference.trim()).forEach((reference) => {
      entries.push(createEntry({
        id: `reference-study-${study.id}`,
        type: "reference",
        title: reference,
        body: study.title,
        reference,
        updatedAt: study.updatedAt,
        href,
      }, `${study.objective} ${seriesName}`));
    });
    study.questions.forEach((question) => {
      if (question.application.trim()) {
        entries.push(createEntry({
          id: `application-question-${study.id}-${question.id}`,
          type: "application",
          title: question.question ? `Aplicación: ${question.question}` : `Aplicación: ${study.title}`,
          body: question.application,
          reference: study.mainBibleReference,
          updatedAt: study.updatedAt,
          href,
        }, `${study.title} ${question.answer} ${seriesName}`));
      }
    });
    Object.entries({
      "Reflexión personal": study.personalReflection,
      "Tarea para la semana": study.weeklyAssignment,
    }).forEach(([label, text]) => {
      if (text.trim()) {
        entries.push(createEntry({
          id: `note-study-${study.id}-${label}`,
          type: "note",
          title: `${label}: ${study.title}`,
          body: text,
          reference: study.mainBibleReference,
          updatedAt: study.updatedAt,
          href,
        }, `${study.objective} ${seriesName}`));
      }
    });
  });

  series.forEach((item) => {
    const itemTitles = item.items.map((seriesItem) => {
      if (seriesItem.contentType === "sermon") {
        return sermons.find((sermon) => sermon.id === seriesItem.contentId)?.title ?? "";
      }
      return studies.find((study) => study.id === seriesItem.contentId)?.title ?? "";
    }).filter(Boolean);
    entries.push(createEntry({
      id: `series-${item.id}`,
      type: "series",
      title: item.name || "Serie sin título",
      body: item.description,
      reference: "",
      updatedAt: item.updatedAt,
      href: `/series/${item.id}/edit`,
    }, itemTitles.join(" ")));
  });

  return entries;
}
