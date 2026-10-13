import {
  BookMarked,
  BookOpen,
  BookText,
  FileText,
  FolderKanban,
  Lightbulb,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useSeries } from "../hooks/useSeries";
import { useSermons } from "../hooks/useSermons";
import { useStudies } from "../hooks/useStudies";
import { useTags } from "../hooks/useTags";
import { buildLibraryIndex, type LibraryEntryType } from "../services/libraryIndex";

type LibraryFilter = "all" | LibraryEntryType;
type SortMode = "recent" | "title";

const filterLabels: Record<LibraryFilter, string> = {
  all: "Todo el contenido",
  sermon: "Sermones",
  study: "Estudios",
  series: "Series",
  reference: "Referencias",
  illustration: "Ilustraciones",
  application: "Aplicaciones",
  note: "Notas",
};

const entryIcons: Record<LibraryEntryType, typeof BookOpen> = {
  sermon: BookOpen,
  study: BookText,
  series: FolderKanban,
  reference: BookMarked,
  illustration: Lightbulb,
  application: FileText,
  note: FileText,
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date);
}

export function LibraryPage() {
  const sermonsState = useSermons();
  const studiesState = useStudies();
  const seriesState = useSeries();
  const tagsState = useTags();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [tagName, setTagName] = useState("");
  const [tagFormError, setTagFormError] = useState<string | null>(null);

  const entries = useMemo(
    () => buildLibraryIndex({
      sermons: sermonsState.sermons,
      studies: studiesState.studies,
      series: seriesState.series,
      tags: tagsState.tags,
    }),
    [sermonsState.sermons, studiesState.studies, seriesState.series, tagsState.tags],
  );

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return entries
      .filter((entry) => (filter === "all" || entry.type === filter)
        && (!normalizedQuery || entry.searchableText.includes(normalizedQuery)))
      .sort((a, b) => sortMode === "title"
        ? a.title.localeCompare(b.title, "es")
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [entries, filter, query, sortMode]);

  const isLoading = sermonsState.isLoading || studiesState.isLoading || seriesState.isLoading || tagsState.isLoading;
  const errors = [sermonsState.error, studiesState.error, seriesState.error, tagsState.error].filter(Boolean);
  const hasFilters = Boolean(query || filter !== "all");

  function handleCreateTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = tagName.trim();
    if (!normalizedName) {
      setTagFormError("Escribe un nombre para la etiqueta.");
      return;
    }
    if (tagsState.tags.some((tag) => tag.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
      setTagFormError("Ya existe una etiqueta con ese nombre.");
      return;
    }
    if (tagsState.createTag(normalizedName)) {
      setTagName("");
      setTagFormError(null);
    }
  }

  return (
    <main aria-labelledby="library-title" className="sermons-page library-page">
      <div className="sermons-heading">
        <div className="page-intro">
          <p className="eyebrow">REPOSITORIO PERSONAL</p>
          <h2 id="library-title">Biblioteca</h2>
          <p>Busca sermones, estudios, series, pasajes y recursos de enseñanza desde un solo lugar.</p>
        </div>
        <span className="library-total" aria-live="polite">{isLoading ? "Cargando..." : `${entries.length} elementos`}</span>
      </div>

      {errors.map((error) => <p className="sermon-error" key={error} role="alert">{error}</p>)}

      <Card className="sermon-toolbar">
        <label className="sermon-search">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">Buscar en toda la biblioteca</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título, pasaje, tema o contenido..."
            type="search"
            value={query}
          />
        </label>
        <div className="sermon-filters library-filters">
          <label>
            <span className="sr-only">Filtrar por tipo de contenido</span>
            <select onChange={(event) => setFilter(event.target.value as LibraryFilter)} value={filter}>
              {(Object.keys(filterLabels) as LibraryFilter[]).map((type) => (
                <option key={type} value={type}>{filterLabels[type]}</option>
              ))}
            </select>
          </label>
          <label className="sort-select">
            <span className="sr-only">Ordenar biblioteca</span>
            <select onChange={(event) => setSortMode(event.target.value as SortMode)} value={sortMode}>
              <option value="recent">Más recientes</option>
              <option value="title">Título A–Z</option>
            </select>
          </label>
          {hasFilters && (
            <button className="clear-filters" onClick={() => { setQuery(""); setFilter("all"); }} type="button">
              Limpiar búsqueda
            </button>
          )}
        </div>
      </Card>

      <Card className="library-tags-panel">
        <div className="library-tags-heading">
          <div>
            <h3>Etiquetas</h3>
            <p>Crea etiquetas para clasificar y encontrar sermones y estudios.</p>
          </div>
        </div>
        <form className="library-tag-form" onSubmit={handleCreateTag}>
          <label className="form-field">
            <span>Nombre de la etiqueta</span>
            <input
              maxLength={50}
              onChange={(event) => { setTagName(event.target.value); setTagFormError(null); }}
              placeholder="Ej.: Esperanza"
              value={tagName}
            />
          </label>
          <Button disabled={tagsState.isLoading || Boolean(tagsState.error)} icon={<Plus size={15} />} type="submit" variant="secondary">Crear etiqueta</Button>
        </form>
        {tagFormError && <p className="sermon-error" role="alert">{tagFormError}</p>}
        {tagsState.isLoading ? (
          <p className="library-tag-empty" role="status">Cargando etiquetas...</p>
        ) : tagsState.tags.length > 0 ? (
          <ul aria-label="Etiquetas disponibles" className="library-tag-list">
            {tagsState.tags.map((tag) => <li key={tag.id}>{tag.name}</li>)}
          </ul>
        ) : (
          <p className="library-tag-empty">Aún no has creado etiquetas.</p>
        )}
      </Card>

      <div className="sermon-list-heading">
        <p>{isLoading ? "Cargando biblioteca..." : `${filteredEntries.length} resultados`}</p>
      </div>

      {filteredEntries.length > 0 && (
        <div className="library-results">
          {filteredEntries.map((entry) => {
            const Icon = entryIcons[entry.type];
            return (
              <Card className="library-result-card" key={entry.id}>
                <div className="library-result-heading">
                  <span className={`library-type library-type-${entry.type}`}>
                    <Icon aria-hidden="true" size={14} />
                    {filterLabels[entry.type]}
                  </span>
                  <time dateTime={entry.updatedAt}>{formatDate(entry.updatedAt)}</time>
                </div>
                <h3>{entry.title}</h3>
                {entry.reference && <p className="library-reference">{entry.reference}</p>}
                {entry.body && <p className="library-excerpt">{entry.body}</p>}
                {entry.tags.length > 0 && (
                  <ul aria-label="Etiquetas del material" className="library-result-tags">
                    {entry.tags.map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                )}
                <Link className="library-open-link" to={entry.href}>Abrir material</Link>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && filteredEntries.length === 0 && errors.length === 0 && (
        <Card className="sermon-empty">
          <span aria-hidden="true" className="sermon-empty-icon"><Search size={22} /></span>
          <h3>{entries.length === 0 ? "Tu biblioteca está lista para comenzar" : "No se encontraron resultados"}</h3>
          <p>{entries.length === 0
            ? "Cuando guardes sermones, estudios o series aparecerán aquí junto con sus pasajes y recursos."
            : "Prueba con otros términos o limpia los filtros para ver más contenido."}</p>
          {hasFilters && (
            <button className="clear-filters" onClick={() => { setQuery(""); setFilter("all"); }} type="button">
              Limpiar búsqueda
            </button>
          )}
        </Card>
      )}
    </main>
  );
}
