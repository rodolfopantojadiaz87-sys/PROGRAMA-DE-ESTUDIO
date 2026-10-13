import { DecorativeDivider } from "./DecorativeDivider";
import { LogoMark } from "./LogoMark";

export function WelcomeContent() {
  return (
    <section aria-labelledby="welcome-title" className="welcome-content">
      <LogoMark className="welcome-content-logo" />
      <h1 id="welcome-title">Púlpito Bíblico</h1>
      <p className="welcome-tagline">Preparar la Palabra. Enseñar con claridad.</p>
      <DecorativeDivider />
      <blockquote className="welcome-scripture">
        <p>“Tu palabra es una lámpara a mis pies<br className="welcome-verse-break" /> y una luz en mi camino.”</p>
        <cite>Salmo 119:105</cite>
      </blockquote>
    </section>
  );
}
