'use client';

import { useEffect, useRef } from 'react';

type Props = {
  lines: string[];
};

export default function TerminalPane({ lines }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  return (
    <div className="obs-terminal">
      <div className="terminal-lines" ref={ref}>
        {lines.map((line, idx) => (
          <div className="terminal-line" key={`${idx}-${line}`}>{line}</div>
        ))}
      </div>
    </div>
  );
}
