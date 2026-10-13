import {
  ArrowDownWideNarrow,
  BookText,
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
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useStudies } from "../hooks/useStudies";
import type { BibleStudy, ContentStatus } from "../types/domain";

type SortMode = "updated" | "title";

const statusLabels: Record<ContentStatus, string> = {
  draft: "Borrador",
  prepared: "Preparado",
  preached: "Enseñado",
  archived: "Archivado",
};

function duplicateStudy(source: BibleStudy): BibleStudy {
  const now = new Date().toISOString();
  return {
    ...source,
    id: crypto.randomUUID(),
    title: `${source.title} (copia)`,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    questions: source.questions.map((question) => ({ ...question, id: crypto.randomUUID() })),
  };
}

export function StudiesPage() {
  const { studies, isLoading, error, saveStudy, deleteStudy } = useStudies();
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ContentStatus | "">("");
  const [selectedBook, setSelectedBook] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updated");
  const [actionError, setActionError] = useState<string | null>(null);
  const books = useMemo(
    () => [...new Set(studies
      .map((study) => study.mainBibleReference.match(/^((?:[1-3]\s*)?[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)/)?.[1]?.trim() ?? "")
      .filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    [studies],
  );

  const filteredStudies = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return studies
      .filter((study) => {
        const searchableText = [
          study.title,
          study.mainBibleReference,
          study.objective,
          study.context,
          study.explanation,
          study.discussion,
          ...study.questions.flatMap((question) => [question.question, question.answer, question.application]),
        ].join(" ").toLocaleLowerCase();
        return (!normalizedQuery || searchableText.includes(normalizedQuery))
          && (!selectedStatus || study.status === selectedStatus)
          && (!selectedBook || study.mainBibleReference.match(/^((?:[1-3]\s*)?[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)/)?.[1]?.trim() === selectedBook);
      })
      .sort((a, b) => sortMode === "title"
        ? a.title.localeCompare(b.title, "es")
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [studies, query, selectedStatus, selectedBook, sortMode]);

  function handleDelete(study: BibleStudy) {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar "${study.title}"? Esta acción no se puede deshacer.`)) return;
    if (!deleteStudy(study.id)) setActionError("No se pudo eliminar el estudio. Inténtalo de nuevo.");
    else setActionError(null);
  }

  function handleDuplicate(study: BibleStudy) {
    if (saveStudy(duplicateStudy(study))) setActionError(null);
    else setActionError("No se pudo duplicar el estudio. Inténtalo de nuevo.");
  }

  function clearFilters() {
    setQuery("");
    setSelectedStatus("");
    setSelectedBook("");
  }

  const hasFilters = Boolean(query || selectedStatus || selectedBook);

  return (
    <main aria-labelledby="studies-title" className="sermons-page">
      <div className="sermons-heading">
        <div className="page-intro">
          <p className="eyebrow">BIBLIOTECA DE ENSEÑANZAS</p>
          <h2 id="studies-title">Estudios bíblicos</h2>
          <p>Prepara guías para observar, comprender y aplicar el texto bíblico.</p>
        </div>
        <Link className="button button-primary create-sermon-button" to="/studies/new">
          <Plus aria-hidden="true" size={17} /><span>Nuevo estudio</span>
        </Link>
      </div>

      {error && <p className="sermon-error" role="alert">{error}</p>}
      {actionError && <p className="sermon-error" role="alert">{actionError}</p>}

      <Card className="sermon-toolbar">
        <label className="sermon-search">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">Buscar estudios</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título, pasaje, pregunta o contenido..."
            type="search"
            value={query}
          />
        </label>
        <div className="sermon-filters">
          <label>
            <span className="sr-only">Filtrar por estado</span>
            <select onChange={(event) => setSelectedStatus(event.target.value as ContentStatus | "")} value={selectedStatus}>
              <option value="">Todos los estados</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrar por libro bíblico</span>
            <select onChange={(event) => setSelectedBook(event.target.value)} value={selectedBook}>
              <option value="">Todos los libros</option>
              {books.map((book) => <option key={book} value={book}>{book}</option>)}
            </select>
          </label>
          <label className="sort-select">
            <ArrowDownWideNarrow aria-hidden="true" size={15} />
            <span className="sr-only">Ordenar estudios</span>
            <select onChange={(event) => setSortMode(event.target.value as SortMode)} value={sortMode}>
              <option value="updated">Modificados recientemente</option>
              <option value="title">Título: A–Z</option>
            </select>
          </label>
        </div>
      </Card>

      <div className="sermon-list-heading">
        <p>{isLoading ? "Cargando estudios..." : `${filteredStudies.length} ${filteredStudies.length === 1 ? "estudio" : "estudios"}`}</p>
        {hasFilters && <button className="clear-filters" onClick={clearFilters} type="button">Limpiar filtros</button>}
      </div>

      {!isLoading && filteredStudies.length > 0 && (
        <div className="sermon-grid">
          {filteredStudies.map((study) => (
            <Card className="sermon-card" key={study.id}>
              <div className="sermon-card-top">
                <span className={`status-badge status-${study.status}`}>{statusLabels[study.status]}</span>
                <div className="sermon-menu">
                  <details>
                    <summary aria-label={`Acciones para ${study.title}`}><MoreHorizontal size={18} /></summary>
                    <div className="sermon-menu-options">
                      <Link to={`/studies/${study.id}/edit`}><Pencil size={15} />Editar</Link>
                      <button onClick={() => handleDuplicate(study)} type="button"><Copy size={15} />Duplicar</button>
                      <button className="danger-action" onClick={() => handleDelete(study)} type="button"><Trash2 size={15} />Eliminar</button>
                    </div>
                  </details>
                </div>
              </div>
              <h3>{study.title}</h3>
              {study.mainBibleReference && <p className="sermon-reference"><BookText aria-hidden="true" size={14} />{study.mainBibleReference}</p>}
              {study.objective && !(study.privateFields ?? []).includes("objective") && (
                <p className="sermon-idea">{study.objective}</p>
              )}
              <div className="sermon-card-footer">
                <span>{study.questions.length} {study.questions.length === 1 ? "pregunta" : "preguntas"}</span>
                <Link aria-label={`Proyectar ${study.title}`} className="project-sermon" to={`/presentation/${study.id}`}>
                  <Presentation aria-hidden="true" size={15} />Proyectar
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredStudies.length === 0 && (
        <Card className="sermon-empty">
          <span aria-hidden="true" className="sermon-empty-icon"><BookText size={22} /></span>
          <h3>{studies.length === 0 ? "Tu biblioteca de estudios está lista" : "No encontramos estudios"}</h3>
          <p>{studies.length === 0
            ? "Crea tu primer estudio bíblico para organizar preguntas, respuestas y aplicaciones."
            : "Prueba con otra búsqueda o ajusta los filtros."}</p>
          {studies.length === 0
            ? <Link className="button button-primary" to="/studies/new"><Plus size={16} />Crear primer estudio</Link>
            : <Button onClick={clearFilters} variant="secondary">Limpiar filtros</Button>}
        </Card>
      )}
    </main>
  );
}
