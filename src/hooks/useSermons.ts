import { useCallback, useEffect, useState } from "react";
import { sermonStorage, sermonStorageKey } from "../services/sermonStorage";
import { seriesRepository } from "../services/seriesRepository";
import { seriesChangedEvent } from "../services/seriesStorage";
import type { Sermon } from "../types/domain";

interface SermonState {
  sermons: Sermon[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SermonState = {
  sermons: [],
  isLoading: true,
  error: null,
};

export function useSermons() {
  const [state, setState] = useState<SermonState>(initialState);

  const refresh = useCallback(() => {
    try {
      setState({ sermons: sermonStorage.list(), isLoading: false, error: null });
    } catch (error) {
      console.error("No se pudieron cargar los sermones.", error);
      setState({
        sermons: [],
        isLoading: false,
        error: "No se pudieron cargar los sermones. Revisa el almacenamiento del navegador.",
      });
    }
  }, []);

  useEffect(() => {
    refresh();
    const sync = (event: StorageEvent) => {
      if (event.key === sermonStorageKey) refresh();
    };
    window.addEventListener("storage", sync);
    window.addEventListener(seriesChangedEvent, refresh);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(seriesChangedEvent, refresh);
    };
  }, [refresh]);

  const persist = useCallback((nextSermons: Sermon[]): boolean => {
    try {
      const savedSermons = seriesRepository.saveSermons(nextSermons);
      setState({ sermons: savedSermons, isLoading: false, error: null });
      return true;
    } catch (error) {
      console.error("No se pudieron guardar los sermones.", error);
      setState((current) => ({
        ...current,
        error: "No se pudieron guardar los cambios. Comprueba que las series seleccionadas estén disponibles e inténtalo de nuevo.",
      }));
      return false;
    }
  }, []);

  const saveSermon = useCallback((sermon: Sermon): boolean => {
    const exists = state.sermons.some((item) => item.id === sermon.id);
    const nextSermons = exists
      ? state.sermons.map((item) => item.id === sermon.id ? sermon : item)
      : [sermon, ...state.sermons];
    return persist(nextSermons);
  }, [persist, state.sermons]);

  const deleteSermon = useCallback((id: string): boolean => {
    try {
      seriesRepository.removeContent(id, "sermon");
      setState({ sermons: sermonStorage.list(), isLoading: false, error: null });
      return true;
    } catch (error) {
      console.error("No se pudo eliminar el sermón.", error);
      setState((current) => ({ ...current, error: "No se pudo eliminar el sermón ni actualizar sus series asociadas." }));
      return false;
    }
  }, []);

  return { ...state, refresh, saveSermon, deleteSermon };
}
