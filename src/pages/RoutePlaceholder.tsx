import { ArrowUpRight, BookOpenCheck } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

interface RoutePlaceholderProps {
  title: string;
}

export function RoutePlaceholder({ title }: RoutePlaceholderProps) {
  return (
    <main aria-labelledby="page-heading" className="placeholder-page">
      <div className="page-intro">
        <p className="eyebrow">TU ESPACIO DE PREPARACIÓN</p>
        <h2 id="page-heading">{title}</h2>
        <p>Prepara, organiza y conserva tus materiales de enseñanza en un solo lugar.</p>
      </div>
      <Card className="coming-soon-card">
        <span aria-hidden="true" className="coming-soon-icon">
          <BookOpenCheck size={22} strokeWidth={1.7} />
        </span>
        <div>
          <p className="card-kicker">EN CONSTRUCCIÓN</p>
          <h3>Esta sección se desarrollará en su fase correspondiente</h3>
          <p>La estructura de navegación ya está preparada. Las funciones y herramientas se incorporarán gradualmente.</p>
        </div>
        <Button
          aria-label="Ver navegación de la aplicación"
          className="placeholder-action"
          disabled
          icon={<ArrowUpRight size={16} />}
          variant="secondary"
        >
          Próximamente
        </Button>
      </Card>
    </main>
  );
}
