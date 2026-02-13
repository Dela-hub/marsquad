export default function AgentIllustration() {
  return (
    <div className="lp-illustration" aria-hidden="true">
      <svg
        viewBox="-10 -10 560 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="lp-squad-svg"
      >
        <defs>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feFlood floodColor="#3b82f6" floodOpacity="0.5" />
            <feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feFlood floodColor="#f43f5e" floodOpacity="0.5" />
            <feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feFlood floodColor="#a855f7" floodOpacity="0.5" />
            <feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feFlood floodColor="#06b6d4" floodOpacity="0.5" />
            <feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feFlood floodColor="#10b981" floodOpacity="0.5" />
            <feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-indigo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feFlood floodColor="#6366f1" floodOpacity="0.5" />
            <feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feFlood floodColor="#f59e0b" floodOpacity="0.5" />
            <feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="8" floodColor="#000" floodOpacity="0.35" />
          </filter>
          <linearGradient id="sunset-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* ── Flow arrows at bottom ── */}
        <g opacity="0.25">
          <path d="M20 430 Q140 405 270 425 Q400 445 530 420" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeDasharray="8 5" className="svg-flow-line" />
          <path d="M0 442 Q130 460 260 438 Q390 418 540 440" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="5 7" className="svg-flow-line svg-flow-line--2" />
          <polygon points="528,417 540,420 528,423" fill="#3b82f6" opacity="0.6" />
          <polygon points="538,437 550,440 538,443" fill="#3b82f6" opacity="0.5" />
        </g>

        {/* ═══════════ BACK ROW (3 agents) ═══════════ */}

        {/* ═══ PHANTOM — typing at desk ═══ */}
        <g transform="translate(0, 30) scale(1.35)" filter="url(#soft-shadow)">
          {/* Desk */}
          <rect x="0" y="75" width="72" height="8" rx="3" fill="#1e293b" />
          <rect x="8" y="55" width="56" height="24" rx="4" fill="#0f172a" stroke="#f43f5e" strokeWidth="1" strokeOpacity="0.3" />
          <rect x="14" y="59" width="44" height="16" rx="2" fill="#f43f5e" opacity="0.08" />
          <line x1="18" y1="64" x2="48" y2="64" stroke="#f43f5e" strokeWidth="1.5" opacity="0.4" />
          <line x1="18" y1="69" x2="38" y2="69" stroke="#f43f5e" strokeWidth="1.5" opacity="0.25" />
          {/* Robot body */}
          <g className="svg-agent-type">
            <rect x="18" y="22" width="36" height="34" rx="10" fill="#f43f5e" />
            <rect x="22" y="2" width="28" height="22" rx="8" fill="#fb7185" />
            <rect x="26" y="8" width="20" height="8" rx="4" fill="#0f172a" />
            <circle cx="31" cy="12" r="2.5" fill="#fecdd3" />
            <circle cx="41" cy="12" r="2.5" fill="#fecdd3" />
            <rect x="10" y="34" width="12" height="5" rx="2.5" fill="#fb7185" className="svg-typing-arm" />
            <rect x="50" y="34" width="12" height="5" rx="2.5" fill="#fb7185" className="svg-typing-arm svg-typing-arm--r" />
            <line x1="36" y1="2" x2="36" y2="-5" stroke="#fb7185" strokeWidth="1.5" />
            <circle cx="36" cy="-7" r="3" fill="#f43f5e" filter="url(#glow-red)" />
          </g>
          {/* Loading bar */}
          <g className="svg-loading-bar">
            <rect x="14" y="-16" width="44" height="7" rx="3.5" fill="#1e293b" />
            <rect x="14" y="-16" width="35" height="7" rx="3.5" fill="#f43f5e" opacity="0.8" />
            <text x="62" y="-10" fontSize="8" fill="#f43f5e" fontFamily="monospace" fontWeight="600">80%</text>
          </g>
          <text x="36" y="98" textAnchor="middle" fontSize="10" fill="#f43f5e" fontWeight="600" fontFamily="sans-serif">Phantom</text>
        </g>

        {/* ═══ CIPHER — arms crossed, brooding ═══ */}
        <g transform="translate(175, 15) scale(1.35)" filter="url(#soft-shadow)">
          {/* Storm cloud */}
          <g className="svg-cloud" opacity="0.55">
            <ellipse cx="38" cy="-10" rx="22" ry="12" fill="#334155" />
            <ellipse cx="26" cy="-8" rx="14" ry="9" fill="#334155" />
            <ellipse cx="50" cy="-6" rx="16" ry="10" fill="#334155" />
            <path d="M36 2 L33 10 L38 8 L35 18" stroke="#fbbf24" strokeWidth="1.5" fill="none" className="svg-lightning" />
          </g>
          <g className="svg-agent-float" style={{ animationDelay: '0.3s' } as any}>
            <rect x="14" y="28" width="44" height="38" rx="12" fill="#06b6d4" />
            <rect x="18" y="6" width="36" height="24" rx="9" fill="#22d3ee" />
            <rect x="23" y="14" width="26" height="7" rx="3.5" fill="#0f172a" />
            <rect x="27" y="16" width="6" height="3" rx="1.5" fill="#a5f3fc" />
            <rect x="39" y="16" width="6" height="3" rx="1.5" fill="#a5f3fc" />
            <path d="M14 42 L4 50 L18 52" stroke="#22d3ee" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M58 42 L68 50 L54 52" stroke="#22d3ee" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <rect x="22" y="64" width="9" height="16" rx="4.5" fill="#06b6d4" />
            <rect x="41" y="64" width="9" height="16" rx="4.5" fill="#06b6d4" />
            <line x1="36" y1="6" x2="36" y2="-1" stroke="#22d3ee" strokeWidth="2" />
            <circle cx="36" cy="-3" r="3.5" fill="#06b6d4" filter="url(#glow-cyan)" />
          </g>
          <rect x="0" y="80" width="14" height="10" rx="1.5" fill="#1e293b" transform="rotate(-12 7 85)" />
          <rect x="58" y="78" width="14" height="10" rx="1.5" fill="#1e293b" transform="rotate(8 65 83)" />
          <text x="36" y="102" textAnchor="middle" fontSize="10" fill="#06b6d4" fontWeight="600" fontFamily="sans-serif">Cipher</text>
        </g>

        {/* ═══ PULSE — celebrating ═══ */}
        <g transform="translate(365, 20) scale(1.35)" filter="url(#soft-shadow)">
          {/* Confetti particles */}
          <rect x="8" y="-6" width="5" height="5" rx="1" fill="#fbbf24" className="svg-confetti svg-confetti--1" />
          <rect x="58" y="-2" width="4" height="6" rx="1" fill="#f43f5e" className="svg-confetti svg-confetti--2" />
          <rect x="24" y="-14" width="5" height="4" rx="1" fill="#a855f7" className="svg-confetti svg-confetti--3" />
          <rect x="50" y="-10" width="4" height="5" rx="1" fill="#3b82f6" className="svg-confetti svg-confetti--4" />
          <circle cx="16" cy="-8" r="2.5" fill="#10b981" className="svg-confetti svg-confetti--5" />
          <circle cx="62" cy="-14" r="3" fill="#f59e0b" className="svg-confetti svg-confetti--6" />
          <g className="svg-agent-jump">
            <rect x="14" y="24" width="40" height="36" rx="11" fill="#10b981" />
            <rect x="18" y="4" width="32" height="22" rx="8" fill="#34d399" />
            <rect x="23" y="10" width="22" height="8" rx="4" fill="#0f172a" />
            <circle cx="29" cy="14" r="2.5" fill="#a7f3d0" />
            <circle cx="39" cy="14" r="2.5" fill="#a7f3d0" />
            <path d="M29 20 Q34 24 39 20" stroke="#0f172a" strokeWidth="1.5" fill="none" />
            <path d="M14 34 L0 16" stroke="#34d399" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M54 34 L68 16" stroke="#34d399" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="-2" cy="14" r="4" fill="#34d399" />
            <circle cx="70" cy="14" r="4" fill="#34d399" />
            <path d="M24 58 L20 70 L27 74" stroke="#10b981" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M44 58 L48 70 L41 74" stroke="#10b981" strokeWidth="5" strokeLinecap="round" fill="none" />
            <line x1="34" y1="4" x2="34" y2="-4" stroke="#34d399" strokeWidth="2" />
            <circle cx="34" cy="-6" r="3.5" fill="#10b981" filter="url(#glow-green)" />
          </g>
          <text x="34" y="102" textAnchor="middle" fontSize="10" fill="#10b981" fontWeight="600" fontFamily="sans-serif">Pulse</text>
        </g>

        {/* ═══════════ FRONT ROW (4 agents, larger & closer) ═══════════ */}

        {/* ═══ NYX — coffee break ═══ */}
        <g transform="translate(20, 235) scale(1.35)" filter="url(#soft-shadow)">
          <ellipse cx="36" cy="82" rx="32" ry="9" fill="#1e293b" />
          <rect x="8" y="50" width="56" height="34" rx="11" fill="#1e293b" />
          <rect x="14" y="24" width="44" height="32" rx="11" fill="#a855f7" />
          <rect x="18" y="2" width="36" height="24" rx="10" fill="#c084fc" />
          <rect x="23" y="9" width="24" height="9" rx="4.5" fill="#0f172a" />
          <circle cx="30" cy="13.5" r="3" fill="#e9d5ff" />
          <circle cx="42" cy="13.5" r="3" fill="#e9d5ff" />
          <g className="svg-coffee-mug">
            <rect x="54" y="32" width="16" height="18" rx="5" fill="#78716c" />
            <path d="M70 37 Q77 37 77 44 Q77 51 70 51" stroke="#78716c" strokeWidth="2.5" fill="none" />
            <path d="M58 28 Q60 20 58 12" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.5" className="svg-steam svg-steam--1" />
            <path d="M63 30 Q65 22 63 14" stroke="#a78bfa" strokeWidth="1.5" fill="none" opacity="0.4" className="svg-steam svg-steam--2" />
            <path d="M68 28 Q70 20 68 12" stroke="#a78bfa" strokeWidth="1.2" fill="none" opacity="0.3" className="svg-steam svg-steam--3" />
          </g>
          <text x="4" y="6" fontSize="14" className="svg-note svg-note--1" opacity="0.5">♪</text>
          <text x="64" y="-4" fontSize="12" className="svg-note svg-note--2" opacity="0.4">♫</text>
          <line x1="36" y1="2" x2="36" y2="-5" stroke="#c084fc" strokeWidth="2" />
          <circle cx="36" cy="-7" r="3.5" fill="#a855f7" filter="url(#glow-purple)" />
          <text x="36" y="104" textAnchor="middle" fontSize="10" fill="#a855f7" fontWeight="600" fontFamily="sans-serif">Nyx</text>
        </g>

        {/* ═══ DILO — boss, center front ═══ */}
        <g transform="translate(160, 210) scale(1.5)" filter="url(#soft-shadow)">
          <g className="svg-agent-float" style={{ animationDelay: '0s' } as any}>
            <rect x="8" y="26" width="56" height="46" rx="15" fill="#3b82f6" />
            <rect x="12" y="2" width="48" height="30" rx="11" fill="#60a5fa" />
            {/* Crown */}
            <polygon points="36,-12 39,-4 47,-4 41,1 43,8 36,3 29,8 31,1 25,-4 33,-4" fill="#fbbf24" transform="scale(0.65) translate(20,-4)" className="svg-crown" />
            <rect x="18" y="10" width="36" height="12" rx="6" fill="#0f172a" />
            <circle cx="29" cy="16" r="3.5" fill="#bfdbfe" />
            <circle cx="43" cy="16" r="3.5" fill="#bfdbfe" />
            <path d="M29 24 Q36 29 43 24" stroke="#0f172a" strokeWidth="2" fill="none" />
            <path d="M8 42 L-8 33" stroke="#60a5fa" strokeWidth="6" strokeLinecap="round" />
            <path d="M64 42 L80 33" stroke="#60a5fa" strokeWidth="6" strokeLinecap="round" />
            <circle cx="-10" cy="31" r="5" fill="#60a5fa" />
            <circle cx="82" cy="31" r="5" fill="#60a5fa" />
            <rect x="18" y="70" width="12" height="18" rx="6" fill="#3b82f6" />
            <rect x="42" y="70" width="12" height="18" rx="6" fill="#3b82f6" />
            <line x1="36" y1="2" x2="36" y2="-5" stroke="#60a5fa" strokeWidth="2.5" />
            <circle cx="36" cy="-7" r="5" fill="#3b82f6" filter="url(#glow-blue)" />
          </g>
          <text x="36" y="104" textAnchor="middle" fontSize="11" fill="#3b82f6" fontWeight="700" fontFamily="sans-serif">Dilo</text>
        </g>

        {/* ═══ WRAITH — at monitor, contemplative ═══ */}
        <g transform="translate(310, 240) scale(1.35)" filter="url(#soft-shadow)">
          {/* Monitor */}
          <rect x="40" y="28" width="52" height="36" rx="6" fill="#0f172a" stroke="#6366f1" strokeWidth="1.2" strokeOpacity="0.3" />
          <rect x="60" y="64" width="12" height="10" fill="#1e293b" />
          <rect x="52" y="72" width="28" height="5" rx="2.5" fill="#1e293b" />
          <rect x="44" y="32" width="44" height="28" rx="4" fill="url(#sunset-grad)" />
          <circle cx="66" cy="44" r="7" fill="#fbbf24" opacity="0.6" />
          <g className="svg-agent-float" style={{ animationDelay: '0.6s' } as any}>
            <rect x="2" y="26" width="42" height="38" rx="12" fill="#6366f1" />
            <rect x="6" y="4" width="34" height="26" rx="9" fill="#818cf8" />
            <rect x="11" y="11" width="24" height="9" rx="4.5" fill="#0f172a" />
            <circle cx="18" cy="15.5" r="3" fill="#c7d2fe" />
            <circle cx="30" cy="15.5" r="3" fill="#c7d2fe" />
            <path d="M40 42 L48 36" stroke="#818cf8" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M2 46 L-6 56" stroke="#818cf8" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="23" y1="4" x2="23" y2="-2" stroke="#818cf8" strokeWidth="2" />
            <circle cx="23" cy="-4" r="3.5" fill="#6366f1" filter="url(#glow-indigo)" />
          </g>
          <text x="40" y="100" textAnchor="middle" fontSize="10" fill="#6366f1" fontWeight="600" fontFamily="sans-serif">Wraith</text>
        </g>

        {/* ═══ SPECTER — sleeping at desk ═══ */}
        <g transform="translate(430, 265) scale(1.35)" filter="url(#soft-shadow)">
          <rect x="-10" y="62" width="90" height="10" rx="4" fill="#1e293b" />
          {/* DO NOT DISTURB sign */}
          <g transform="translate(48, 38)">
            <rect x="0" y="0" width="32" height="16" rx="4" fill="#292524" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.5" />
            <text x="16" y="7" textAnchor="middle" fontSize="4" fill="#f59e0b" fontWeight="700" fontFamily="monospace">DO NOT</text>
            <text x="16" y="13" textAnchor="middle" fontSize="4" fill="#f59e0b" fontWeight="700" fontFamily="monospace">DISTURB</text>
          </g>
          <g className="svg-agent-sleep">
            <rect x="6" y="22" width="42" height="34" rx="12" fill="#f59e0b" />
            <g transform="rotate(-15 28 14)">
              <rect x="10" y="2" width="34" height="24" rx="9" fill="#fbbf24" />
              <rect x="15" y="10" width="24" height="8" rx="4" fill="#0f172a" />
              <line x1="20" y1="14" x2="25" y2="14" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" />
              <line x1="29" y1="14" x2="34" y2="14" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" />
            </g>
            <rect x="-2" y="48" width="18" height="6" rx="3" fill="#fbbf24" />
            <rect x="38" y="48" width="18" height="6" rx="3" fill="#fbbf24" />
            <line x1="28" y1="0" x2="28" y2="-5" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="28" cy="-7" r="3.5" fill="#f59e0b" filter="url(#glow-amber)" />
          </g>
          {/* Zzz */}
          <text x="56" y="4" fontSize="18" fill="#fbbf24" fontWeight="700" opacity="0.5" className="svg-zzz svg-zzz--1">z</text>
          <text x="68" y="-10" fontSize="14" fill="#fbbf24" fontWeight="700" opacity="0.35" className="svg-zzz svg-zzz--2">z</text>
          <text x="78" y="-22" fontSize="10" fill="#fbbf24" fontWeight="700" opacity="0.2" className="svg-zzz svg-zzz--3">z</text>
          <text x="28" y="88" textAnchor="middle" fontSize="10" fill="#f59e0b" fontWeight="600" fontFamily="sans-serif">Specter</text>
        </g>

        {/* ── Ambient dots ── */}
        <circle cx="80" cy="20" r="2" fill="#3b82f6" opacity="0.3" className="svg-ambient-dot" />
        <circle cx="300" cy="8" r="1.5" fill="#3b82f6" opacity="0.25" className="svg-ambient-dot" style={{ animationDelay: '1s' } as any} />
        <circle cx="490" cy="25" r="2" fill="#a855f7" opacity="0.2" className="svg-ambient-dot" style={{ animationDelay: '2s' } as any} />
        <circle cx="140" cy="420" r="1.5" fill="#06b6d4" opacity="0.3" className="svg-ambient-dot" style={{ animationDelay: '0.5s' } as any} />
        <circle cx="400" cy="410" r="2" fill="#f59e0b" opacity="0.2" className="svg-ambient-dot" style={{ animationDelay: '1.5s' } as any} />
      </svg>
    </div>
  );
}
