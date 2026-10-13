import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TagPicker } from "../components/ui/TagPicker";
import { useStudies } from "../hooks/useStudies";
import { useTags } from "../hooks/useTags";
import type { BibleStudy, ContentStatus, StudyQuestion } from "../types/domain";

type StudyTextField =
  | "objective"
  | "introduction"
  | "context"
  | "observation"
  | "interpretation"
  | "explanation"
  | "applications"
  | "discussion"
  | "conclusion"
  | "personalReflection"
  | "weeklyAssignment";

const studyFields: { key: StudyTextField; label: string; hint: string }[] = [
  { key: "objective", label: "Objetivo", hint: "¿Qué se espera comprender o aplicar al finalizar?" },
  { key: "introduction", label: "Introducción", hint: "Presenta el tema y despierta el interés del grupo." },
  { key: "context", label: "Contexto", hint: "Autor, audiencia, contexto histórico y literario." },
  { key: "observation", label: "Observación del texto", hint: "¿Qué dice el pasaje? Registra detalles, palabras y estructura." },
  { key: "interpretation", label: "Interpretación", hint: "¿Qué significó el texto para sus primeros destinatarios?" },
  { key: "explanation", label: "Explicación", hint: "Desarrolla el sentido del pasaje y sus enseñanzas." },
  { key: "applications", label: "Aplicaciones", hint: "¿Cómo se vive esta enseñanza hoy?" },
  { key: "discussion", label: "Discusión", hint: "Temas para conversar en grupo." },
  { key: "conclusion", label: "Conclusión", hint: "Resume las ideas principales del estudio." },
  { key: "personalReflection", label: "Reflexión personal", hint: "Espacio privado para las reflexiones del maestro." },
  { key: "weeklyAssignment", label: "Tarea para la semana", hint: "Propón una lectura, práctica o reflexión para continuar." },
];

const statuses: { value: ContentStatus; label: string }[] = [
  { value: "draft", label: "Borrador" },
  { value: "prepared", label: "Preparado" },
  { value: "preached", label: "Enseñado" },
  { value: "archived", label: "Archivado" },
];

function createEmptyStudy(): BibleStudy {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ownerId: "local-user",
    createdAt: now,
    updatedAt: now,
    title: "",
    mainBibleReference: "",
    objective: "",
    introduction: "",
    context: "",
    observation: "",
    interpretation: "",
    explanation: "",
    questions: [],
    applications: "",
    discussion: "",
    conclusion: "",
    personalReflection: "",
    weeklyAssignment: "",
    status: "draft",
    seriesId: null,
    privateFields: ["personalReflection"],
    tagIds: [],
  };
}

function emptyQuestion(order: number): StudyQuestion {
  return { id: crypto.randomUUID(), question: "", answer: "", application: "", order, visibility: "projectable" };
}

function VisibilityTextarea({
  field,
  study,
  onChange,
  onToggle,
}: {
  field: (typeof studyFields)[number];
  study: BibleStudy;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  const isPrivate = (study.privateFields ?? []).includes(field.key);
  const Icon = isPrivate ? EyeOff : Eye;

  return (
    <div className="editor-field">
      <div className="editor-field-heading">
        <label htmlFor={`study-${field.key}`}>{field.label}</label>
        <button
          aria-label={`${isPrivate ? "Marcar como proyectable" : "Marcar como privado"}: ${field.label}`}
          aria-pressed={isPrivate}
          className={`visibility-toggle${isPrivate ? " is-private" : ""}`}
          onClick={onToggle}
          type="button"
        ><Icon aria-hidden="true" size={13} />{isPrivate ? "Privado" : "Proyectable"}</button>
      </div>
      <textarea
        id={`study-${field.key}`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.hint}
        rows={field.key === "objective" ? 3 : 4}
        value={study[field.key]}
      />
    </div>
  );
}

export function StudyFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { studies, isLoading, error, saveStudy } = useStudies();
  const { tags, error: tagError } = useTags();
  const existingStudy = id ? studies.find((study) => study.id === id) : undefined;
  const [study, setStudy] = useState<BibleStudy | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const initializedRoute = useRef<string | null>(null);
  const lastSavedContent = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const routeKey = id ?? "new";
    if (initializedRoute.current === routeKey) return;
    if (id && existingStudy) {
      const loadedStudy = {
        ...existingStudy,
        privateFields: existingStudy.privateFields ?? [],
        questions: [...existingStudy.questions].sort((a, b) => a.order - b.order),
      };
      setStudy(loadedStudy);
      lastSavedContent.current = JSON.stringify({ ...loadedStudy, updatedAt: "" });
      initializedRoute.current = routeKey;
    } else if (!id) {
      setStudy(createEmptyStudy());
      initializedRoute.current = routeKey;
    }
  }, [id, existingStudy, isLoading]);

  useEffect(() => {
    if (!study || !study.title.trim()) return;
    const signature = JSON.stringify({ ...study, updatedAt: "" });
    if (signature === lastSavedContent.current) return;

    setSaveState("saving");
    const timeoutId = window.setTimeout(() => {
      if (saveStudy({ ...study, updatedAt: new Date().toISOString() })) {
        lastSavedContent.current = signature;
        setFormError(null);
        setSaveState("saved");
      } else {
        setFormError("No se pudo guardar automáticamente. Revisa el almacenamiento y vuelve a intentarlo.");
        setSaveState("idle");
      }
    }, 700);
    return () => window.clearTimeout(timeoutId);
  }, [study, saveStudy]);

  function updateField<K extends keyof BibleStudy>(key: K, value: BibleStudy[K]) {
    setStudy((current) => current ? { ...current, [key]: value } : current);
  }

  function togglePrivateField(key: StudyTextField) {
    if (!study) return;
    const privateFields = study.privateFields ?? [];
    updateField("privateFields", privateFields.includes(key)
      ? privateFields.filter((field) => field !== key)
      : [...privateFields, key]);
  }

  function updateQuestion(idToUpdate: string, updates: Partial<StudyQuestion>) {
    setStudy((current) => current
      ? { ...current, questions: current.questions.map((question) => question.id === idToUpdate ? { ...question, ...updates } : question) }
      : current);
  }

  function addQuestion() {
    setStudy((current) => current
      ? { ...current, questions: [...current.questions, emptyQuestion(current.questions.length)] }
      : current);
  }

  function removeQuestion(question: StudyQuestion, index: number) {
    const prompt = question.question.trim() || `Pregunta ${index + 1}`;
    if (!window.confirm(`¿Quieres eliminar "${prompt}"? Esta acción no se puede deshacer.`)) return;
    setStudy((current) => current
      ? { ...current, questions: current.questions.filter((item) => item.id !== question.id).map((item, order) => ({ ...item, order })) }
      : current);
  }

  function duplicateQuestion(question: StudyQuestion, index: number) {
    setStudy((current) => {
      if (!current) return current;
      const questions = [...current.questions];
      questions.splice(index + 1, 0, { ...question, id: crypto.randomUUID(), question: question.question ? `${question.question} (copia)` : "" });
      return { ...current, questions: questions.map((item, order) => ({ ...item, order })) };
    });
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    setStudy((current) => {
      if (!current) return current;
      const questions = [...current.questions];
      const target = index + direction;
      if (target < 0 || target >= questions.length) return current;
      [questions[index], questions[target]] = [questions[target], questions[index]];
      return { ...current, questions: questions.map((item, order) => ({ ...item, order })) };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!study) return;
    if (!study.title.trim()) {
      setFormError("Escribe un título antes de guardar el estudio.");
      return;
    }
    const updated = {
      ...study,
      title: study.title.trim(),
      mainBibleReference: study.mainBibleReference.trim(),
      updatedAt: new Date().toISOString(),
      questions: study.questions.map((question, order) => ({ ...question, order })),
    };
    if (!saveStudy(updated)) {
      setFormError("No se pudo guardar el estudio. Revisa el almacenamiento disponible e inténtalo de nuevo.");
      return;
    }
    lastSavedContent.current = JSON.stringify({ ...updated, updatedAt: "" });
    navigate("/studies");
  }

  if (isLoading || (id && !study && existingStudy)) return <p className="form-loading" role="status">Cargando estudio...</p>;
  if (error && !study) return <p className="sermon-error" role="alert">{error}</p>;
  if (id && !existingStudy) {
    return (
      <Card className="sermon-empty">
        <h2>No encontramos este estudio</h2>
        <p>Puede que haya sido eliminado o que no esté disponible en este navegador.</p>
        <Link className="button button-secondary" to="/studies"><ArrowLeft size={16} />Volver a estudios</Link>
      </Card>
    );
  }
  if (!study) return <p className="form-loading" role="status">Preparando editor...</p>;

  return (
    <main className="sermon-form-page">
      <Link className="back-link" to="/studies"><ArrowLeft aria-hidden="true" size={16} />Volver a estudios</Link>
      <div className="page-intro">
        <p className="eyebrow">PREPARACIÓN DEL ESTUDIO</p>
        <h2>{id ? "Editar estudio" : "Nuevo estudio bíblico"}</h2>
        <p>Construye una guía para observar el texto, conversar y aplicar sus enseñanzas.</p>
      </div>

      <form className="sermon-editor-form" onSubmit={handleSubmit}>
        <Card className="sermon-form-card">
          <div className="editor-section-title">
            <span className="editor-step">01</span>
            <div><h3>Información general</h3><p>Identifica el tema, pasaje y estado del estudio.</p></div>
          </div>
          <div className="sermon-form-grid">
            <label className="form-field form-field-wide">
              <span>Título <b aria-hidden="true">*</b></span>
              <input autoFocus maxLength={160} onChange={(event) => updateField("title", event.target.value)} required value={study.title} />
            </label>
            <label className="form-field">
              <span>Texto principal</span>
              <input maxLength={120} onChange={(event) => updateField("mainBibleReference", event.target.value)} placeholder="Ej.: Juan 15:1-8" value={study.mainBibleReference} />
            </label>
            <label className="form-field">
              <span>Estado</span>
              <select onChange={(event) => updateField("status", event.target.value as ContentStatus)} value={study.status}>
                {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </label>
          </div>
          <TagPicker
            onChange={(tagIds) => updateField("tagIds", tagIds)}
            selectedIds={study.tagIds}
            tags={tags}
          />
          {tagError && <p className="sermon-error" role="alert">{tagError}</p>}
        </Card>

        <Card className="sermon-form-card">
          <div className="editor-section-title">
            <span className="editor-step">02</span>
            <div><h3>Contenido del estudio</h3><p>Prepara el recorrido de lectura y las aplicaciones del pasaje.</p></div>
          </div>
          <div className="sermon-content-fields">
            {studyFields.map((field) => (
              <VisibilityTextarea
                field={field}
                key={field.key}
                onChange={(value) => updateField(field.key, value)}
                onToggle={() => togglePrivateField(field.key)}
                study={study}
              />
            ))}
          </div>
        </Card>

        <section aria-labelledby="study-questions-title" className="outline-section">
          <div className="outline-heading">
            <div className="editor-section-title">
              <span className="editor-step">03</span>
              <div><h3 id="study-questions-title">Preguntas para el grupo</h3><p>Agrega preguntas, respuestas y aplicaciones en el orden del estudio.</p></div>
            </div>
            <Button icon={<Plus size={16} />} onClick={addQuestion} type="button" variant="secondary">Agregar pregunta</Button>
          </div>

          {study.questions.length === 0 ? (
            <Card className="outline-empty">
              <p>Aún no agregaste preguntas a este estudio.</p>
              <Button icon={<Plus size={15} />} onClick={addQuestion} type="button" variant="secondary">Añadir primera pregunta</Button>
            </Card>
          ) : (
            <div className="outline-list">
              {study.questions.map((question, index) => (
                <Card className="outline-point" key={question.id}>
                  <div className="outline-point-header">
                    <span className="point-number">{String(index + 1).padStart(2, "0")}</span>
                    <div className="point-heading-copy">
                      <strong>{question.question || `Pregunta ${index + 1}`}</strong>
                      <small>{question.visibility === "private" ? "Visible solo para el maestro" : "Disponible para el grupo"}</small>
                    </div>
                    <span className={`visibility-badge${question.visibility === "private" ? " is-private" : ""}`}>
                      {question.visibility === "private" ? <EyeOff size={12} /> : <Eye size={12} />}
                      {question.visibility === "private" ? "Privado" : "Proyectable"}
                    </span>
                    <div className="point-actions">
                      <button aria-label={`Mover pregunta ${index + 1} hacia arriba`} disabled={index === 0} onClick={() => moveQuestion(index, -1)} type="button"><ArrowUp size={15} /></button>
                      <button aria-label={`Mover pregunta ${index + 1} hacia abajo`} disabled={index === study.questions.length - 1} onClick={() => moveQuestion(index, 1)} type="button"><ArrowDown size={15} /></button>
                      <button aria-label={`Duplicar pregunta ${index + 1}`} onClick={() => duplicateQuestion(question, index)} type="button"><Copy size={14} /></button>
                      <button aria-label={`Eliminar pregunta ${index + 1}`} className="point-delete" onClick={() => removeQuestion(question, index)} type="button"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="outline-point-body">
                    <label className="editor-field">
                      <span>Pregunta</span>
                      <textarea onChange={(event) => updateQuestion(question.id, { question: event.target.value })} placeholder="Escribe una pregunta para el grupo..." rows={2} value={question.question} />
                    </label>
                    <div className="point-content-grid">
                      <label className="editor-field">
                        <span>Respuesta o guía para el maestro</span>
                        <textarea onChange={(event) => updateQuestion(question.id, { answer: event.target.value })} placeholder="Anota una respuesta o pistas para orientar la conversación..." rows={3} value={question.answer} />
                      </label>
                      <label className="editor-field">
                        <span>Aplicación relacionada</span>
                        <textarea onChange={(event) => updateQuestion(question.id, { application: event.target.value })} placeholder="¿Cómo se aplica esta respuesta a la vida?" rows={3} value={question.application} />
                      </label>
                    </div>
                    <div className="point-visibility-control">
                      <div><strong>Visibilidad</strong><p>Las preguntas privadas y sus respuestas no se mostrarán al grupo.</p></div>
                      <div aria-label="Visibilidad de la pregunta" className="visibility-segment" role="group">
                        <button aria-pressed={question.visibility === "projectable"} className={question.visibility === "projectable" ? "is-selected" : ""} onClick={() => updateQuestion(question.id, { visibility: "projectable" })} type="button"><Eye size={14} />Proyectable</button>
                        <button aria-pressed={question.visibility === "private"} className={question.visibility === "private" ? "is-selected is-private" : ""} onClick={() => updateQuestion(question.id, { visibility: "private" })} type="button"><EyeOff size={14} />Privado</button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <div aria-live="polite" className="sermon-save-feedback">
          {saveState === "saving" && <span>Guardando cambios...</span>}
          {saveState === "saved" && <span>Guardado automáticamente</span>}
        </div>
        {(formError || error) && <p className="sermon-error" role="alert">{formError ?? error}</p>}
        <div className="sermon-form-actions editor-save-actions">
          <Link className="button button-secondary" to="/studies">Cancelar</Link>
          <Button icon={<Save aria-hidden="true" size={16} />} type="submit" variant="primary">Guardar estudio</Button>
        </div>
      </form>
    </main>
  );
}
