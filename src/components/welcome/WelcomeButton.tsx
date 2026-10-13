import { ArrowRight } from "lucide-react";

interface WelcomeButtonProps {
  disabled: boolean;
  onEnter: () => void;
}

export function WelcomeButton({ disabled, onEnter }: WelcomeButtonProps) {
  return (
    <button
      aria-label="Entrar al espacio de Púlpito Bíblico"
      className="welcome-enter-button"
      disabled={disabled}
      onClick={onEnter}
      type="button"
    >
      <span>Entrar al espacio</span>
      <ArrowRight aria-hidden="true" size={16} strokeWidth={1.7} />
    </button>
  );
}
