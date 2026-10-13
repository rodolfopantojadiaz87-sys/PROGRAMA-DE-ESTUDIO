import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "../ui/Button";
import { primaryNavigation, utilityNavigation } from "./navigation";

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/sermons": "Sermones",
  "/studies": "Estudios bíblicos",
  "/series": "Series",
  "/discipleship": "Discipulado",
  "/library": "Biblioteca",
  "/settings": "Configuración",
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (pathname === "/sermons/new") return "Nuevo sermón";
  if (/^\/sermons\/[^/]+\/edit$/.test(pathname)) return "Editar sermón";
  if (pathname === "/studies/new") return "Nuevo estudio";
  if (/^\/studies\/[^/]+\/edit$/.test(pathname)) return "Editar estudio";
  if (pathname === "/series/new") return "Nueva serie";
  if (/^\/series\/[^/]+\/edit$/.test(pathname)) return "Editar serie";
  if (pathname.startsWith("/presentation/")) return "Proyección";
  return "Página no encontrada";
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);
  const navigation = [...primaryNavigation, ...utilityNavigation];
  const section = navigation.find((item) => pathname.startsWith(item.to))?.label ?? title;

  return (
    <header className="app-header">
      <div className="header-leading">
        <Button
          aria-label="Abrir menú"
          className="mobile-menu-trigger"
          onClick={onOpenMobileMenu}
          variant="ghost"
        >
          <Menu size={20} />
        </Button>
        <div>
          <p className="breadcrumbs">Púlpito Bíblico <span>/</span> {section}</p>
          <h1 className="header-title">{title}</h1>
        </div>
      </div>
      <div className="header-context">
        <span className="workspace-indicator" aria-hidden="true" />
        <span>Espacio personal</span>
      </div>
    </header>
  );
}
