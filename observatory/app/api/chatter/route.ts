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
        max_tokens: 200,
        temperature: 0.95,
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
  const base = `You write dialogue for AI agents in a virtual office. Each agent has a personality ("soul"). Lines MUST match their personality — blunt agents are blunt, terse agents are terse, verbose agents are verbose.

Critical rules:
- Each line 8-25 words. Not shorter.
- REFERENCE SPECIFICS from the situation: task names, data points, findings, numbers, tool names. Never say "I'm fine" or "all good" — always mention WHAT you're working on or WHY.
- Agents share real opinions, findings, or pushback. They don't just acknowledge — they ADD something.
- No emojis, no hashtags, no pleasantries like "Hey" or "Thanks"
- Reply ONLY with JSON: {"lineA":"...","lineB":"..."}

Bad example (generic, says nothing):
{"lineA":"Need help with that?","lineB":"No thanks, I'm fine."}

Good example (specific, moves the conversation forward):
{"lineA":"The competitor pricing data has three gaps in Q3. Want me to fill those?","lineB":"Take the European markets. I'll cross-reference the US figures against last quarter."}`;

  const typeHints: Record<string, string> = {
    help_offer: `\nType: HELP OFFER. A offers to help B who is busy. B should almost always ACCEPT and give A a specific sub-task. B only declines if they mention exactly what they're finishing and why help isn't needed. Even declines must be substantive.`,
    task_handoff: `\nType: HANDOFF. A finished their part and passes to B. A must mention a specific finding or result. B acknowledges with what they'll do next — not just "got it."`,
    react_to_done: `\nType: REACTION. B just finished a task. A comments on it with a specific question, challenge, or observation about the work. B responds with a concrete detail about what they found.`,
    idle_chat: `\nType: IDLE CHAT. Both agents are between tasks. They discuss something specific: a pattern they noticed, something that needs attention, a question about another agent's recent work, or a mini-debate. NOT small talk.`,
    status_check: `\nType: STATUS CHECK. A asks B for a progress update. B gives specifics: what step they're on, what they found so far, what's left. A follows up with a relevant observation or question.`,
  };

  return base + (typeHints[type || ''] || '\nType: Brief work exchange. Both agents must reference something specific about current work.');
}

function buildUserPrompt(p: {
  nameA: string; roleA?: string; soulA?: string;
  nameB: string; roleB?: string; soulB?: string;
  context?: string; type?: string;
}): string {
  let prompt = `${p.nameA} (${p.roleA || 'agent'})`;
  if (p.soulA) prompt += ` — personality: ${p.soulA}`;

  prompt += `\n${p.nameB} (${p.roleB || 'agent'})`;
  if (p.soulB) prompt += ` — personality: ${p.soulB}`;

  if (p.context) prompt += `\n\nSituation:\n${p.context}`;

  prompt += '\n\nWrite one line for each agent. Use specifics from the situation above. Both lines must reference concrete details (task names, data, findings).';
  return prompt;
}
