'use client';

import { useState } from 'react';

type Props = {
  onSend: (text: string) => Promise<void>;
  cooldownMs: number;
  lastSentAt: number | null;
};

export default function PromptBar({ onSend, cooldownMs, lastSentAt }: Props) {
  const [text, setText] = useState('');
  const now = Date.now();
  const remaining = lastSentAt ? Math.max(0, cooldownMs - (now - lastSentAt)) : 0;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || remaining > 0) return;
    await onSend(trimmed);
    setText('');
  };

  return (
    <form className="obs-prompt" onSubmit={onSubmit}>
      <input
        type="text"
        placeholder={remaining > 0 ? `Cooldown ${Math.ceil(remaining / 1000)}s` : 'Send a prompt'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={remaining > 0}
      />
      <button type="submit" disabled={remaining > 0 || !text.trim()}>
        Send
      </button>
    </form>
  );
}
