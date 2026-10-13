import {
  ArrowDownWideNarrow,
  BookOpen,
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  Presentation,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useSermons } from "../hooks/useSermons";
import { useSeries } from "../hooks/useSeries";
import type { ContentStatus, Sermon } from "../types/domain";

type SortMode = "updated" | "date-desc" | "date-asc" | "title";

const statusLabels: Record<ContentStatus, string> = {
  draft: "Borrador",
  prepared: "En preparación",
  preached: "Predicado",
  archived: "Archivado",
};

const referenceBookPattern = /^((?:[1-3]\s*)?[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)/;

function getBook(reference: string): string {
  return reference.match(referenceBookPattern)?.[1]?.trim() ?? "";
}

function getSearchableText(sermon: Sermon): string {
  return [
    sermon.title,
    sermon.mainBibleReference,
    sermon.topic,
    sermon.author,
    sermon.centralIdea,
    sermon.preachingObjective,
    sermon.introduction,
    sermon.historicalContext,
    sermon.literaryContext,
    sermon.biblicalContext,
    sermon.passageStructure,
    sermon.development,
    sermon.conclusion,
    sermon.finalChallenge,
    ...sermon.sections.flatMap((section) => [
      section.title,
      section.bibleReference,
      section.explanation,
      section.observation,
      section.illustration,
      section.application,
      ...section.additionalReferences,
    ]),
  ].join(" ").toLocaleLowerCase();
}

function duplicateSermon(source: Sermon): Sermon {
  const now = new Date().toISOString();
  return {
    ...source,
    id: crypto.randomUUID(),
    title: `${source.title} (copia)`,
    status: "draft",
    seriesId: null,
    seriesIds: [],
    createdAt: now,
    updatedAt: now,
    sections: source.sections.map((section) => ({ ...section, id: crypto.randomUUID() })),
  };
}

export function SermonsPage() {
  const { sermons, isLoading, error, saveSermon, deleteSermon } = useSermons();
  const { series } = useSeries();
  const [query, setQuery] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updated");
  const [actionError, setActionError] = useState<string | null>(null);

  const books = useMemo(
    () => [...new Set(sermons.map((sermon) => getBook(sermon.mainBibleReference)).filter(Boolean))].sort(),
    [sermons],
  );
  const topics = useMemo(
    () => [...new Set(sermons.map((sermon) => sermon.topic.trim()).filter(Boolean))].sort(),
    [sermons],
  );
  const filteredSermons = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return sermons
      .filter((sermon) => {
        const searchableText = getSearchableText(sermon);
        const belongsToSelectedSeries = !selectedSeries || series.some((item) =>
          item.id === selectedSeries &&
          item.items.some((seriesItem) => seriesItem.contentType === "sermon" && seriesItem.contentId === sermon.id),
        );
        return (
          (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
          belongsToSelectedSeries &&
          (!selectedBook || getBook(sermon.mainBibleReference) === selectedBook) &&
          (!selectedTopic || sermon.topic === selectedTopic)
        );
      })
      .sort((a, b) => {
        if (sortMode === "title") return a.title.localeCompare(b.title, "es");
        if (sortMode === "date-asc" || sortMode === "date-desc") {
          const direction = sortMode === "date-asc" ? 1 : -1;
          return direction * (new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime());
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [sermons, series, query, selectedSeries, selectedBook, selectedTopic, sortMode]);

  function handleDelete(sermon: Sermon) {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar "${sermon.title}"? Esta acción no se puede deshacer.`)) return;
    if (!deleteSermon(sermon.id)) setActionError("No se pudo eliminar el sermón. Inténtalo de nuevo.");
  }

  function handleDuplicate(sermon: Sermon) {
    const duplicate = duplicateSermon(sermon);
    if (saveSermon(duplicate)) setActionError(null);
    else setActionError("No se pudo duplicar el sermón. Inténtalo de nuevo.");
  }

  function clearFilters() {
    setQuery("");
    setSelectedSeries("");
    setSelectedBook("");
    setSelectedTopic("");
  }

  const hasFilters = Boolean(query || selectedSeries || selectedBook || selectedTopic);

  return (
    <main aria-labelledby="sermons-title" className="sermons-page">
      <div className="sermons-heading">
        <div className="page-intro">
          <p className="eyebrow">BIBLIOTECA DE ENSEÑANZAS</p>
          <h2 id="sermons-title">Sermones</h2>
          <p>Prepara, organiza y vuelve a consultar tus predicaciones.</p>
        </div>
        <Link className="button button-primary create-sermon-button" to="/sermons/new">
          <Plus aria-hidden="true" size={17} />
          <span>Nuevo sermón</span>
        </Link>
      </div>

      {error && <p className="sermon-error" role="alert">{error}</p>}
      {actionError && <p className="sermon-error" role="alert">{actionError}</p>}

      <Card className="sermon-toolbar">
        <label className="sermon-search">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">Buscar sermones</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título, pasaje, tema o contenido..."
            type="search"
            value={query}
          />
        </label>
        <div className="sermon-filters">
          <label>
            <span className="sr-only">Filtrar por serie</span>
            <select onChange={(event) => setSelectedSeries(event.target.value)} value={selectedSeries}>
              <option value="">Todas las series</option>
              {series.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrar por libro bíblico</span>
            <select onChange={(event) => setSelectedBook(event.target.value)} value={selectedBook}>
              <option value="">Todos los libros</option>
              {books.map((book) => <option key={book} value={book}>{book}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrar por tema</span>
            <select onChange={(event) => setSelectedTopic(event.target.value)} value={selectedTopic}>
              <option value="">Todos los temas</option>
              {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
            </select>
          </label>
          <label className="sort-select">
            <ArrowDownWideNarrow aria-hidden="true" size={15} />
            <span className="sr-only">Ordenar sermones</span>
            <select onChange={(event) => setSortMode(event.target.value as SortMode)} value={sortMode}>
              <option value="updated">Modificados recientemente</option>
              <option value="date-desc">Fecha: más recientes</option>
              <option value="date-asc">Fecha: más antiguos</option>
              <option value="title">Título: A–Z</option>
            </select>
          </label>
        </div>
      </Card>

      <div className="sermon-list-heading">
        <p>{isLoading ? "Cargando sermones..." : `${filteredSermons.length} ${filteredSermons.length === 1 ? "sermón" : "sermones"}`}</p>
        {hasFilters && <button className="clear-filters" onClick={clearFilters} type="button">Limpiar filtros</button>}
      </div>

      {!isLoading && filteredSermons.length > 0 && (
        <div className="sermon-grid">
          {filteredSermons.map((sermon) => (
            <Card className="sermon-card" key={sermon.id}>
              <div className="sermon-card-top">
                <span className={`status-badge status-${sermon.status}`}>{statusLabels[sermon.status]}</span>
                <div className="sermon-menu">
                  <details>
                    <summary aria-label={`Acciones para ${sermon.title}`}><MoreHorizontal size={18} /></summary>
                    <div className="sermon-menu-options">
                      <Link to={`/sermons/${sermon.id}/edit`}><Pencil size={15} />Editar</Link>
                      <button onClick={() => handleDuplicate(sermon)} type="button"><Copy size={15} />Duplicar</button>
                      <button className="danger-action" onClick={() => handleDelete(sermon)} type="button"><Trash2 size={15} />Eliminar</button>
                    </div>
                  </details>
                </div>
              </div>
              <h3>{sermon.title}</h3>
              {sermon.mainBibleReference && (
                <p className="sermon-reference"><BookOpen aria-hidden="true" size={14} />{sermon.mainBibleReference}</p>
              )}
              {sermon.topic && <span className="sermon-topic">{sermon.topic}</span>}
              {sermon.centralIdea && !(sermon.privateFields ?? []).includes("centralIdea") && (
                <p className="sermon-idea">{sermon.centralIdea}</p>
              )}
              <div className="sermon-card-footer">
                <span>{sermon.date ? new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(`${sermon.date}T00:00:00`)) : "Sin fecha"}</span>
                <Link aria-label={`Proyectar ${sermon.title}`} className="project-sermon" to={`/presentation/${sermon.id}`}>
                  <Presentation aria-hidden="true" size={15} />Proyectar
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredSermons.length === 0 && (
        <Card className="sermon-empty">
          <span aria-hidden="true" className="sermon-empty-icon"><BookOpen size={22} /></span>
          <h3>{sermons.length === 0 ? "Tu biblioteca de sermones está lista" : "No encontramos sermones"}</h3>
          <p>
            {sermons.length === 0
              ? "Crea tu primer sermón para comenzar a organizar tus enseñanzas."
              : "Prueba con otro término de búsqueda o ajusta los filtros."}
          </p>
          {sermons.length === 0 ? (
            <Link className="button button-primary" to="/sermons/new"><Plus size={16} />Crear primer sermón</Link>
          ) : (
            <Button onClick={clearFilters} variant="secondary">Limpiar filtros</Button>
          )}
        </Card>
      )}
    </main>
  );
}
