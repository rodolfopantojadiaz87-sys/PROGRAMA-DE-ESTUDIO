import { BookOpen, BookText, Library, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoMark } from "../components/welcome/LogoMark";
import { WelcomeButton } from "../components/welcome/WelcomeButton";
import { WelcomeContent } from "../components/welcome/WelcomeContent";

const destinations = [
  { label: "Sermones", to: "/sermons", icon: BookOpen },
  { label: "Estudios", to: "/studies", icon: BookText },
  { label: "Discipulado", to: "/discipleship", icon: UsersRound },
  { label: "Biblioteca", to: "/library", icon: Library },
];

export function WelcomePage() {
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!isLeaving) return;
    const timeoutId = window.setTimeout(() => navigate("/dashboard"), 420);
    return () => window.clearTimeout(timeoutId);
  }, [isLeaving, navigate]);

  return (
    <main className={`welcome-screen${isLeaving ? " is-leaving" : ""}`}>
      <div aria-hidden="true" className="welcome-screen-texture" />
      <header className="welcome-screen-header">
        <Link aria-label="Púlpito Bíblico, inicio" className="welcome-screen-brand" to="/">
          <LogoMark className="welcome-brand-symbol" />
          <span>PÚLPITO BÍBLICO</span>
        </Link>
        <span className="welcome-header-caption">ESPACIO DE ESTUDIO Y PREPARACIÓN</span>
      </header>

      <div className="welcome-screen-main">
        <WelcomeContent />
        <WelcomeButton disabled={isLeaving} onEnter={() => setIsLeaving(true)} />
        <nav aria-label="Secciones de Púlpito Bíblico" className="welcome-screen-nav">
          {destinations.map(({ icon: Icon, label, to }, index) => (
            <span className="welcome-nav-item" key={to}>
              <Link to={to}><Icon aria-hidden="true" size={13} />{label}</Link>
              {index < destinations.length - 1 && <span aria-hidden="true" className="welcome-nav-separator">·</span>}
            </span>
          ))}
        </nav>
      </div>

      <footer className="welcome-screen-footer">
        <span>UN ESPACIO PARA LA PREPARACIÓN PASTORAL</span>
        <span aria-hidden="true">✦</span>
        <span>ESTUDIO · REFLEXIÓN · ENSEÑANZA</span>
      </footer>
    </main>
  );
}
