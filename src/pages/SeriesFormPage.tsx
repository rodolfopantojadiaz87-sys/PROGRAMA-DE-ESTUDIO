import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, BookText, FolderKanban, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useSermons } from "../hooks/useSermons";
import { useSeries } from "../hooks/useSeries";
import { useStudies } from "../hooks/useStudies";
import type { Series, SeriesItem } from "../types/domain";

function createEmptySeries(): Series {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ownerId: "local-user",
    createdAt: now,
    updatedAt: now,
    name: "",
    description: "",
    topic: "",
    mainBibleReference: "",
    status: "preparation",
    imagePath: null,
    startsOn: null,
    endsOn: null,
    items: [],
  };
}

function createSeriesItem(seriesId: string, contentId: string, contentType: SeriesItem["contentType"], order: number): SeriesItem {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ownerId: "local-user",
    seriesId,
    contentId,
    contentType,
    order,
    createdAt: now,
    updatedAt: now,
  };
}

export function SeriesFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { series, isLoading: seriesLoading, error: seriesError, saveSeries } = useSeries();
  const { sermons, isLoading: sermonsLoading } = useSermons();
  const { studies, isLoading: studiesLoading } = useStudies();
  const existingSeries = id ? series.find((item) => item.id === id) : undefined;
  const [draft, setDraft] = useState<Series | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const initializedRoute = useRef<string | null>(null);
  const availableContentSearchRef = useRef<HTMLInputElement>(null);
  const isLoading = seriesLoading || sermonsLoading || studiesLoading;

  useEffect(() => {
    if (isLoading) return;
    const routeKey = id ?? "new";
    if (initializedRoute.current === routeKey) return;
    if (id && existingSeries) {
      setDraft({ ...existingSeries, items: [...existingSeries.items].sort((a, b) => a.order - b.order) });
      initializedRoute.current = routeKey;
    } else if (!id) {
      setDraft(createEmptySeries());
      initializedRoute.current = routeKey;
    }
  }, [id, existingSeries, isLoading]);

  const allContent = [
    ...sermons.map((sermon) => ({
      id: sermon.id,
      title: sermon.title,
      reference: sermon.mainBibleReference,
      type: "sermon" as const,
      seriesIds: sermon.seriesIds ?? (sermon.seriesId ? [sermon.seriesId] : []),
      status: sermon.status,
      date: sermon.date,
    })),
    ...studies.map((study) => ({
      id: study.id,
      title: study.title,
      reference: study.mainBibleReference,
      type: "study" as const,
      seriesId: study.seriesId,
      status: study.status,
      date: null,
    })),
  ];
  const selectedContentKeys = new Set((draft?.items ?? []).map((item) => `${item.contentType}:${item.contentId}`));
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const availableContent = allContent.filter((item) =>
    (item.type === "sermon" || !item.seriesId || item.seriesId === draft?.id) &&
    !selectedContentKeys.has(`${item.type}:${item.id}`) &&
    (!normalizedSearch || `${item.title} ${item.reference}`.toLocaleLowerCase().includes(normalizedSearch)),
  );

  function updateField<K extends keyof Series>(key: K, value: Series[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  }

  function addItem(content: (typeof allContent)[number]) {
    if (!draft) return;
    const item = createSeriesItem(draft.id, content.id, content.type, draft.items.length);
    updateField("items", [...draft.items, item]);
  }

  function removeItem(itemId: string) {
    updateField(
      "items",
      (draft?.items ?? []).filter((item) => item.id !== itemId).map((item, order) => ({ ...item, order })),
    );
  }

  function moveItem(index: number, direction: -1 | 1) {
    if (!draft) return;
    const target = index + direction;
    if (target < 0 || target >= draft.items.length) return;
    const items = [...draft.items];
    [items[index], items[target]] = [items[target], items[index]];
    updateField("items", items.map((item, order) => ({ ...item, order })));
  }

  function handleDragStart(event: DragEvent<HTMLLIElement>, itemId: string) {
    setDraggedItemId(itemId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
  }

  function handleDrop(event: DragEvent<HTMLLIElement>, targetItemId: string) {
    event.preventDefault();
    const sourceItemId = event.dataTransfer.getData("text/plain") || draggedItemId;
    if (!draft || !sourceItemId || sourceItemId === targetItemId) return;
    const items = [...draft.items];
    const sourceIndex = items.findIndex((item) => item.id === sourceItemId);
    const targetIndex = items.findIndex((item) => item.id === targetItemId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const [moved] = items.splice(sourceIndex, 1);
    items.splice(targetIndex, 0, moved);
    updateField("items", items.map((item, order) => ({ ...item, order })));
    setDraggedItemId(null);
  }

  function getContentTitle(item: SeriesItem): string {
    return allContent.find((content) => content.id === item.contentId && content.type === item.contentType)?.title
      ?? "Material no disponible";
  }

  function getContentReference(item: SeriesItem): string {
    return allContent.find((content) => content.id === item.contentId && content.type === item.contentType)?.reference ?? "";
  }

  function getContentDetails(item: SeriesItem): string {
    const content = allContent.find((candidate) => candidate.id === item.contentId && candidate.type === item.contentType);
    if (!content) return item.contentType === "sermon" ? "Sermón no disponible" : "Estudio no disponible";
    const status = content.status === "draft" ? "Pendiente"
      : content.status === "prepared" ? "En preparación"
        : content.status === "preached" ? "Predicado" : "Archivado";
    const date = content.date ? formatDate(content.date) : "";
    return [
      item.contentType === "sermon" ? "Sermón" : "Estudio",
      getContentReference(item),
      status,
      date,
    ].filter(Boolean).join(" · ");
  }

  function formatDate(date: string): string {
    const value = new Date(`${date}T00:00:00`);
    return Number.isNaN(value.getTime()) ? date : new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    if (!draft.name.trim()) {
      setFormError("Escribe un nombre para la serie antes de guardarla.");
      return;
    }
    if (draft.startsOn && draft.endsOn && draft.endsOn < draft.startsOn) {
      setFormError("La fecha de finalización no puede ser anterior a la fecha de inicio.");
      return;
    }
    const updated = {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      items: draft.items.map((item, order) => ({ ...item, order })),
      updatedAt: new Date().toISOString(),
    };
    if (!saveSeries(updated)) {
      setFormError("No se pudo guardar la serie. Revisa el almacenamiento e inténtalo de nuevo.");
      return;
    }
    navigate("/series");
  }

  function handleCreateSermon() {
    if (!draft) return;
    if (!draft.name.trim()) {
      setFormError("Escribe un título para la serie antes de crear un sermón.");
      return;
    }
    if (draft.startsOn && draft.endsOn && draft.endsOn < draft.startsOn) {
      setFormError("La fecha de finalización no puede ser anterior a la fecha de inicio.");
      return;
    }
    const updated = {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      items: draft.items.map((item, order) => ({ ...item, order })),
      updatedAt: new Date().toISOString(),
    };
    if (!saveSeries(updated)) {
      setFormError("No se pudo guardar la serie antes de crear el sermón.");
      return;
    }
    navigate(`/sermons/new?seriesId=${encodeURIComponent(updated.id)}`);
  }

  if (isLoading || (id && !draft && existingSeries)) return <p className="form-loading" role="status">Cargando serie...</p>;
  if (seriesError && !draft) return <p className="sermon-error" role="alert">{seriesError}</p>;
  if (id && !existingSeries) {
    return (
      <Card className="sermon-empty">
        <h2>No encontramos esta serie</h2>
        <p>Puede que haya sido eliminada o que no esté disponible en este navegador.</p>
        <Link className="button button-secondary" to="/series"><ArrowLeft size={16} />Volver a series</Link>
      </Card>
    );
  }
  if (!draft) return <p className="form-loading" role="status">Preparando editor...</p>;

  return (
    <main className="sermon-form-page">
      <Link className="back-link" to="/series"><ArrowLeft aria-hidden="true" size={16} />Volver a series</Link>
      <div className="page-intro">
        <p className="eyebrow">ORGANIZACIÓN DE CONTENIDO</p>
        <h2>{id ? "Editar serie" : "Nueva serie"}</h2>
        <p>Define el tema de la serie y ordena los sermones y estudios que la componen.</p>
      </div>

      <form className="sermon-editor-form" onSubmit={handleSubmit}>
        <Card className="sermon-form-card">
          <div className="editor-section-title">
            <span className="editor-step">01</span>
            <div><h3>Información de la serie</h3><p>Nombre, descripción y fechas de enseñanza.</p></div>
          </div>
          <div className="sermon-form-grid">
            <label className="form-field form-field-wide">
              <span>Nombre <b aria-hidden="true">*</b></span>
              <input autoFocus maxLength={160} onChange={(event) => updateField("name", event.target.value)} required value={draft.name} />
            </label>
            <label className="form-field form-field-wide">
              <span>Descripción</span>
              <textarea className="series-description-input" maxLength={1200} onChange={(event) => updateField("description", event.target.value)} placeholder="Describe el propósito y tema de esta serie..." rows={3} value={draft.description} />
            </label>
            <label className="form-field">
              <span>Tema central</span>
              <input maxLength={160} onChange={(event) => updateField("topic", event.target.value)} placeholder="Ej.: La esperanza en tiempos difíciles" value={draft.topic} />
            </label>
            <label className="form-field">
              <span>Pasaje bíblico principal <small>(opcional)</small></span>
              <input maxLength={120} onChange={(event) => updateField("mainBibleReference", event.target.value)} placeholder="Ej.: Filipenses 1:3-11" value={draft.mainBibleReference} />
            </label>
            <label className="form-field">
              <span>Estado de la serie</span>
              <select onChange={(event) => updateField("status", event.target.value as Series["status"])} value={draft.status}>
                <option value="preparation">En preparación</option>
                <option value="active">Activa</option>
                <option value="finished">Finalizada</option>
              </select>
              <small className="series-status-help">Puedes agregar sermones aunque marques la serie como finalizada.</small>
            </label>
            <label className="form-field form-field-wide">
              <span>Imagen de portada <small>(URL opcional)</small></span>
              <input maxLength={1000} onChange={(event) => updateField("imagePath", event.target.value || null)} placeholder="https://..." type="url" value={draft.imagePath ?? ""} />
            </label>
            <label className="form-field">
              <span>Fecha de inicio</span>
              <input onChange={(event) => updateField("startsOn", event.target.value || null)} type="date" value={draft.startsOn ?? ""} />
            </label>
            <label className="form-field">
              <span>Fecha de finalización</span>
              <input onChange={(event) => updateField("endsOn", event.target.value || null)} type="date" value={draft.endsOn ?? ""} />
            </label>
          </div>
        </Card>

        <section aria-labelledby="series-items-title" className="series-builder">
          <div className="editor-section-title">
            <span className="editor-step">02</span>
            <div><h3 id="series-items-title">Sermones de esta serie</h3><p>Agrega y ordena sermones ahora o en cualquier momento.</p></div>
            <Button onClick={() => availableContentSearchRef.current?.focus()} type="button" variant="secondary">Agregar sermón</Button>
            <Button icon={<Plus size={15} />} onClick={handleCreateSermon} type="button" variant="secondary">Crear sermón</Button>
          </div>
          <div className="series-builder-grid">
            <Card className="series-items-card">
              <div className="series-subheading">
                <div><h4>Sermones y materiales</h4><span>{draft.items.length} {draft.items.length === 1 ? "elemento asociado" : "elementos asociados"}</span></div>
              </div>
              {draft.items.length === 0 ? (
                <div className="series-items-empty">
                  <FolderKanban aria-hidden="true" size={20} />
                  <p>Aún no añadiste contenido a esta serie.</p>
                </div>
              ) : (
                <ol className="series-edit-list">
                  {draft.items.map((item, index) => {
                    const ContentIcon = item.contentType === "sermon" ? BookOpen : BookText;
                    return (
                      <li
                        className={`series-edit-item${draggedItemId === item.id ? " is-dragging" : ""}`}
                        draggable
                        key={item.id}
                        onDragEnd={() => setDraggedItemId(null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDragStart={(event) => handleDragStart(event, item.id)}
                        onDrop={(event) => handleDrop(event, item.id)}
                      >
                        <span aria-hidden="true" className="drag-handle"><GripVertical size={16} /></span>
                        <span className="series-order-number">{String(index + 1).padStart(2, "0")}</span>
                        <span aria-hidden="true" className="series-content-icon"><ContentIcon size={15} /></span>
                        <span className="series-edit-copy">
                          <Link to={item.contentType === "sermon" ? `/sermons/${item.contentId}/edit` : `/studies/${item.contentId}/edit`}>
                            <strong>{getContentTitle(item)}</strong>
                          </Link>
                          <small>{getContentDetails(item)}</small>
                        </span>
                        <span className="series-item-order-actions">
                          <button aria-label={`Mover ${getContentTitle(item)} arriba`} disabled={index === 0} onClick={() => moveItem(index, -1)} type="button"><ArrowUp size={14} /></button>
                          <button aria-label={`Mover ${getContentTitle(item)} abajo`} disabled={index === draft.items.length - 1} onClick={() => moveItem(index, 1)} type="button"><ArrowDown size={14} /></button>
                        </span>
                        <button aria-label={`Quitar ${getContentTitle(item)} de la serie`} className="series-remove-item" onClick={() => removeItem(item.id)} type="button"><Trash2 size={15} /></button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Card>

            <Card className="series-available-card">
              <div className="series-subheading">
                <div><h4>Desde tu biblioteca</h4><span>Sermones y estudios disponibles</span></div>
              </div>
              <label className="sermon-search series-content-search">
                <span className="sr-only">Buscar materiales</span>
                <input ref={availableContentSearchRef} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar material..." type="search" value={search} />
              </label>
              {availableContent.length === 0 ? (
                <div className="series-items-empty">
                  <p>{allContent.length === 0 ? "Crea sermones o estudios para añadirlos a una serie." : "No hay materiales disponibles que coincidan."}</p>
                </div>
              ) : (
                <ul className="available-content-list">
                  {availableContent.map((content) => {
                    const ContentIcon = content.type === "sermon" ? BookOpen : BookText;
                    return (
                      <li key={`${content.type}:${content.id}`}>
                        <span className="series-content-icon"><ContentIcon size={15} /></span>
                        <span className="series-edit-copy"><strong>{content.title}</strong><small>{content.type === "sermon" ? "Sermón" : "Estudio"}{content.reference ? ` · ${content.reference}` : ""}</small></span>
                        <button aria-label={`Añadir ${content.title} a la serie`} onClick={() => addItem(content)} type="button"><Plus size={16} /></button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </section>

        {(formError || seriesError) && <p className="sermon-error" role="alert">{formError ?? seriesError}</p>}
        <div className="sermon-form-actions editor-save-actions">
          <Link className="button button-secondary" to="/series">Cancelar</Link>
          <Button icon={<Save aria-hidden="true" size={16} />} type="submit" variant="primary">Guardar serie</Button>
        </div>
      </form>
    </main>
  );
}
