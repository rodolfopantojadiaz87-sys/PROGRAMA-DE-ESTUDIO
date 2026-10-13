import { sermonStorage, sermonStorageKey } from "./sermonStorage";
import { seriesChangedEvent, seriesStorage, seriesStorageKey } from "./seriesStorage";
import { studyStorage, studyStorageKey } from "./studyStorage";
import type { BibleStudy, Sermon, Series, SeriesItem } from "../types/domain";

interface MembershipUpdates {
  series: Series[];
  sermons: Sermon[];
  studies: BibleStudy[];
}

function createSeriesItems(seriesId: string, items: SeriesItem[]): SeriesItem[] {
  const now = new Date().toISOString();
  return items.map((item, order) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    ownerId: item.ownerId || "local-user",
    seriesId,
    order,
    createdAt: item.createdAt || now,
    updatedAt: now,
  }));
}

function updateContentMembership(
  sermons: Sermon[],
  studies: BibleStudy[],
  seriesId: string,
  removedItems: SeriesItem[],
  addedItems: SeriesItem[],
): { sermons: Sermon[]; studies: BibleStudy[] } {
  const removedSermons = new Set(removedItems.filter((item) => item.contentType === "sermon").map((item) => item.contentId));
  const removedStudies = new Set(removedItems.filter((item) => item.contentType === "study").map((item) => item.contentId));
  const sermonIds = new Set(addedItems.filter((item) => item.contentType === "sermon").map((item) => item.contentId));
  const studyIds = new Set(addedItems.filter((item) => item.contentType === "study").map((item) => item.contentId));

  return {
    sermons: sermons.map((sermon) => {
      if (sermonIds.has(sermon.id)) return { ...sermon, seriesId, updatedAt: new Date().toISOString() };
      if (removedSermons.has(sermon.id) && sermon.seriesId === seriesId) return { ...sermon, seriesId: null, updatedAt: new Date().toISOString() };
      return sermon;
    }),
    studies: studies.map((study) => {
      if (studyIds.has(study.id)) return { ...study, seriesId, updatedAt: new Date().toISOString() };
      if (removedStudies.has(study.id) && study.seriesId === seriesId) return { ...study, seriesId: null, updatedAt: new Date().toISOString() };
      return study;
    }),
  };
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
    return seriesStorage.list().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  save(series: Series): Series[] {
    const allSeries = seriesStorage.list();
    const existing = allSeries.find((item) => item.id === series.id);
    const sermonRecords = sermonStorage.list();
    const studyRecords = studyStorage.list();
    const items = createSeriesItems(series.id, series.items);
    const seenItems = new Set<string>();

    items.forEach((item) => {
      const key = `${item.contentType}:${item.contentId}`;
      if (seenItems.has(key)) throw new Error("No se puede añadir dos veces el mismo material a una serie.");
      seenItems.add(key);
      const exists = item.contentType === "sermon"
        ? sermonRecords.some((sermon) => sermon.id === item.contentId)
        : studyRecords.some((study) => study.id === item.contentId);
      if (!exists) throw new Error("Uno de los materiales seleccionados ya no está disponible.");
    });

    const selectedKeys = new Set(items.map((item) => `${item.contentType}:${item.contentId}`));
    const removedItems = existing?.items.filter((item) => !selectedKeys.has(`${item.contentType}:${item.contentId}`)) ?? [];
    const nextSeries = {
      ...series,
      items,
      updatedAt: new Date().toISOString(),
    };
    const otherSeries = allSeries
      .filter((item) => item.id !== series.id)
      .map((item) => {
        const remainingItems = item.items.filter((seriesItem) => !selectedKeys.has(`${seriesItem.contentType}:${seriesItem.contentId}`));
        return {
          ...item,
          items: remainingItems,
          updatedAt: remainingItems.length === item.items.length ? item.updatedAt : new Date().toISOString(),
        };
      });
    const nextSeriesList = [nextSeries, ...otherSeries];
    const membership = updateContentMembership(sermonRecords, studyRecords, series.id, removedItems, items);

    persistMembership({
      series: nextSeriesList,
      sermons: membership.sermons,
      studies: membership.studies,
    });
    return nextSeriesList.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  delete(id: string): Series[] {
    const allSeries = seriesStorage.list();
    const removed = allSeries.find((series) => series.id === id);
    if (!removed) return allSeries;

    const membership = updateContentMembership(
      sermonStorage.list(),
      studyStorage.list(),
      id,
      removed.items,
      [],
    );
    const nextSeries = allSeries.filter((series) => series.id !== id);
    persistMembership({ series: nextSeries, ...membership });
    return nextSeries;
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
    persistMembership({
      series: nextSeries,
      sermons: contentType === "sermon" ? sermons.filter((sermon) => sermon.id !== contentId) : sermons,
      studies: contentType === "study" ? studies.filter((study) => study.id !== contentId) : studies,
    });
  },
};
