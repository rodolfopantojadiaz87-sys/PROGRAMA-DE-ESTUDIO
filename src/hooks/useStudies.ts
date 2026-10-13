import { useCallback, useEffect, useState } from "react";
import { studyStorage, studyStorageKey } from "../services/studyStorage";
import { seriesRepository } from "../services/seriesRepository";
import { seriesChangedEvent } from "../services/seriesStorage";
import type { BibleStudy } from "../types/domain";

interface StudyState {
  studies: BibleStudy[];
  isLoading: boolean;
  error: string | null;
}

export function useStudies() {
  const [state, setState] = useState<StudyState>({ studies: [], isLoading: true, error: null });

  const refresh = useCallback(() => {
    try {
      setState({ studies: studyStorage.list(), isLoading: false, error: null });
    } catch (error) {
      console.error("No se pudieron cargar los estudios.", error);
      setState({
        studies: [],
        isLoading: false,
        error: "No se pudieron cargar los estudios. Revisa el almacenamiento del navegador.",
      });
    }
  }, []);

  useEffect(() => {
    refresh();
    const sync = (event: StorageEvent) => {
      if (event.key === studyStorageKey) refresh();
    };
    window.addEventListener("storage", sync);
    window.addEventListener(seriesChangedEvent, refresh);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(seriesChangedEvent, refresh);
    };
  }, [refresh]);

  const persist = useCallback((nextStudies: BibleStudy[]): boolean => {
    try {
      studyStorage.save(nextStudies);
      setState({ studies: nextStudies, isLoading: false, error: null });
      return true;
    } catch (error) {
      console.error("No se pudieron guardar los estudios.", error);
      setState((current) => ({
        ...current,
        error: "No se pudieron guardar los cambios. Revisa el espacio disponible del navegador.",
      }));
      return false;
    }
  }, []);

  const saveStudy = useCallback((study: BibleStudy): boolean => {
    const exists = state.studies.some((item) => item.id === study.id);
    const nextStudies = exists
      ? state.studies.map((item) => item.id === study.id ? study : item)
      : [study, ...state.studies];
    return persist(nextStudies);
  }, [persist, state.studies]);

  const deleteStudy = useCallback((id: string): boolean => {
    try {
      seriesRepository.removeContent(id, "study");
      setState({ studies: studyStorage.list(), isLoading: false, error: null });
      return true;
    } catch (error) {
      console.error("No se pudo eliminar el estudio.", error);
      setState((current) => ({ ...current, error: "No se pudo eliminar el estudio ni actualizar sus series asociadas." }));
      return false;
    }
  }, []);

  return { ...state, refresh, saveStudy, deleteStudy };
}
