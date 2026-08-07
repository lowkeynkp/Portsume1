import type { CSSProperties, ReactNode } from "react";

/* ────────────────────────────────────────────────────────────
   Handcrafted decorative vocabulary.
   Every mark is an inline SVG so the whole site stays one
   portable, self-contained build. Nothing is stock.
   ──────────────────────────────────────────────────────────── */

interface DecorationProps {
  className?: string;
  style?: CSSProperties;
}

export function Flower({ className, style }: DecorationProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} style={style} aria-hidden="true">
      <g fill="#F68D7A">
        <ellipse cx="50" cy="22" rx="15" ry="19" transform="rotate(0 50 50)" />
        <ellipse cx="50" cy="22" rx="15" ry="19" transform="rotate(72 50 50)" />
        <ellipse cx="50" cy="22" rx="15" ry="19" transform="rotate(144 50 50)" />
        <ellipse cx="50" cy="22" rx="15" ry="19" transform="rotate(216 50 50)" />
        <ellipse cx="50" cy="22" rx="15" ry="19" transform="rotate(288 50 50)" />
      </g>
      <circle cx="50" cy="50" r="11" fill="#FFE37A" stroke="#24305E" strokeWidth="2" />
    </svg>
  );
}

export function FlowerBlush({ className, style }: DecorationProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} style={style} aria-hidden="true">
      <g fill="#F8CCD6">
        <ellipse cx="50" cy="20" rx="14" ry="18" transform="rotate(60 50 50)" />
        <ellipse cx="50" cy="20" rx="14" ry="18" transform="rotate(180 50 50)" />
        <ellipse cx="50" cy="20" rx="14" ry="18" transform="rotate(300 50 50)" />
      </g>
      <circle cx="50" cy="50" r="10" fill="#FFF8EF" stroke="#24305E" strokeWidth="1.5" />
    </svg>
  );
}

export function Spark({ className, style }: DecorationProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M32 4c2.5 14 8 19.5 22 22-14 2.5-19.5 8-22 22-2.5-14-8-19.5-22-22 14-2.5 19.5-8 22-22Z"
        fill="#FFE37A"
        stroke="#24305E"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="12" r="4" fill="#F68D7A" />
      <circle cx="12" cy="50" r="3" fill="#8ED8F8" />
    </svg>
  );
}

export function SparkCoral({ className, style }: DecorationProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M32 4c2.5 14 8 19.5 22 22-14 2.5-19.5 8-22 22-2.5-14-8-19.5-22-22 14-2.5 19.5-8 22-22Z"
        fill="#F68D7A"
      />
    </svg>
  );
}

export function Blob({ className, style, tone = "#B9E4F4" }: DecorationProps & { tone?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={className} style={style} aria-hidden="true">
      <path
        d="M147 31c26 18 42 41 38 70-4 28-25 50-57 50-34-1-49 15-78 4-31-12-37-41-30-74C27 48 41 29 66 22c30-9 55-9 81 9Z"
        fill={tone}
      />
    </svg>
  );
}

export function ArrowScribble({ className, style }: DecorationProps) {
  return (
    <svg viewBox="0 0 160 90" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M8 22 C 55 4, 96 10, 132 26 C 148 33, 151 44, 143 58"
        stroke="#24305E"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M132 44 L 143 58 L 118 62"
        stroke="#24305E"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function CurvedArrow({ className, style }: DecorationProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M14 96 C 34 30, 66 14, 102 22"
        stroke="#F68D7A"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M102 12 L 108 24 L 94 26" stroke="#F68D7A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function WavyLine({ className, style }: DecorationProps) {
  return (
    <svg viewBox="0 0 200 24" fill="none" preserveAspectRatio="none" className={className} style={style} aria-hidden="true">
      <path
        d="M0 14 C 20 2, 40 26, 60 14 S 100 2, 120 14 S 160 26, 200 12"
        stroke="#24305E"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

export function DoodleCircle({ className, style }: DecorationProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M60 6 a54 54 0 1 1 -1 0"
        stroke="#24305E"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 9"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

export function Squiggle({ className, style }: DecorationProps) {
  return (
    <svg viewBox="0 0 120 28" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M4 18 C 18 6, 32 26, 46 16 S 78 6, 92 16 S 112 22, 118 14"
        stroke="#157A43"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Tape({ className, style, variant = "yellow" }: DecorationProps & { variant?: "yellow" | "pink" | "blue" }) {
  const bg = variant === "yellow" ? "rgba(255,227,122,0.75)" : variant === "pink" ? "rgba(248,204,214,0.85)" : "rgba(185,228,244,0.9)";
  return (
    <span
      aria-hidden="true"
      className={`tape ${variant === "pink" ? "tape-pink" : variant === "blue" ? "tape-blue" : ""} ${className ?? ""}`}
      style={{ background: variant === "yellow" ? bg : undefined, ...style }}
    />
  );
}

/** A small pastel rectangle like a physical paint swatch. */
export function Swatch({ className, style, color = "#FFD6C2", tilt = -3 }: DecorationProps & { color?: string; tilt?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block rounded-xl border border-navy/10 ${className ?? ""}`}
      style={{ background: color, width: "3rem", height: "3rem", transform: `rotate(${tilt}deg)`, boxShadow: "0 8px 20px -10px rgba(36,48,94,0.3)", ...style }}
    />
  );
}

/** Decorative frame corner brackets. */
export function Corner({ className, style }: DecorationProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M2 38 V 14 Q 2 2 14 2 H 38" stroke="#24305E" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

export function Bubble({ children, className, style }: { children: ReactNode } & DecorationProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border-2 border-navy/20 ${className ?? ""}`}
      style={style}
    >
      {children}
    </span>
  );
}
