/** Custom SVG icons & brand marks (Lucide covers the rest). */
import { useId } from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

/** Webese mark: a tilted browser window with a spark bursting out of it. */
export function LogoMark(props: IconProps) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <defs>
        <linearGradient id={`${id}-g`} x1="2" y1="4" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E5FF" />
          <stop offset="1" stopColor="#FF2BD6" />
        </linearGradient>
      </defs>
      <rect x="3" y="7" width="22" height="20" rx="6" transform="rotate(-8 14 17)" fill={`url(#${id}-g)`} />
      <path d="M6.6 12.2 24 9.7" transform="rotate(-8 14 17)" stroke="#07080B" strokeOpacity=".35" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M25.5 1.5c.5 2.6 1.4 3.5 4 4-2.6.5-3.5 1.4-4 4-.5-2.6-1.4-3.5-4-4 2.6-.5 3.5-1.4 4-4Z"
        fill="#FFC23D"
        stroke="#07080B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M10 19.5c1.6 1.8 4.4 2.1 6.4.6" stroke="#07080B" strokeWidth="2" strokeLinecap="round" />
      <circle cx="11" cy="15.6" r="1.3" fill="#07080B" />
      <circle cx="16.6" cy="14.8" r="1.3" fill="#07080B" />
    </svg>
  );
}

/** 4-point sparkle used as a decorative accent. */
export function Spark(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path d="M12 0c.9 6.6 5.4 11.1 12 12-6.6.9-11.1 5.4-12 12-.9-6.6-5.4-11.1-12-12C6.6 11.1 11.1 6.6 12 0Z" fill="currentColor" />
    </svg>
  );
}

export function GoogleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8l4-3Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}

export function AppleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M16.4 12.7c0-2.5 2.1-3.7 2.2-3.8-1.2-1.7-3-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.2ZM13.9 5.2c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5Z" />
    </svg>
  );
}

/** Hand-drawn arrow for cheeky annotations. */
export function ScribbleArrow(props: IconProps) {
  return (
    <svg viewBox="0 0 80 50" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M4 8c14 2 30 6 40 16 7 7 10 14 12 20" />
      <path d="M46 38l10 7 4-12" />
    </svg>
  );
}
