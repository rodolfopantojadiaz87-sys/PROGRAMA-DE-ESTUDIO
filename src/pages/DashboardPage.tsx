import {
  ArrowRight,
  BookOpen,
  BookText,
  Clock3,
  FolderKanban,
  Plus,
  Presentation,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { useSermons } from "../hooks/useSermons";
import { useStudies } from "../hooks/useStudies";
import { useSeries } from "../hooks/useSeries";
import type { BibleStudy, Sermon, Series } from "../types/domain";

const quickActions = [
  { label: "Nuevo sermón", description: "Prepara una predicación", to: "/sermons/new", icon: BookOpen },
  { label: "Nuevo estudio", description: "Desarrolla una guía bíblica", to: "/studies/new", icon: BookText },
  { label: "Nueva serie", description: "Organiza una secuencia", to: "/series/new", icon: FolderKanban },
];

function DashboardPanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: { label: string; to: string };
  children: ReactNode;
}) {
  return (
    <Card className="dashboard-panel">
      <div className="panel-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        {action && (
          <Link className="text-link" to={action.to}>
            {action.label}<ArrowRight aria-hidden="true" size={14} />
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
  to,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  action: string;
}) {
  return (
    <div className="dashboard-empty">
      <span className="dashboard-empty-icon" aria-hidden="true"><Icon size={19} /></span>
      <h4>{title}</h4>
      <p>{description}</p>
      <Link className="text-link" to={to}>{action}<ArrowRight aria-hidden="true" size={14} /></Link>
    </div>
  );
}

export function DashboardPage() {
  const { sermons, isLoading: sermonsLoading } = useSermons();
  const { studies, isLoading: studiesLoading } = useStudies();
  const { series, isLoading: seriesLoading } = useSeries();
  const today = new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const recentSermons = [...sermons]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);
  const recentStudies = [...studies]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);
  const activeSeries = series.filter((item) => {
    const todayDate = new Date().toISOString().slice(0, 10);
    return (!item.startsOn || item.startsOn <= todayDate) && (!item.endsOn || item.endsOn >= todayDate);
  });
  const recentDocuments = [
    ...sermons.map((sermon) => ({
      id: sermon.id,
      title: sermon.title,
      reference: sermon.mainBibleReference,
      updatedAt: sermon.updatedAt,
      to: `/sermons/${sermon.id}/edit`,
      icon: BookOpen,
    })),
    ...studies.map((study) => ({
      id: study.id,
      title: study.title,
      reference: study.mainBibleReference,
      updatedAt: study.updatedAt,
      to: `/studies/${study.id}/edit`,
      icon: BookText,
    })),
    ...series.map((item) => ({
      id: item.id,
      title: item.name,
      reference: `${item.items.length} ${item.items.length === 1 ? "enseñanza" : "enseñanzas"}`,
      updatedAt: item.updatedAt,
      to: `/series/${item.id}/edit`,
      icon: FolderKanban,
    })),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);
  const recentCount = [...sermons, ...studies, ...series].filter((item) => {
    const age = Date.now() - new Date(item.updatedAt).getTime();
    return age >= 0 && age < 30 * 24 * 60 * 60 * 1000;
  }).length;
  const summaryItems = [
    { label: "Sermones", value: sermonsLoading ? "—" : String(sermons.length), icon: BookOpen, note: "En tu biblioteca" },
    { label: "Estudios", value: studiesLoading ? "—" : String(studies.length), icon: BookText, note: "En tu biblioteca" },
    { label: "Series activas", value: seriesLoading ? "—" : String(activeSeries.length), icon: FolderKanban, note: "En curso" },
    {
      label: "Modificados recientemente",
      value: sermonsLoading || studiesLoading || seriesLoading
        ? "—"
        : String(recentCount),
      icon: Clock3,
      note: "En los últimos 30 días",
    },
  ];

  return (
    <main aria-labelledby="dashboard-title" className="dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <p className="eyebrow">{today}</p>
          <h2 id="dashboard-title">Bienvenido a tu espacio de preparación</h2>
          <p>Organiza tus enseñanzas y continúa desarrollando materiales para compartir.</p>
        </div>
        <span aria-hidden="true" className="welcome-mark"><Sparkles size={21} strokeWidth={1.6} /></span>
      </section>

      <section aria-label="Resumen de la biblioteca" className="summary-grid">
        {summaryItems.map(({ icon: Icon, label, note, value }) => (
          <Card className="summary-card" key={label}>
            <div className="summary-topline">
              <span>{label}</span>
              <Icon aria-hidden="true" size={17} strokeWidth={1.7} />
            </div>
            <strong>{value}</strong>
            <small>{note}</small>
          </Card>
        ))}
      </section>

      <section aria-labelledby="quick-actions-title" className="quick-actions-section">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">EMPIEZA RÁPIDO</p>
            <h3 id="quick-actions-title">Accesos rápidos</h3>
          </div>
        </div>
        <div className="quick-actions-grid">
          {quickActions.map(({ description, icon: Icon, label, to }) => (
            <Link className="quick-action-card" key={to} to={to}>
              <span aria-hidden="true" className="quick-action-icon"><Icon size={19} strokeWidth={1.8} /></span>
              <span className="quick-action-copy">
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
              <Plus aria-hidden="true" className="quick-action-plus" size={17} />
            </Link>
          ))}
          <Link className="quick-action-card projection-action" to="/presentation/demo">
            <span aria-hidden="true" className="quick-action-icon"><Presentation size={19} strokeWidth={1.8} /></span>
            <span className="quick-action-copy">
              <strong>Iniciar proyección</strong>
              <small>Presenta una enseñanza</small>
            </span>
            <ArrowRight aria-hidden="true" className="quick-action-plus" size={16} />
          </Link>
        </div>
      </section>

      <section aria-label="Actividad reciente" className="dashboard-panels">
        <DashboardPanel
          action={{ label: "Ver sermones", to: "/sermons" }}
          description="Tus últimas predicaciones preparadas"
          title="Sermones recientes"
        >
          {recentSermons.length
            ? <RecentSermons sermons={recentSermons} />
            : <EmptyPanel
                action="Crear primer sermón"
                description="Cuando prepares un sermón, podrás encontrarlo aquí."
                icon={BookOpen}
                title={sermonsLoading ? "Cargando sermones..." : "Aún no hay sermones"}
                to="/sermons/new"
              />}
        </DashboardPanel>

        <DashboardPanel
          action={{ label: "Ver estudios", to: "/studies" }}
          description="Guías bíblicas modificadas recientemente"
          title="Estudios recientes"
        >
          {recentStudies.length
            ? <RecentStudies studies={recentStudies} />
            : <EmptyPanel
                action="Crear primer estudio"
                description="Tus estudios recientes aparecerán en este espacio."
                icon={BookText}
                title={studiesLoading ? "Cargando estudios..." : "Aún no hay estudios"}
                to="/studies/new"
              />}
        </DashboardPanel>

        <DashboardPanel
          action={{ label: "Ver series", to: "/series" }}
          description="Enseñanzas organizadas en curso"
          title="Series activas"
        >
          {activeSeries.length
            ? <RecentSeries series={activeSeries.slice(0, 3)} />
            : <EmptyPanel
                action="Crear una serie"
                description="Agrupa sermones y estudios para seguir un tema."
                icon={FolderKanban}
                title={seriesLoading ? "Cargando series..." : "Aún no hay series"}
                to="/series/new"
              />}
        </DashboardPanel>

        <DashboardPanel
          action={{ label: "Abrir biblioteca", to: "/library" }}
          description="Sermones, estudios y otros recursos"
          title="Últimos documentos modificados"
        >
          {recentDocuments.length
            ? <RecentDocuments documents={recentDocuments} />
            : <EmptyPanel
                action="Explorar biblioteca"
                description="Tus documentos aparecerán aquí cuando agregues contenido."
                icon={Clock3}
                title={sermonsLoading || studiesLoading ? "Cargando documentos..." : "Todavía no hay documentos"}
                to="/library"
              />}
        </DashboardPanel>
      </section>
    </main>
  );
}

function RecentSermons({ sermons }: { sermons: Sermon[] }) {
  return (
    <ul className="recent-sermon-list">
      {sermons.map((sermon) => (
        <li key={sermon.id}>
          <Link className="recent-sermon-link" to={`/sermons/${sermon.id}/edit`}>
            <span className="recent-sermon-icon"><BookOpen aria-hidden="true" size={16} /></span>
            <span className="recent-sermon-copy">
              <strong>{sermon.title}</strong>
              <small>{sermon.mainBibleReference || "Sin referencia bíblica"}</small>
            </span>
            <ArrowRight aria-hidden="true" className="recent-sermon-arrow" size={15} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function RecentStudies({ studies }: { studies: BibleStudy[] }) {
  return (
    <ul className="recent-sermon-list">
      {studies.map((study) => (
        <li key={study.id}>
          <Link className="recent-sermon-link" to={`/studies/${study.id}/edit`}>
            <span className="recent-sermon-icon"><BookText aria-hidden="true" size={16} /></span>
            <span className="recent-sermon-copy">
              <strong>{study.title}</strong>
              <small>{study.mainBibleReference || "Sin referencia bíblica"}</small>
            </span>
            <ArrowRight aria-hidden="true" className="recent-sermon-arrow" size={15} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function RecentDocuments({
  documents,
}: {
  documents: {
    id: string;
    title: string;
    reference: string;
    to: string;
    icon: LucideIcon;
  }[];
}) {
  return (
    <ul className="recent-sermon-list">
      {documents.map(({ icon: Icon, id, reference, title, to }) => (
        <li key={id}>
          <Link className="recent-sermon-link" to={to}>
            <span className="recent-sermon-icon"><Icon aria-hidden="true" size={16} /></span>
            <span className="recent-sermon-copy">
              <strong>{title}</strong>
              <small>{reference || "Sin referencia bíblica"}</small>
            </span>
            <ArrowRight aria-hidden="true" className="recent-sermon-arrow" size={15} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function RecentSeries({ series }: { series: Series[] }) {
  return (
    <ul className="recent-sermon-list">
      {series.map((item) => (
        <li key={item.id}>
          <Link className="recent-sermon-link" to={`/series/${item.id}/edit`}>
            <span className="recent-sermon-icon"><FolderKanban aria-hidden="true" size={16} /></span>
            <span className="recent-sermon-copy">
              <strong>{item.name}</strong>
              <small>{item.items.length} {item.items.length === 1 ? "enseñanza" : "enseñanzas"}</small>
            </span>
            <ArrowRight aria-hidden="true" className="recent-sermon-arrow" size={15} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
