import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, BookText, Maximize2, Minimize2, Presentation, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useSermons } from "../hooks/useSermons";
import { useStudies } from "../hooks/useStudies";
import type { BibleStudy, Sermon } from "../types/domain";

interface PresentationSlide {
  title: string;
  body: string[];
  reference?: string;
}

function sermonSlides(sermon: Sermon): PresentationSlide[] {
  const slides: PresentationSlide[] = [{
    title: sermon.title || "Sermón",
    body: sermon.topic ? [sermon.topic] : [],
    reference: sermon.mainBibleReference,
  }];
  const sermonFields: { key: string; title: string; value: string }[] = [
    { key: "centralIdea", title: "Idea central", value: sermon.centralIdea },
    { key: "preachingObjective", title: "Objetivo", value: sermon.preachingObjective },
    { key: "introduction", title: "Introducción", value: sermon.introduction },
    { key: "historicalContext", title: "Contexto histórico", value: sermon.historicalContext },
    { key: "literaryContext", title: "Contexto literario", value: sermon.literaryContext },
    { key: "biblicalContext", title: "Contexto bíblico", value: sermon.biblicalContext },
    { key: "passageStructure", title: "Estructura del pasaje", value: sermon.passageStructure },
    { key: "development", title: "Desarrollo", value: sermon.development },
    { key: "conclusion", title: "Conclusión", value: sermon.conclusion },
    { key: "finalChallenge", title: "Para llevar contigo", value: sermon.finalChallenge },
  ];
  sermonFields.forEach(({ key, title, value }) => {
    if (value.trim() && !(sermon.privateFields ?? []).includes(key)) {
      slides.push({ title, body: [value], reference: sermon.mainBibleReference });
    }
  });
  sermon.sections
    .filter((section) => section.visibility === "projectable")
    .sort((a, b) => a.order - b.order)
    .forEach((section) => {
      const body = [
        section.explanation && `Explicación\n${section.explanation}`,
        section.observation && `Observación\n${section.observation}`,
        section.illustration && `Ilustración\n${section.illustration}`,
        section.application && `Aplicación\n${section.application}`,
        section.additionalReferences.length > 0
          && `Referencias relacionadas\n${section.additionalReferences.filter(Boolean).join(" · ")}`,
      ].filter((part): part is string => typeof part === "string");
      if (section.title || body.length > 0) {
        slides.push({
          title: section.title || "Bosquejo",
          body,
          reference: section.bibleReference || sermon.mainBibleReference,
        });
      }
    });
  return slides;
}

function studySlides(study: BibleStudy): PresentationSlide[] {
  const slides: PresentationSlide[] = [{
    title: study.title || "Estudio bíblico",
    body: study.objective && !(study.privateFields ?? []).includes("objective") ? [study.objective] : [],
    reference: study.mainBibleReference,
  }];
  const fields: { key: string; title: string; value: string }[] = [
    { key: "introduction", title: "Introducción", value: study.introduction },
    { key: "context", title: "Contexto", value: study.context },
    { key: "observation", title: "Observación del texto", value: study.observation },
    { key: "interpretation", title: "Interpretación", value: study.interpretation },
    { key: "explanation", title: "Explicación", value: study.explanation },
    { key: "applications", title: "Aplicación", value: study.applications },
    { key: "discussion", title: "Para conversar", value: study.discussion },
    { key: "conclusion", title: "Conclusión", value: study.conclusion },
    { key: "weeklyAssignment", title: "Para esta semana", value: study.weeklyAssignment },
  ];
  fields.forEach(({ key, title, value }) => {
    if (value.trim() && !(study.privateFields ?? []).includes(key)) {
      slides.push({ title, body: [value], reference: study.mainBibleReference });
    }
  });
  study.questions
    .filter((question) => question.visibility === "projectable")
    .sort((a, b) => a.order - b.order)
    .forEach((question, index) => {
      const body = [
        question.answer && `Guía para responder\n${question.answer}`,
        question.application && `Aplicación\n${question.application}`,
      ].filter((part): part is string => typeof part === "string");
      slides.push({
        title: question.question || `Pregunta ${index + 1}`,
        body,
        reference: study.mainBibleReference,
      });
    });
  return slides;
}

function PresentationChooser() {
  const { sermons, isLoading: sermonsLoading, error: sermonError } = useSermons();
  const { studies, isLoading: studiesLoading, error: studyError } = useStudies();
  const isLoading = sermonsLoading || studiesLoading;
  const errors = [sermonError, studyError].filter(Boolean);

  return (
    <main className="presentation-chooser">
      <header className="projection-brand"><BookOpen aria-hidden="true" size={16} /><span>PÚLPITO BÍBLICO</span></header>
      <section className="projection-chooser-content">
        <p className="projection-eyebrow">MODO DE PRESENTACIÓN</p>
        <h1>Elige una enseñanza</h1>
        <p className="projection-intro">Solo se mostrará contenido marcado como proyectable. Las notas privadas permanecerán ocultas.</p>
        {errors.map((error) => <p className="projection-error" key={error} role="alert">{error}</p>)}
        {isLoading ? <p className="projection-empty" role="status">Cargando materiales...</p> : (
          <div className="projection-materials">
            {sermons.map((sermon) => (
              <Link className="projection-material" key={`sermon-${sermon.id}`} to={`/presentation/${sermon.id}`}>
                <BookOpen aria-hidden="true" size={17} />
                <span><strong>{sermon.title || "Sermón sin título"}</strong><small>{sermon.mainBibleReference || "Sermón"}</small></span>
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
            ))}
            {studies.map((study) => (
              <Link className="projection-material" key={`study-${study.id}`} to={`/presentation/${study.id}`}>
                <BookText aria-hidden="true" size={17} />
                <span><strong>{study.title || "Estudio sin título"}</strong><small>{study.mainBibleReference || "Estudio bíblico"}</small></span>
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
            ))}
          </div>
        )}
        {!isLoading && sermons.length === 0 && studies.length === 0 && errors.length === 0 && (
          <p className="projection-empty">Aún no hay sermones ni estudios para presentar.</p>
        )}
        <Link className="projection-exit-link" to="/dashboard"><X aria-hidden="true" size={15} />Volver al espacio de trabajo</Link>
      </section>
    </main>
  );
}

export function PresentationPage() {
  const { id } = useParams();
  const { sermons, isLoading: sermonsLoading, error: sermonError } = useSermons();
  const { studies, isLoading: studiesLoading, error: studyError } = useStudies();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [presentationError, setPresentationError] = useState<string | null>(null);
  const sermon = sermons.find((item) => item.id === id);
  const study = studies.find((item) => item.id === id);
  const slides = useMemo(
    () => sermon ? sermonSlides(sermon) : study ? studySlides(study) : [],
    [sermon, study],
  );
  const isLoading = sermonsLoading || studiesLoading;
  const loadError = sermonError || studyError;

  const moveSlide = useCallback((direction: -1 | 1) => {
    setActiveSlide((current) => Math.max(0, Math.min(slides.length - 1, current + direction)));
  }, [slides.length]);

  useEffect(() => {
    setActiveSlide(0);
  }, [id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        moveSlide(1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        moveSlide(-1);
      } else if (event.key === "Home") {
        setActiveSlide(0);
      } else if (event.key === "End") {
        setActiveSlide(Math.max(slides.length - 1, 0));
      } else if (event.key.toLocaleLowerCase() === "f") {
        void toggleFullscreen();
      } else if (event.key === "Escape" && document.fullscreenElement) {
        void document.exitFullscreen();
      }
    };
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [moveSlide, slides.length]);

  async function toggleFullscreen() {
    setPresentationError(null);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error("No se pudo cambiar el modo de pantalla completa.", error);
      setPresentationError("El navegador no permitió activar la pantalla completa.");
    }
  }

  if (id === "demo" || id === "choose") return <PresentationChooser />;

  if (isLoading) {
    return <main className="presentation-screen"><p className="projection-empty" role="status">Preparando presentación...</p></main>;
  }

  if (loadError) {
    return <main className="presentation-screen"><p className="projection-error" role="alert">{loadError}</p><Link className="projection-exit-link" to="/dashboard">Volver al espacio de trabajo</Link></main>;
  }

  if (!sermon && !study) {
    return (
      <main className="presentation-screen">
        <BookOpen aria-hidden="true" className="projection-empty-icon" size={28} />
        <h1>No encontramos este material</h1>
        <p className="projection-empty">Puede que haya sido eliminado o que no esté disponible en este navegador.</p>
        <Link className="projection-exit-link" to="/presentation/demo">Elegir otra enseñanza</Link>
      </main>
    );
  }

  const slide = slides[activeSlide];
  const title = sermon?.title ?? study?.title ?? "";

  return (
    <main aria-label="Modo de presentación" className="presentation-screen">
      <header className="projection-toolbar">
        <Link aria-label="Salir de la presentación" className="projection-brand" to="/dashboard">
          <BookOpen aria-hidden="true" size={16} /><span>PÚLPITO BÍBLICO</span>
        </Link>
        <span className="projection-material-title">{title}</span>
        <div className="projection-toolbar-actions">
          <button aria-label={isFullscreen ? "Salir de pantalla completa" : "Activar pantalla completa"} className="projection-icon-button" onClick={() => void toggleFullscreen()} type="button">
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
          <Link aria-label="Salir de la presentación" className="projection-icon-button" to="/dashboard"><X size={18} /></Link>
        </div>
      </header>
      <section aria-live="polite" aria-atomic="true" className="projection-slide" key={`${id}-${activeSlide}`}>
        {slide.reference && <p className="projection-reference">{slide.reference}</p>}
        <h1>{slide.title}</h1>
        <div className="projection-slide-body">
          {slide.body.map((paragraph, index) => (
            <p key={`${activeSlide}-${index}`}>{paragraph}</p>
          ))}
        </div>
      </section>
      {presentationError && <p className="projection-error" role="alert">{presentationError}</p>}
      <footer className="projection-controls">
        <button aria-label="Diapositiva anterior" disabled={activeSlide === 0} onClick={() => moveSlide(-1)} type="button"><ArrowLeft size={17} /><span>Anterior</span></button>
        <span aria-live="polite">{activeSlide + 1} <i>/</i> {slides.length}</span>
        <button aria-label="Siguiente diapositiva" disabled={activeSlide >= slides.length - 1} onClick={() => moveSlide(1)} type="button"><span>Siguiente</span><ArrowRight size={17} /></button>
      </footer>
      <div aria-hidden="true" className="projection-progress"><span style={{ width: `${((activeSlide + 1) / slides.length) * 100}%` }} /></div>
      <span className="projection-key-hint"><Presentation aria-hidden="true" size={13} /> Flechas para navegar · F pantalla completa · Esc salir</span>
    </main>
  );
}
