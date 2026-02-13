export default function HeroDiloOrb() {
  return (
    <svg
      className="lp2-hero-orb"
      viewBox="0 0 520 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Dilo orb"
    >
      <defs>
        <radialGradient id="orbGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(260 240) rotate(90) scale(170)">
          <stop stopColor="#7c3aed" />
          <stop offset="0.55" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#22d3ee" />
        </radialGradient>

        <radialGradient id="orbInner" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(230 210) rotate(110) scale(210)">
          <stop stopColor="white" stopOpacity="0.18" />
          <stop offset="0.45" stopColor="white" stopOpacity="0.04" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>

        <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" result="b" />
          <feColorMatrix
            in="b"
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.85 0"
          />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient id="ringGrad" x1="120" y1="380" x2="400" y2="380" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22c55e" stopOpacity="0.0" />
          <stop offset="0.25" stopColor="#22c55e" stopOpacity="0.45" />
          <stop offset="0.55" stopColor="#a855f7" stopOpacity="0.55" />
          <stop offset="0.85" stopColor="#3b82f6" stopOpacity="0.5" />
          <stop offset="1" stopColor="#22c55e" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* subtle star field */}
      <g opacity="0.55">
        <circle cx="108" cy="112" r="2" fill="white" opacity="0.16" />
        <circle cx="416" cy="96" r="1.6" fill="white" opacity="0.14" />
        <circle cx="455" cy="170" r="1.8" fill="white" opacity="0.12" />
        <circle cx="82" cy="222" r="1.6" fill="white" opacity="0.10" />
        <circle cx="130" cy="404" r="2.2" fill="white" opacity="0.10" />
        <circle cx="402" cy="410" r="1.8" fill="white" opacity="0.10" />
      </g>

      {/* pulsing ring */}
      <g className="lp2-orb-ring">
        <ellipse cx="260" cy="390" rx="170" ry="48" stroke="url(#ringGrad)" strokeWidth="10" opacity="0.9" />
        <ellipse cx="260" cy="390" rx="150" ry="42" stroke="#a855f7" strokeOpacity="0.25" strokeWidth="2" />
      </g>

      {/* orb + face */}
      <g className="lp2-orb-float" filter="url(#softGlow)">
        <circle cx="260" cy="240" r="150" fill="url(#orbGrad)" />
        <circle cx="260" cy="240" r="150" fill="url(#orbInner)" />
        <circle cx="260" cy="240" r="154" stroke="white" strokeOpacity="0.12" strokeWidth="2" />

        {/* eyes */}
        <g>
          <circle cx="214" cy="228" r="28" fill="white" />
          <circle cx="306" cy="228" r="28" fill="white" />
          <circle cx="224" cy="232" r="12" fill="#0b1020" />
          <circle cx="316" cy="232" r="12" fill="#0b1020" />

          {/* blink lids */}
          <rect className="lp2-orb-blink lp2-orb-blink--l" x="186" y="216" width="56" height="24" rx="12" fill="#0b1020" />
          <rect className="lp2-orb-blink lp2-orb-blink--r" x="278" y="216" width="56" height="24" rx="12" fill="#0b1020" />
        </g>

        {/* smile */}
        <path d="M222 290 Q260 322 298 290" stroke="white" strokeOpacity="0.85" strokeWidth="12" strokeLinecap="round" fill="none" />
      </g>

      {/* loading bar */}
      <g className="lp2-orb-bar" opacity="0.95">
        <rect x="160" y="332" width="200" height="18" rx="9" fill="#0b1020" opacity="0.55" />
        <rect x="160" y="332" width="120" height="18" rx="9" fill="url(#ringGrad)" opacity="0.9" />
      </g>
    </svg>
  );
}

