export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'OPENAI_API_KEY not set' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { nameA, roleA, soulA, nameB, roleB, soulB, context, type } = body;
    if (!nameA || !nameB) {
      return Response.json({ error: 'missing agent names' }, { status: 400 });
    }

    const system = buildSystemPrompt(type);
    const user = buildUserPrompt({ nameA, roleA, soulA, nameB, roleB, soulB, context, type });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 150,
        temperature: 0.9,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return Response.json({ error: `OpenAI ${res.status}: ${txt.slice(0, 200)}` }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return Response.json({ error: 'empty response' }, { status: 502 });
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: 'bad format' }, { status: 502 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return Response.json({ lineA: parsed.lineA, lineB: parsed.lineB });
  } catch (e: any) {
    return Response.json({ error: e.message || 'chatter failed' }, { status: 500 });
  }
}

function buildSystemPrompt(type?: string): string {
  const base = `You generate dialogue between AI agents in a virtual office. Each agent has a distinct personality (their "soul"). Their lines MUST sound like their personality — a blunt agent is blunt, a terse agent is terse, a verbose agent is verbose. Never generic.

Rules:
- Each line max 20 words
- No emojis, no hashtags
- Sound like real coworkers, not chatbots
- Reply ONLY with JSON: {"lineA":"...","lineB":"..."}`;

  const typeHints: Record<string, string> = {
    help_offer: '\nContext: Agent A is offering to help Agent B who is busy. B either accepts or declines based on their workload.',
    task_handoff: '\nContext: Agent A finished their part and is handing work to Agent B. B acknowledges in their style.',
    react_to_done: '\nContext: Agent A just finished a task. Agent B (idle) reacts or comments on it.',
    idle_chat: '\nContext: Both agents are idle. Brief natural exchange — could be about work, team, or nothing.',
    status_check: '\nContext: Agent A checks on Agent B\'s progress. B gives a quick update.',
  };

  return base + (typeHints[type || ''] || '\nContext: Brief office exchange between coworkers.');
}

function buildUserPrompt(p: {
  nameA: string; roleA?: string; soulA?: string;
  nameB: string; roleB?: string; soulB?: string;
  context?: string; type?: string;
}): string {
  let prompt = `${p.nameA}`;
  if (p.soulA) prompt += ` [personality: ${p.soulA}]`;
  else if (p.roleA) prompt += ` (${p.roleA})`;

  prompt += ` speaks to ${p.nameB}`;
  if (p.soulB) prompt += ` [personality: ${p.soulB}]`;
  else if (p.roleB) prompt += ` (${p.roleB})`;

  prompt += '.';

  if (p.context) prompt += ` Situation: ${p.context}`;

  prompt += ' One line each.';
  return prompt;
}
