interface LogoProps {
  className?: string;
}

// a small crochet-hook glyph used as the wordmark accent.
export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15.5 5.5 C15.5 4 13.5 3.5 12 4.5 C10.8 5.3 11 7 11 8.5 L11 17" />
      <path d="M11 17 L7.5 20.5" strokeWidth="2.6" />
    </svg>
  );
}

export default Logo;
