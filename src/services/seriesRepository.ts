import { sermonStorage, sermonStorageKey } from "./sermonStorage";
import { seriesChangedEvent, seriesStorage, seriesStorageKey } from "./seriesStorage";
import { studyStorage, studyStorageKey } from "./studyStorage";
import type { BibleStudy, Sermon, Series, SeriesItem } from "../types/domain";

interface MembershipUpdates {
  series: Series[];
  sermons: Sermon[];
  studies: BibleStudy[];
}

function createSeriesItems(seriesId: string, ownerId: string, items: SeriesItem[]): SeriesItem[] {
  const now = new Date().toISOString();
  return items.map((item, order) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    ownerId: item.ownerId || ownerId,
    seriesId,
    order,
    createdAt: item.createdAt || now,
    updatedAt: now,
  }));
}

function seriesIdsForSermon(series: Series[], sermonId: string): string[] {
  return series
    .filter((item) => item.items.some((entry) => entry.contentType === "sermon" && entry.contentId === sermonId))
    .map((item) => item.id);
}

function withSermonMemberships(sermons: Sermon[], series: Series[]): Sermon[] {
  return sermons.map((sermon) => {
    const seriesIds = seriesIdsForSermon(series, sermon.id);
    return {
      ...sermon,
      seriesIds,
      seriesId: seriesIds[0] ?? null,
    };
  });
}

function withStudyMemberships(studies: BibleStudy[], series: Series[]): BibleStudy[] {
  return studies.map((study) => ({
    ...study,
    seriesId: series.find((item) =>
      item.items.some((entry) => entry.contentType === "study" && entry.contentId === study.id),
    )?.id ?? null,
  }));
}

function addLegacyAssociations(series: Series[], sermons: Sermon[], studies: BibleStudy[]): Series[] {
  return series.map((item) => {
    const items = [...item.items];
    sermons.forEach((sermon) => {
      if (sermon.seriesId === item.id && !items.some((entry) =>
        entry.contentType === "sermon" && entry.contentId === sermon.id,
      )) {
        items.push({
          id: crypto.randomUUID(),
          ownerId: item.ownerId,
          seriesId: item.id,
          contentId: sermon.id,
          contentType: "sermon",
          order: items.length,
          createdAt: sermon.createdAt,
          updatedAt: sermon.updatedAt,
        });
      }
    });
    studies.forEach((study) => {
      if (study.seriesId === item.id && !items.some((entry) =>
        entry.contentType === "study" && entry.contentId === study.id,
      )) {
        items.push({
          id: crypto.randomUUID(),
          ownerId: item.ownerId,
          seriesId: item.id,
          contentId: study.id,
          contentType: "study",
          order: items.length,
          createdAt: study.createdAt,
          updatedAt: study.updatedAt,
        });
      }
    });
    return { ...item, items: items.sort((a, b) => a.order - b.order) };
  });
}

function persistMembership(updates: MembershipUpdates): void {
  const keys = [seriesStorageKey, sermonStorageKey, studyStorageKey];
  const previousValues = new Map(keys.map((key) => [key, localStorage.getItem(key)]));

  try {
    seriesStorage.save(updates.series);
    sermonStorage.save(updates.sermons);
    studyStorage.save(updates.studies);
  } catch (error) {
    try {
      previousValues.forEach((value, key) => {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      });
    } catch (rollbackError) {
      console.error("No se pudo revertir por completo una actualización de serie.", rollbackError);
      throw new Error("Falló el guardado y no se pudo restaurar por completo el almacenamiento.", { cause: error });
    }
    throw error;
  }

  window.dispatchEvent(new Event(seriesChangedEvent));
}

export const seriesRepository = {
  list(): Series[] {
    const series = seriesStorage.list();
    const hydrated = addLegacyAssociations(series, sermonStorage.list(), studyStorage.list());
    return hydrated.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  save(series: Series): Series[] {
    const sermonRecords = sermonStorage.list();
    const studyRecords = studyStorage.list();
    const allSeries = addLegacyAssociations(seriesStorage.list(), sermonRecords, studyRecords);
    const existing = allSeries.find((item) => item.id === series.id);
    if (existing && existing.ownerId !== series.ownerId) {
      throw new Error("No se puede cambiar el propietario de una serie existente.");
    }
    const items = createSeriesItems(series.id, series.ownerId, series.items);
    const seenItems = new Set<string>();

    items.forEach((item) => {
      const key = `${item.contentType}:${item.contentId}`;
      if (seenItems.has(key)) throw new Error("No se puede añadir dos veces el mismo material a una serie.");
      seenItems.add(key);
      const content = item.contentType === "sermon"
        ? sermonRecords.find((sermon) => sermon.id === item.contentId)
        : studyRecords.find((study) => study.id === item.contentId);
      if (!content || content.ownerId !== series.ownerId || item.ownerId !== series.ownerId) {
        throw new Error("Uno de los materiales seleccionados no pertenece a esta biblioteca.");
      }
    });

    const nextSeries = {
      ...series,
      items,
      updatedAt: new Date().toISOString(),
    };
    const nextSeriesList = [nextSeries, ...allSeries.filter((item) => item.id !== series.id)];

    persistMembership({
      series: nextSeriesList,
      sermons: withSermonMemberships(sermonRecords, nextSeriesList),
      studies: withStudyMemberships(studyRecords, nextSeriesList),
    });
    return nextSeriesList.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  saveSermons(sermons: Sermon[]): Sermon[] {
    const allSeries = addLegacyAssociations(seriesStorage.list(), sermons, studyStorage.list());
    sermons.forEach((sermon) => {
      const selectedIds = sermon.seriesIds ?? (sermon.seriesId ? [sermon.seriesId] : []);
      if (selectedIds.some((seriesId) => !allSeries.some((item) =>
        item.id === seriesId && item.ownerId === sermon.ownerId,
      ))) {
        throw new Error("Uno de los sermones seleccionados no pertenece a esta biblioteca.");
      }
    });
    const nextSeries = allSeries.map((item) => {
      const requestedIds = new Set(sermons.flatMap((sermon) =>
        (sermon.seriesIds ?? (sermon.seriesId ? [sermon.seriesId] : []))
          .filter((seriesId) => seriesId === item.id && sermon.ownerId === item.ownerId)
          .map((seriesId) => `${sermon.id}:${seriesId}`),
      ));
      const retained = item.items.filter((entry) =>
        entry.contentType !== "sermon" || requestedIds.has(`${entry.contentId}:${item.id}`),
      );
      const retainedIds = new Set(retained
        .filter((entry) => entry.contentType === "sermon")
        .map((entry) => entry.contentId));
      const additions = sermons
        .filter((sermon) =>
          sermon.ownerId === item.ownerId &&
          (sermon.seriesIds ?? (sermon.seriesId ? [sermon.seriesId] : [])).includes(item.id) &&
          !retainedIds.has(sermon.id),
        )
        .map((sermon, index) => ({
          id: crypto.randomUUID(),
          ownerId: item.ownerId,
          seriesId: item.id,
          contentId: sermon.id,
          contentType: "sermon" as const,
          order: retained.length + index,
          createdAt: sermon.createdAt,
          updatedAt: sermon.updatedAt,
        }));
      if (additions.length === 0 && retained.length === item.items.length) return item;
      return {
        ...item,
        items: [...retained, ...additions].map((entry, order) => ({ ...entry, order })),
        updatedAt: new Date().toISOString(),
      };
    });

    const normalizedSermons = withSermonMemberships(sermons, nextSeries);
    persistMembership({
      series: nextSeries,
      sermons: normalizedSermons,
      studies: withStudyMemberships(studyStorage.list(), nextSeries),
    });
    return normalizedSermons;
  },

  delete(id: string): Series[] {
    const allSeries = addLegacyAssociations(seriesStorage.list(), sermonStorage.list(), studyStorage.list());
    const nextSeries = allSeries.filter((series) => series.id !== id);
    persistMembership({
      series: nextSeries,
      sermons: withSermonMemberships(sermonStorage.list(), nextSeries),
      studies: withStudyMemberships(studyStorage.list(), nextSeries),
    });
    return nextSeries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  removeContent(contentId: string, contentType: SeriesItem["contentType"]): void {
    const nextSeries = seriesStorage.list().map((series) => ({
      ...series,
      items: series.items
        .filter((item) => !(item.contentId === contentId && item.contentType === contentType))
        .map((item, order) => ({ ...item, order })),
    }));
    const sermons = sermonStorage.list();
    const studies = studyStorage.list();
    const remainingSermons = contentType === "sermon"
      ? sermons.filter((sermon) => sermon.id !== contentId)
      : sermons;
    const remainingStudies = contentType === "study"
      ? studies.filter((study) => study.id !== contentId)
      : studies;
    persistMembership({
      series: nextSeries,
      sermons: withSermonMemberships(remainingSermons, nextSeries),
      studies: withStudyMemberships(remainingStudies, nextSeries),
    });
  },
};
