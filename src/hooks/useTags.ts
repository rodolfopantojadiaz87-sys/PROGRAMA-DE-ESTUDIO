import { useCallback, useEffect, useState } from "react";
import { tagChangedEvent, tagStorage, tagStorageKey } from "../services/tagStorage";
import type { Tag } from "../types/domain";

interface TagState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
}

export function useTags() {
  const [state, setState] = useState<TagState>({ tags: [], isLoading: true, error: null });

  const refresh = useCallback(() => {
    try {
      setState({ tags: tagStorage.list(), isLoading: false, error: null });
    } catch (error) {
      console.error("No se pudieron cargar las etiquetas.", error);
      setState({ tags: [], isLoading: false, error: "No se pudieron cargar las etiquetas. Revisa el almacenamiento del navegador." });
    }
  }, []);

  useEffect(() => {
    refresh();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === tagStorageKey) refresh();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(tagChangedEvent, refresh);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(tagChangedEvent, refresh);
    };
  }, [refresh]);

  const createTag = useCallback((name: string): boolean => {
    const normalizedName = name.trim();
    if (!normalizedName || state.tags.some((tag) => tag.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
      return false;
    }
    const now = new Date().toISOString();
    const nextTags = [{
      id: crypto.randomUUID(),
      ownerId: "local-user",
      name: normalizedName,
      createdAt: now,
      updatedAt: now,
    }, ...state.tags];
    try {
      tagStorage.save(nextTags);
      setState({ tags: nextTags, isLoading: false, error: null });
      return true;
    } catch (error) {
      console.error("No se pudo guardar la etiqueta.", error);
      setState((current) => ({ ...current, error: "No se pudo guardar la etiqueta. Revisa el almacenamiento del navegador." }));
      return false;
    }
  }, [state.tags]);

  return { ...state, refresh, createTag };
}
