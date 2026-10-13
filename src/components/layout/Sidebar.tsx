import { BookMarked, ChevronLeft, ChevronRight, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Button } from "../ui/Button";
import { primaryNavigation, utilityNavigation } from "./navigation";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}: SidebarProps) {
  const { pathname } = useLocation();

  return (
    <>
      <button
        aria-label="Cerrar menú"
        className={`sidebar-backdrop${mobileOpen ? " is-visible" : ""}`}
        onClick={onCloseMobile}
        tabIndex={mobileOpen ? 0 : -1}
        type="button"
      />
      <aside
        aria-label="Navegación principal"
        className={`sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""}`}
      >
        <div className="sidebar-brand">
          <span aria-hidden="true" className="brand-mark">
            <BookMarked size={20} strokeWidth={1.8} />
          </span>
          <span className="brand-copy">
            <strong>Púlpito</strong>
            <small>BÍBLICO</small>
          </span>
          <Button
            aria-label="Cerrar menú"
            className="mobile-close"
            onClick={onCloseMobile}
            variant="ghost"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="nav-group">
          <p className="nav-caption">ESPACIO DE TRABAJO</p>
          <nav aria-label="Secciones de la aplicación" className="side-navigation">
            {primaryNavigation.map(({ icon: Icon, label, to }) => (
              <NavLink
                aria-label={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `nav-link${isActive || (to === "/presentation/demo" && pathname.startsWith("/presentation/")) ? " is-active" : ""}`
                }
                key={to}
                onClick={onCloseMobile}
                title={collapsed ? label : undefined}
                to={to}
              >
                <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <nav aria-label="Preferencias" className="side-navigation">
            {utilityNavigation.map(({ icon: Icon, label, to }) => (
              <NavLink
                aria-label={collapsed ? label : undefined}
                className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
                key={to}
                onClick={onCloseMobile}
                title={collapsed ? label : undefined}
                to={to}
              >
                <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="profile-card">
            <span aria-hidden="true" className="profile-avatar">PB</span>
            <span className="profile-copy">
              <strong>Mi espacio</strong>
              <small>Biblioteca personal</small>
            </span>
          </div>

          <Button
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            className="collapse-toggle"
            onClick={onToggleCollapsed}
            variant="ghost"
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            <span>{collapsed ? "Expandir menú" : "Contraer menú"}</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
