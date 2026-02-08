export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'OPENAI_API_KEY not set' }, { status: 503 });
  }

  try {
    const { nameA, roleA, nameB, roleB } = await req.json();
    if (!nameA || !nameB) {
      return Response.json({ error: 'missing agent names' }, { status: 400 });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 100,
        temperature: 0.9,
        messages: [
          {
            role: 'system',
            content:
              'You generate short, natural office banter between AI agents who work together. They are coworkers in a virtual AI office. Keep it casual, witty, and under 15 words each. Reply ONLY with JSON: {"lineA":"...","lineB":"..."}',
          },
          {
            role: 'user',
            content: `${nameA} (${roleA || 'Agent'}) starts a quick chat with ${nameB} (${roleB || 'Agent'}). One line each.`,
          },
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

    // Parse the JSON from the model response
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
