import { CalendarDays, FolderKanban, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { useSeries } from "../hooks/useSeries";
import { useSermons } from "../hooks/useSermons";
import { useStudies } from "../hooks/useStudies";
import type { ContentStatus, Series } from "../types/domain";

function getStatusLabel(series: Series): string {
  if (series.status === "preparation") return "En preparación";
  return series.status === "finished" ? "Finalizada" : "Activa";
}

function getSeriesProgress(statuses: ContentStatus[]) {
  return {
    total: statuses.length,
    pending: statuses.filter((status) => status === "draft").length,
    preparing: statuses.filter((status) => status === "prepared").length,
    preached: statuses.filter((status) => status === "preached").length,
    archived: statuses.filter((status) => status === "archived").length,
  };
}

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00`));
}

export function SeriesPage() {
  const { series, isLoading, error, deleteSeries } = useSeries();
  const { sermons } = useSermons();
  const { studies } = useStudies();
  const [actionError, setActionError] = useState<string | null>(null);

  function handleDelete(item: Series) {
    if (!window.confirm(`¿Eliminar la serie "${item.name}"? Sus sermones y estudios no se borrarán, solo se quitarán de esta serie.`)) return;
    if (deleteSeries(item.id)) setActionError(null);
    else setActionError("No se pudo eliminar la serie. Inténtalo de nuevo.");
  }

  const activeCount = series.filter((item) => item.status === "active").length;

  return (
    <main aria-labelledby="series-title" className="sermons-page">
      <div className="sermons-heading">
        <div className="page-intro">
          <p className="eyebrow">ORGANIZA TUS ENSEÑANZAS</p>
          <h2 id="series-title">Series</h2>
          <p>Agrupa sermones y estudios en secuencias ordenadas.</p>
        </div>
        <Link className="button button-primary create-sermon-button" to="/series/new">
          <Plus aria-hidden="true" size={17} /><span>Nueva serie</span>
        </Link>
      </div>

      {error && <p className="sermon-error" role="alert">{error}</p>}
      {actionError && <p className="sermon-error" role="alert">{actionError}</p>}

      {!isLoading && series.length > 0 && (
        <section aria-label="Resumen de series" className="series-summary">
          <Card className="summary-card">
            <div className="summary-topline"><span>Total de series</span><FolderKanban aria-hidden="true" size={17} /></div>
            <strong>{series.length}</strong><small>En tu biblioteca</small>
          </Card>
          <Card className="summary-card">
            <div className="summary-topline"><span>Series activas</span><CalendarDays aria-hidden="true" size={17} /></div>
            <strong>{activeCount}</strong><small>Marcadas como activas</small>
          </Card>
        </section>
      )}

      {isLoading && <p className="form-loading" role="status">Cargando series...</p>}

      {!isLoading && series.length > 0 && (
        <div className="series-grid">
          {series.map((item) => (
            <Card className="series-card" key={item.id}>
              {item.imagePath && <img alt="" className="series-cover" loading="lazy" src={item.imagePath} />}
              <div className="series-card-top">
                <span className={`status-badge ${item.status === "active" ? "status-prepared" : item.status === "finished" ? "status-archived" : "status-draft"}`}>
                  {getStatusLabel(item)}
                </span>
                <div className="sermon-menu">
                  <details>
                    <summary aria-label={`Acciones para ${item.name}`}><MoreHorizontal size={18} /></summary>
                    <div className="sermon-menu-options">
                      <Link to={`/series/${item.id}/edit`}><Pencil size={15} />Editar serie</Link>
                      <button className="danger-action" onClick={() => handleDelete(item)} type="button"><Trash2 size={15} />Eliminar</button>
                    </div>
                  </details>
                </div>
              </div>
              <h3>{item.name}</h3>
              {item.description && <p className="series-description">{item.description}</p>}
              {(item.topic || item.mainBibleReference) && (
                <p className="series-topic">
                  {[item.topic, item.mainBibleReference].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="series-date-row">
                {(item.startsOn || item.endsOn) && (
                  <span><CalendarDays aria-hidden="true" size={14} />{formatDate(item.startsOn)}{item.startsOn && item.endsOn ? " — " : ""}{formatDate(item.endsOn)}</span>
                )}
                <span>{item.items.filter((entry) => entry.contentType === "sermon").length} {item.items.filter((entry) => entry.contentType === "sermon").length === 1 ? "sermón" : "sermones"}</span>
              </div>
              {(() => {
                const progress = getSeriesProgress(item.items
                  .filter((entry) => entry.contentType === "sermon")
                  .map((entry) => sermons.find((sermon) => sermon.id === entry.contentId)?.status)
                  .filter((status): status is ContentStatus => Boolean(status)));
                return (
                  <p className="series-progress" aria-label={`Progreso: ${progress.total} sermones, ${progress.pending} pendientes, ${progress.preparing} en preparación, ${progress.preached} predicados`}>
                    <strong>{progress.total} en total</strong>
                    <span>{progress.pending} pendientes</span>
                    <span>{progress.preparing} en preparación</span>
                    <span>{progress.preached} predicados</span>
                    {progress.archived > 0 && <span>{progress.archived} archivados</span>}
                  </p>
                );
              })()}
              {item.items.length > 0 && (
                <ol className="series-item-preview">
                  {item.items.slice(0, 3).map((seriesItem, index) => (
                    <li key={seriesItem.id}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>
                        {(seriesItem.contentType === "sermon"
                          ? sermons.find((sermon) => sermon.id === seriesItem.contentId)?.title
                          : studies.find((study) => study.id === seriesItem.contentId)?.title) ?? "Material"}
                      </strong>
                    </li>
                  ))}
                  {item.items.length > 3 && <li className="series-more-items">y {item.items.length - 3} más...</li>}
                </ol>
              )}
              <Link className="series-open-link" to={`/series/${item.id}/edit`}>Abrir serie</Link>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && series.length === 0 && (
        <Card className="sermon-empty">
          <span aria-hidden="true" className="sermon-empty-icon"><FolderKanban size={22} /></span>
          <h3>Organiza tus enseñanzas por series</h3>
          <p>Crea una serie, añade sermones o estudios y ordénalos según el plan de enseñanza.</p>
          <Link className="button button-primary" to="/series/new"><Plus size={16} />Crear primera serie</Link>
        </Card>
      )}
    </main>
  );
}
