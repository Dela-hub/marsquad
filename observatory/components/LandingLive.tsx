'use client';

import RoomFeed from './RoomFeed';
import type { AgentConfig } from '../lib/types';

const MARSQUAD_AGENTS: AgentConfig[] = [
  { id: 'dilo',    name: 'Dilo',    role: 'Lead',  desc: 'Primary orchestrator. Breaks down missions, delegates, and oversees delivery.',           color: '#3b82f6', avatar: '🤖' },
  { id: 'phantom', name: 'Phantom', role: 'Ops',   desc: 'Execution engine. Runs tools, manages infrastructure, handles deployments.',               color: '#f43f5e', avatar: '👻' },
  { id: 'nyx',     name: 'Nyx',     role: 'Intel', desc: 'Intelligence & monitoring. Watches signals, scrapes data, tracks market shifts.',           color: '#a855f7', avatar: '🔮' },
  { id: 'cipher',  name: 'Cipher',  role: 'Data',  desc: 'Security & data analysis. Encrypts, validates, and crunches numbers.',                     color: '#06b6d4', avatar: '🔐' },
  { id: 'pulse',   name: 'Pulse',   role: 'Comms', desc: 'Data analyst for stocks and trends. Surfaces patterns and delivers insights.',              color: '#10b981', avatar: '📡' },
  { id: 'wraith',  name: 'Wraith',  role: 'QA',    desc: 'Quality & red-team. Tests every output, catches hallucinations, stress-tests claims.',      color: '#6366f1', avatar: '👁' },
  { id: 'specter', name: 'Specter', role: 'Copy',  desc: 'Communications & copy. Drafts messages, writes content, polishes deliverables.',            color: '#f59e0b', avatar: '✍️' },
];

export default function LandingLive() {
  return <RoomFeed roomId="marsquad" agents={MARSQUAD_AGENTS} roomName="Marsquad" variant="full" showAgents={false} />;
}
