import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TagPicker } from "../components/ui/TagPicker";
import { useSermons } from "../hooks/useSermons";
import { useSeries } from "../hooks/useSeries";
import { useTags } from "../hooks/useTags";
import type { ContentBlock, ContentStatus, ContentVisibility, Sermon } from "../types/domain";

const statuses: { value: ContentStatus; label: string }[] = [
  { value: "draft", label: "Borrador" },
  { value: "prepared", label: "En preparación" },
  { value: "preached", label: "Predicado" },
  { value: "archived", label: "Archivado" },
];

type SermonTextField =
  | "centralIdea"
  | "preachingObjective"
  | "introduction"
  | "historicalContext"
  | "literaryContext"
  | "biblicalContext"
  | "passageStructure"
  | "development"
  | "conclusion"
  | "finalChallenge";

const sermonContentFields: { key: SermonTextField; label: string; hint: string }[] = [
  { key: "centralIdea", label: "Idea central", hint: "¿Cuál es la verdad principal que quieres comunicar?" },
  { key: "preachingObjective", label: "Objetivo de la predicación", hint: "¿Qué esperas que comprendan o hagan quienes escuchan?" },
  { key: "introduction", label: "Introducción", hint: "Presenta el tema y conecta con la audiencia." },
  { key: "historicalContext", label: "Contexto histórico", hint: "Autor, audiencia, época y circunstancias." },
  { key: "literaryContext", label: "Contexto literario", hint: "Género, estructura y contexto inmediato del pasaje." },
  { key: "biblicalContext", label: "Contexto bíblico", hint: "Conexiones con el mensaje y la historia bíblica." },
  { key: "passageStructure", label: "Estructura del pasaje", hint: "Describe el movimiento y las divisiones del texto." },
  { key: "development", label: "Desarrollo", hint: "Expón el argumento y las enseñanzas del pasaje." },
  { key: "conclusion", label: "Conclusión", hint: "Recoge la idea central y concluye la enseñanza." },
  { key: "finalChallenge", label: "Llamamiento o desafío final", hint: "Invita a responder y aplicar la Palabra." },
];

function createEmptySermon(): Sermon {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ownerId: "local-user",
    createdAt: now,
    updatedAt: now,
    title: "",
    mainBibleReference: "",
    topic: "",
    seriesId: null,
    seriesIds: [],
    date: null,
    author: "",
    status: "draft",
    centralIdea: "",
    preachingObjective: "",
    introduction: "",
    historicalContext: "",
    literaryContext: "",
    biblicalContext: "",
    passageStructure: "",
    development: "",
    conclusion: "",
    finalChallenge: "",
    sections: [],
    privateFields: [],
    tagIds: [],
  };
}

function createEmptySection(order: number): ContentBlock {
  return {
    id: crypto.randomUUID(),
    title: "",
    bibleReference: "",
    explanation: "",
    observation: "",
    illustration: "",
    application: "",
    additionalReferences: [],
    privateNote: "",
    visibility: "projectable",
    order,
  };
}

function VisibilityTextarea({
  id,
  label,
  hint,
  value,
  isPrivate,
  onChange,
  onToggleVisibility,
  rows = 4,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  isPrivate: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  rows?: number;
}) {
  const VisibilityIcon = isPrivate ? EyeOff : Eye;

  return (
    <div className="editor-field">
      <div className="editor-field-heading">
        <label htmlFor={id}>{label}</label>
        <button
          aria-label={`${isPrivate ? "Marcar como proyectable" : "Marcar como privado"}: ${label}`}
          aria-pressed={isPrivate}
          className={`visibility-toggle${isPrivate ? " is-private" : ""}`}
          onClick={onToggleVisibility}
          type="button"
        >
          <VisibilityIcon aria-hidden="true" size={13} />
          {isPrivate ? "Privado" : "Proyectable"}
        </button>
      </div>
      <textarea
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={hint}
        rows={rows}
        value={value}
      />
    </div>
  );
}

function SectionEditor({
  section,
  index,
  count,
  onChange,
  onDuplicate,
  onMove,
  onRemove,
}: {
  section: ContentBlock;
  index: number;
  count: number;
  onChange: (updated: ContentBlock) => void;
  onDuplicate: () => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  function updateField<K extends keyof ContentBlock>(key: K, value: ContentBlock[K]) {
    onChange({ ...section, [key]: value });
  }

  function updateVisibility(visibility: ContentVisibility) {
    onChange({ ...section, visibility });
  }

  function updateReference(indexToUpdate: number, value: string) {
    updateField(
      "additionalReferences",
      section.additionalReferences.map((reference, index) => index === indexToUpdate ? value : reference),
    );
  }

  function moveReference(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= section.additionalReferences.length) return;
    const references = [...section.additionalReferences];
    [references[index], references[target]] = [references[target], references[index]];
    updateField("additionalReferences", references);
  }

  function removeReference(indexToRemove: number) {
    updateField("additionalReferences", section.additionalReferences.filter((_, index) => index !== indexToRemove));
  }

  return (
    <Card className={`outline-point${collapsed ? " is-collapsed" : ""}`}>
      <div className="outline-point-header">
        <button
          aria-expanded={!collapsed}
          aria-label={`${collapsed ? "Expandir" : "Contraer"} punto ${index + 1}`}
          className="point-collapse"
          onClick={() => setCollapsed((value) => !value)}
          type="button"
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronDown size={17} />}
        </button>
        <span className="point-number">{String(index + 1).padStart(2, "0")}</span>
        <div className="point-heading-copy">
          <strong>{section.title || `Punto ${index + 1}`}</strong>
          <small>{section.bibleReference || "Sin referencia bíblica"}</small>
        </div>
        <span className={`visibility-badge${section.visibility === "private" ? " is-private" : ""}`}>
          {section.visibility === "private" ? <EyeOff size={12} /> : <Eye size={12} />}
          {section.visibility === "private" ? "Privado" : "Proyectable"}
        </span>
        <div className="point-actions">
          <button aria-label={`Mover punto ${index + 1} hacia arriba`} disabled={index === 0} onClick={() => onMove(-1)} type="button"><ArrowUp size={15} /></button>
          <button aria-label={`Mover punto ${index + 1} hacia abajo`} disabled={index === count - 1} onClick={() => onMove(1)} type="button"><ArrowDown size={15} /></button>
          <button aria-label={`Duplicar punto ${index + 1}`} onClick={onDuplicate} type="button"><Copy size={14} /></button>
          <button aria-label={`Eliminar punto ${index + 1}`} className="point-delete" onClick={onRemove} type="button"><Trash2 size={15} /></button>
        </div>
      </div>

      {!collapsed && (
        <div className="outline-point-body">
          <div className="sermon-form-grid">
            <label className="form-field">
              <span>Título del punto</span>
              <input maxLength={160} onChange={(event) => updateField("title", event.target.value)} value={section.title} />
            </label>
            <label className="form-field">
              <span>Texto bíblico</span>
              <input maxLength={120} onChange={(event) => updateField("bibleReference", event.target.value)} placeholder="Ej.: 1 Pedro 4:1-2" value={section.bibleReference} />
            </label>
          </div>

          <div className="point-visibility-control">
            <div>
              <strong>Visibilidad del punto</strong>
              <p>Los puntos privados se excluirán del modo de proyección.</p>
            </div>
            <div aria-label="Visibilidad del contenido del punto" className="visibility-segment" role="group">
              <button
                aria-pressed={section.visibility === "projectable"}
                className={section.visibility === "projectable" ? "is-selected" : ""}
                onClick={() => updateVisibility("projectable")}
                type="button"
              ><Eye size={14} />Proyectable</button>
              <button
                aria-pressed={section.visibility === "private"}
                className={section.visibility === "private" ? "is-selected is-private" : ""}
                onClick={() => updateVisibility("private")}
                type="button"
              ><EyeOff size={14} />Privado</button>
            </div>
          </div>

          <div className="point-content-grid">
            <label className="editor-field">
              <span>Explicación</span>
              <textarea onChange={(event) => updateField("explanation", event.target.value)} placeholder="Explica el significado del texto..." rows={4} value={section.explanation} />
            </label>
            <label className="editor-field">
              <span>Observación</span>
              <textarea onChange={(event) => updateField("observation", event.target.value)} placeholder="¿Qué observas directamente en el pasaje?" rows={4} value={section.observation} />
            </label>
            <label className="editor-field">
              <span>Ilustración</span>
              <textarea onChange={(event) => updateField("illustration", event.target.value)} placeholder="Agrega una ilustración o ejemplo..." rows={4} value={section.illustration} />
            </label>
            <label className="editor-field">
              <span>Aplicación</span>
              <textarea onChange={(event) => updateField("application", event.target.value)} placeholder="¿Cómo se aplica esta enseñanza?" rows={4} value={section.application} />
            </label>
          </div>

          <div className="reference-editor">
            <div className="reference-editor-heading">
              <span>Referencias adicionales</span>
              <button onClick={() => updateField("additionalReferences", [...section.additionalReferences, ""])} type="button">
                <Plus size={14} />Agregar referencia
              </button>
            </div>
            {section.additionalReferences.length > 0 && (
              <ol className="reference-list">
                {section.additionalReferences.map((reference, referenceIndex) => (
                  <li key={`${section.id}-reference-${referenceIndex}`}>
                    <span>{referenceIndex + 1}.</span>
                    <input
                      aria-label={`Referencia adicional ${referenceIndex + 1}`}
                      maxLength={120}
                      onChange={(event) => updateReference(referenceIndex, event.target.value)}
                      placeholder="Ej.: Romanos 8:18"
                      value={reference}
                    />
                    <button aria-label={`Mover referencia ${referenceIndex + 1} hacia arriba`} disabled={referenceIndex === 0} onClick={() => moveReference(referenceIndex, -1)} type="button"><ArrowUp size={14} /></button>
                    <button aria-label={`Mover referencia ${referenceIndex + 1} hacia abajo`} disabled={referenceIndex === section.additionalReferences.length - 1} onClick={() => moveReference(referenceIndex, 1)} type="button"><ArrowDown size={14} /></button>
                    <button aria-label={`Eliminar referencia ${referenceIndex + 1}`} onClick={() => removeReference(referenceIndex)} type="button"><Trash2 size={14} /></button>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <label className="editor-field private-note-field">
            <span><EyeOff aria-hidden="true" size={13} /> Nota privada del predicador</span>
            <textarea
              onChange={(event) => updateField("privateNote", event.target.value)}
              placeholder="Solo visible en el editor. Nunca se incluirá en la proyección."
              rows={3}
              value={section.privateNote}
            />
          </label>
        </div>
      )}
    </Card>
  );
}

export function SermonFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSeriesId = searchParams.get("seriesId");
  const { sermons, isLoading: sermonsLoading, error, saveSermon } = useSermons();
  const { series, isLoading: seriesLoading } = useSeries();
  const { tags, error: tagError } = useTags();
  const existingSermon = id ? sermons.find((sermon) => sermon.id === id) : undefined;
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const initializedRoute = useRef<string | null>(null);
  const lastSavedContent = useRef<string | null>(null);
  const isLoading = sermonsLoading || seriesLoading;

  useEffect(() => {
    if (isLoading) return;
    const routeKey = id ?? "new";
    if (initializedRoute.current === routeKey) return;

    if (id && existingSermon) {
      const loadedSermon = {
        ...existingSermon,
        seriesIds: existingSermon.seriesIds ?? (existingSermon.seriesId ? [existingSermon.seriesId] : []),
        privateFields: existingSermon.privateFields ?? [],
        sections: [...existingSermon.sections].sort((a, b) => a.order - b.order),
      };
      setSermon(loadedSermon);
      lastSavedContent.current = JSON.stringify({ ...loadedSermon, updatedAt: "" });
      initializedRoute.current = routeKey;
    } else if (!id) {
      const emptySermon = createEmptySermon();
      const selectedSeries = series.find((item) => item.id === initialSeriesId);
      if (selectedSeries) {
        emptySermon.seriesId = selectedSeries.id;
        emptySermon.seriesIds = [selectedSeries.id];
      }
      setSermon(emptySermon);
      initializedRoute.current = routeKey;
    }
  }, [id, existingSermon, initialSeriesId, isLoading, series]);

  useEffect(() => {
    if (!sermon || !sermon.title.trim()) return;
    const contentSignature = JSON.stringify({ ...sermon, updatedAt: "" });
    if (contentSignature === lastSavedContent.current) return;

    setSaveState("saving");
    const timeoutId = window.setTimeout(() => {
      const updatedSermon = { ...sermon, updatedAt: new Date().toISOString() };
      if (saveSermon(updatedSermon)) {
        lastSavedContent.current = contentSignature;
        setFormError(null);
        setSaveState("saved");
      } else {
        setFormError("No se pudo guardar automáticamente. Revisa el espacio disponible y vuelve a intentarlo.");
        setSaveState("idle");
      }
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [sermon, saveSermon]);

  function updateSermonField<K extends keyof Sermon>(key: K, value: Sermon[K]) {
    setSermon((current) => current ? { ...current, [key]: value } : current);
  }

  function toggleSeriesAssignment(seriesId: string, selected: boolean) {
    if (!sermon) return;
    const currentIds = sermon.seriesIds ?? (sermon.seriesId ? [sermon.seriesId] : []);
    const seriesIds = selected
      ? [...new Set([...currentIds, seriesId])]
      : currentIds.filter((idToRemove) => idToRemove !== seriesId);
    setSermon({ ...sermon, seriesIds, seriesId: seriesIds[0] ?? null });
  }

  function togglePrivateField(key: SermonTextField) {
    if (!sermon) return;
    const privateFields = sermon.privateFields ?? [];
    updateSermonField(
      "privateFields",
      privateFields.includes(key)
        ? privateFields.filter((field) => field !== key)
        : [...privateFields, key],
    );
  }

  function updateSection(sectionId: string, updatedSection: ContentBlock) {
    setSermon((current) => current
      ? { ...current, sections: current.sections.map((section) => section.id === sectionId ? updatedSection : section) }
      : current);
  }

  function addSection() {
    setSermon((current) => current
      ? { ...current, sections: [...current.sections, createEmptySection(current.sections.length)] }
      : current);
  }

  function duplicateSection(sectionId: string) {
    setSermon((current) => {
      if (!current) return current;
      const index = current.sections.findIndex((section) => section.id === sectionId);
      if (index === -1) return current;
      const source = current.sections[index];
      const copy = { ...source, id: crypto.randomUUID(), title: source.title ? `${source.title} (copia)` : "", additionalReferences: [...source.additionalReferences] };
      const sections = [...current.sections];
      sections.splice(index + 1, 0, copy);
      return { ...current, sections: sections.map((section, order) => ({ ...section, order })) };
    });
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    setSermon((current) => {
      if (!current) return current;
      const sections = [...current.sections];
      const index = sections.findIndex((section) => section.id === sectionId);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= sections.length) return current;
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...current, sections: sections.map((section, order) => ({ ...section, order })) };
    });
  }

  function removeSection(sectionId: string) {
    setSermon((current) => current
      ? {
          ...current,
          sections: current.sections
            .filter((section) => section.id !== sectionId)
            .map((section, order) => ({ ...section, order })),
        }
      : current);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sermon) return;
    if (!sermon.title.trim()) {
      setFormError("Escribe un título antes de guardar el sermón.");
      return;
    }

    const updatedSermon = {
      ...sermon,
      title: sermon.title.trim(),
      mainBibleReference: sermon.mainBibleReference.trim(),
      topic: sermon.topic.trim(),
      author: sermon.author.trim(),
      updatedAt: new Date().toISOString(),
      sections: sermon.sections.map((section, order) => ({ ...section, order })),
    };
    if (!saveSermon(updatedSermon)) {
      setFormError("No se pudo guardar el sermón. Revisa el almacenamiento disponible e inténtalo de nuevo.");
      return;
    }
    lastSavedContent.current = JSON.stringify({ ...updatedSermon, updatedAt: "" });
    navigate(initialSeriesId ? `/series/${encodeURIComponent(initialSeriesId)}/edit` : "/sermons");
  }

  if (isLoading || (id && !sermon && existingSermon)) return <p className="form-loading" role="status">Cargando sermón...</p>;
  if (error && !sermon) return <p className="sermon-error" role="alert">{error}</p>;
  if (id && !existingSermon) {
    return (
      <Card className="sermon-empty">
        <h2>No encontramos este sermón</h2>
        <p>Puede que haya sido eliminado o que no esté disponible en este navegador.</p>
        <Link className="button button-secondary" to="/sermons"><ArrowLeft size={16} />Volver a sermones</Link>
      </Card>
    );
  }
  if (!sermon) return <p className="form-loading" role="status">Preparando editor...</p>;

  return (
    <main className="sermon-form-page">
      <Link className="back-link" to="/sermons"><ArrowLeft aria-hidden="true" size={16} />Volver a sermones</Link>
      <div className="page-intro">
        <p className="eyebrow">PREPARACIÓN DEL SERMÓN</p>
        <h2>{id ? "Editar sermón" : "Nuevo sermón"}</h2>
        <p>Organiza la información, desarrolla el contenido y construye el bosquejo de tu predicación.</p>
      </div>

      <form className="sermon-editor-form" onSubmit={handleSubmit}>
        <Card className="sermon-form-card">
          <div className="editor-section-title">
            <span className="editor-step">01</span>
            <div><h3>Información general</h3><p>Datos que identifican y organizan la predicación.</p></div>
          </div>
          <div className="sermon-form-grid">
            <label className="form-field form-field-wide">
              <span>Título <b aria-hidden="true">*</b></span>
              <input autoFocus maxLength={160} onChange={(event) => updateSermonField("title", event.target.value)} required value={sermon.title} />
            </label>
            <label className="form-field">
              <span>Texto bíblico principal</span>
              <input maxLength={120} onChange={(event) => updateSermonField("mainBibleReference", event.target.value)} placeholder="Ej.: 1 Pedro 4:1-11" value={sermon.mainBibleReference} />
            </label>
            <label className="form-field">
              <span>Tema</span>
              <input maxLength={100} onChange={(event) => updateSermonField("topic", event.target.value)} placeholder="Ej.: Esperanza" value={sermon.topic} />
            </label>
            <label className="form-field">
              <span>Fecha prevista de predicación</span>
              <input onChange={(event) => updateSermonField("date", event.target.value || null)} type="date" value={sermon.date ?? ""} />
            </label>
            <label className="form-field">
              <span>Autor</span>
              <input maxLength={100} onChange={(event) => updateSermonField("author", event.target.value)} value={sermon.author} />
            </label>
            <label className="form-field">
              <span>Estado</span>
              <select onChange={(event) => updateSermonField("status", event.target.value as ContentStatus)} value={sermon.status}>
                {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </label>
            <fieldset className="form-field form-field-wide series-assignment-field">
              <legend>Series <small>(opcional; puedes elegir más de una)</small></legend>
              {series.length > 0 ? (
                <div className="series-assignment-options">
                  {series.map((item) => (
                    <label key={item.id}>
                      <input
                        checked={(sermon.seriesIds ?? (sermon.seriesId ? [sermon.seriesId] : [])).includes(item.id)}
                        onChange={(event) => toggleSeriesAssignment(item.id, event.target.checked)}
                        type="checkbox"
                      />
                      <span>{item.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="series-assignment-empty">Aún no hay series. Puedes crear una desde la sección Series.</p>
              )}
            </fieldset>
          </div>
          <TagPicker
            onChange={(tagIds) => updateSermonField("tagIds", tagIds)}
            selectedIds={sermon.tagIds}
            tags={tags}
          />
          {tagError && <p className="sermon-error" role="alert">{tagError}</p>}
        </Card>

        <Card className="sermon-form-card">
          <div className="editor-section-title">
            <span className="editor-step">02</span>
            <div><h3>Contenido del sermón</h3><p>Desarrolla el contexto y el mensaje. Define qué campos podrán proyectarse.</p></div>
          </div>
          <div className="sermon-content-fields">
            {sermonContentFields.map(({ hint, key, label }) => (
              <VisibilityTextarea
                hint={hint}
                id={`sermon-${key}`}
                isPrivate={(sermon.privateFields ?? []).includes(key)}
                key={key}
                label={label}
                onChange={(value) => updateSermonField(key, value)}
                onToggleVisibility={() => togglePrivateField(key)}
                value={sermon[key]}
                rows={key === "centralIdea" || key === "preachingObjective" ? 3 : 4}
              />
            ))}
          </div>
        </Card>

        <section aria-labelledby="outline-title" className="outline-section">
          <div className="outline-heading">
            <div className="editor-section-title">
              <span className="editor-step">03</span>
              <div><h3 id="outline-title">Bosquejo del sermón</h3><p>Agrega puntos, desarrolla cada uno y ordénalos para la enseñanza.</p></div>
            </div>
            <Button icon={<Plus size={16} />} onClick={addSection} type="button" variant="secondary">Agregar punto</Button>
          </div>

          {sermon.sections.length === 0 ? (
            <Card className="outline-empty">
              <p>Aún no agregaste puntos al bosquejo.</p>
              <Button icon={<Plus size={15} />} onClick={addSection} type="button" variant="secondary">Añadir primer punto</Button>
            </Card>
          ) : (
            <div className="outline-list">
              {sermon.sections.map((section, index) => (
                <SectionEditor
                  count={sermon.sections.length}
                  index={index}
                  key={section.id}
                  onChange={(updated) => updateSection(section.id, updated)}
                  onDuplicate={() => duplicateSection(section.id)}
                  onMove={(direction) => moveSection(section.id, direction)}
                  onRemove={() => {
                    const pointName = section.title.trim() || `Punto ${index + 1}`;
                    if (window.confirm(`¿Quieres eliminar "${pointName}" del bosquejo? Esta acción no se puede deshacer.`)) {
                      removeSection(section.id);
                    }
                  }}
                  section={section}
                />
              ))}
            </div>
          )}
        </section>

        <div className="sermon-save-feedback" aria-live="polite">
          {saveState === "saving" && <span>Guardando cambios...</span>}
          {saveState === "saved" && <span>Guardado automáticamente</span>}
        </div>
        {(formError || error) && <p className="sermon-error" role="alert">{formError ?? error}</p>}
        <div className="sermon-form-actions editor-save-actions">
          <Link className="button button-secondary" to="/sermons">Cancelar</Link>
          <Button icon={<Save aria-hidden="true" size={16} />} type="submit" variant="primary">Guardar sermón</Button>
        </div>
      </form>
    </main>
  );
}
