import React from "react";

/**
 * Flag — a round country flag drawn as inline SVG.
 *
 * Why not emoji? Unicode regional-indicator emoji (🇺🇸 …) have no glyph on
 * Windows browsers, so they fall back to rendering the two letters ("US"), which
 * is the "circle with a country code" bug. Inline SVG renders identically on
 * Windows/macOS/Linux and needs no assets, fonts, or network.
 *
 * Single source of truth for the market → flag mapping (shared by every call site).
 * Exposes `data-testid="flag-{code}"` for automation.
 */

const SHAPES = {
  JP: (
    <>
      <rect width="36" height="36" fill="#ffffff" />
      <circle cx="18" cy="18" r="8" fill="#bc002d" />
    </>
  ),
  CH: (
    <>
      <rect width="36" height="36" fill="#d52b1e" />
      <rect x="15.5" y="8" width="5" height="20" fill="#ffffff" />
      <rect x="8" y="15.5" width="20" height="5" fill="#ffffff" />
    </>
  ),
  US: (
    <>
      <rect width="36" height="36" fill="#b22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} x="0" y={i * (36 / 13)} width="36" height={36 / 13} fill="#ffffff" />
      ))}
      <rect x="0" y="0" width="16" height={(36 / 13) * 7} fill="#3c3b6e" />
      {/* simplified star field */}
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={2.4 + col * 3 + (row % 2) * 1.5}
            cy={2.6 + row * 4.2}
            r="0.8"
            fill="#ffffff"
          />
        )),
      )}
    </>
  ),
  MX: (
    <>
      <rect x="0" width="12" height="36" fill="#006847" />
      <rect x="12" width="12" height="36" fill="#ffffff" />
      <rect x="24" width="12" height="36" fill="#ce1126" />
      {/* simplified central emblem (distinguishes from the Italian tricolor) */}
      <circle cx="18" cy="18" r="3.4" fill="none" stroke="#3d7a34" strokeWidth="0.8" />
      <ellipse cx="18" cy="18" rx="2" ry="1.4" fill="#7b4a1e" />
    </>
  ),
  SA: (
    <>
      <rect width="36" height="36" fill="#006c35" />
      <text
        x="18"
        y="15.5"
        textAnchor="middle"
        fontSize="4.4"
        fill="#ffffff"
        fontFamily="'Segoe UI', 'Noto Naskh Arabic', serif"
      >
        لا إله إلا الله
      </text>
      <text
        x="18"
        y="20.5"
        textAnchor="middle"
        fontSize="4.4"
        fill="#ffffff"
        fontFamily="'Segoe UI', 'Noto Naskh Arabic', serif"
      >
        محمد رسول الله
      </text>
      {/* sword */}
      <rect x="8" y="25" width="18" height="1.6" rx="0.8" fill="#ffffff" />
      <rect x="7" y="24.4" width="2.4" height="2.8" rx="0.6" fill="#ffffff" />
    </>
  ),
};

export default function Flag({ code, size = 28, className = "", title }) {
  const upper = String(code || "").toUpperCase();
  const shape = SHAPES[upper];
  const clipId = `flag-clip-${upper}`;

  if (!shape) {
    // Unknown market — fall back to a neutral disc with the code, never crash.
    return (
      <span
        data-testid={`flag-${upper}`}
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          borderRadius: "50%",
          background: "#2A2A2A",
          color: "#fff",
          fontSize: size * 0.36,
          fontWeight: 700,
        }}
      >
        {upper}
      </span>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      role="img"
      aria-label={title || `${upper} flag`}
      data-testid={`flag-${upper}`}
      className={className}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="18" cy="18" r="18" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{shape}</g>
      <circle cx="18" cy="18" r="17.3" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
    </svg>
  );
}
