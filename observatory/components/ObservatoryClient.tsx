'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { initOffice } from '../lib/office-engine';
import TerminalPane from './TerminalPane';
import PromptBar from './PromptBar';

function useIsIframe() {
  const [isIframe, setIsIframe] = useState(false);
  useEffect(() => {
    try { setIsIframe(window.self !== window.top); } catch { setIsIframe(true); }
  }, []);
  return isIframe;
}

const COOLDOWN_MS = 5 * 60 * 1000;

type EventPayload = {
  ts?: number;
  text?: string;
};

export default function ObservatoryClient() {
  const isIframe = useIsIframe();
  const [lines, setLines] = useState<string[]>([]);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [since, setSince] = useState(0);
  const engineRef = useRef<ReturnType<typeof initOffice> | null>(null);

  const containerId = `office-${useId()}`;

  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const engine = initOffice(el, {
      onTerminalLine: (line) => setLines((prev) => [...prev, line].slice(-200)),
    });
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [containerId]);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/events?since=${since}&limit=200`);
        if (!res.ok) return;
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
            return next.slice(-200);
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
      if (active) setTimeout(poll, document.hidden ? 5000 : 2000);
    };

    poll();
    return () => {
      active = false;
    };
  }, [since]);

  const onSend = async (text: string) => {
    const res = await fetch('/api/prompt', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.ok) setLastSentAt(Date.now());
  };

  return (
    <>
      <section className="obs-main">
        <div className="obs-canvas" id={containerId} />
        <TerminalPane lines={lines} />
      </section>
      {!isIframe && <PromptBar onSend={onSend} cooldownMs={COOLDOWN_MS} lastSentAt={lastSentAt} />}
    </>
  );
}
