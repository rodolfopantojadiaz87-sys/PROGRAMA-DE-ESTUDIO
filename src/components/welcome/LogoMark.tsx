interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className = "" }: LogoMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={`welcome-logo-mark ${className}`.trim()}
      fill="none"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M32 18V48" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M30 25C23 20 16 20 10 22V45C17 43 24 44 30 49V25Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.35" />
      <path d="M34 25C41 20 48 20 54 22V45C47 43 40 44 34 49V25Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.35" />
      <path d="M32 8V13M17 13L20 17M47 13L44 17M9 30H14M55 30H50" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M16 38C20 37 24 38 27 40M48 38C44 37 40 38 37 40" stroke="currentColor" strokeLinecap="round" strokeWidth="1" opacity=".62" />
    </svg>
  );
}
