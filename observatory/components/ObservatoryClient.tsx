'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { initOffice } from '../lib/office-engine';
import TerminalPane from './TerminalPane';

type EventPayload = {
  ts?: number;
  text?: string;
};

export default function ObservatoryClient() {
  const [lines, setLines] = useState<string[]>([]);
  const [since, setSince] = useState(0);
  const engineRef = useRef<ReturnType<typeof initOffice> | null>(null);

  const containerId = `office-${useId()}`;

  // Detect mobile once
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mm = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mm.matches);
    update();
    mm.addEventListener?.('change', update);
    return () => mm.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const maxLines = isMobile ? 80 : 200;
    const engine = initOffice(el, {
      onTerminalLine: (line) => setLines((prev) => [...prev, line].slice(-maxLines)),
    });
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [containerId, isMobile]);

  // Event polling — use ref for `since` to avoid re-creating effect on every poll
  const sinceRef = useRef(since);
  sinceRef.current = since;

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const maxLines = isMobile ? 80 : 200;
    const interval = () => isMobile ? 6000 : (document.hidden ? 5000 : 2000);
    const fetchLimit = isMobile ? 50 : 200;

    const poll = async () => {
      try {
        const res = await fetch(`/api/events?since=${sinceRef.current}&limit=${fetchLimit}`);
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active || !Array.isArray(data.events)) return;
        const events = data.events as EventPayload[];
        if (events.length) {
          setSince(events[events.length - 1].ts || Date.now());
          setLines((prev) => {
            const next = [...prev];
            for (const event of events) {
              if (event.text) next.push(event.text);
            }
            return next.slice(-maxLines);
          });
          const engine = engineRef.current;
          if (engine) {
            for (const event of events) {
              engine.handleEvent(event);
            }
          }
        }
      } catch {
        // ignore polling errors
      }
      if (active) timer = setTimeout(poll, interval());
    };

    poll();
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [isMobile]); // stable deps — sinceRef avoids `since` dep

  return (
    <section className="obs-main">
      <div className="obs-canvas" id={containerId} />
      <TerminalPane lines={lines} />
    </section>
  );
}
