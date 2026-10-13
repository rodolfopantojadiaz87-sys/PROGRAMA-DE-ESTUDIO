import { useCallback, useEffect, useState } from "react";
import { seriesRepository } from "../services/seriesRepository";
import { seriesChangedEvent, seriesStorageKey } from "../services/seriesStorage";
import type { Series } from "../types/domain";

interface SeriesState {
  series: Series[];
  isLoading: boolean;
  error: string | null;
}

export function useSeries() {
  const [state, setState] = useState<SeriesState>({ series: [], isLoading: true, error: null });

  const refresh = useCallback(() => {
    try {
      setState({ series: seriesRepository.list(), isLoading: false, error: null });
    } catch (error) {
      console.error("No se pudieron cargar las series.", error);
      setState({
        series: [],
        isLoading: false,
        error: "No se pudieron cargar las series. Revisa el almacenamiento del navegador.",
      });
    }
  }, []);

  useEffect(() => {
    refresh();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === seriesStorageKey) refresh();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(seriesChangedEvent, refresh);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(seriesChangedEvent, refresh);
    };
  }, [refresh]);

  const saveSeries = useCallback((item: Series): boolean => {
    try {
      setState({ series: seriesRepository.save(item), isLoading: false, error: null });
      return true;
    } catch (error) {
      console.error("No se pudo guardar la serie.", error);
      setState((current) => ({ ...current, error: "No se pudo guardar la serie. Revisa el almacenamiento e inténtalo de nuevo." }));
      return false;
    }
  }, []);

  const deleteSeries = useCallback((id: string): boolean => {
    try {
      setState({ series: seriesRepository.delete(id), isLoading: false, error: null });
      return true;
    } catch (error) {
      console.error("No se pudo eliminar la serie.", error);
      setState((current) => ({ ...current, error: "No se pudo eliminar la serie. Revisa el almacenamiento e inténtalo de nuevo." }));
      return false;
    }
  }, []);

  return { ...state, refresh, saveSeries, deleteSeries };
}
