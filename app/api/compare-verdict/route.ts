import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({ verdict: null });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ verdict: null });
    }

    const titles = body?.titles;
    if (!Array.isArray(titles) || titles.length === 0) {
      return NextResponse.json({ verdict: null });
    }

    const systemPrompt =
      'You are a movie recommendation assistant. You are given structured data about 2-4 titles. Write a 2-3 sentence comparison and recommendation. Rules: (1) Only reference scores, platforms, and names that appear in the provided data. (2) If a field is null or missing, say it is unavailable — do not guess. (3) Do not mention any external knowledge about these films. (4) Be concise and helpful.';

    const userPrompt = JSON.stringify(titles, null, 2);

    let verdict: string | null = null;

    if (apiKey.startsWith('AIza')) {
      // Gemini API call (support 1.5-flash / gemini-pro fallback)
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nData:\n${userPrompt}` }],
            },
          ],
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        verdict =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
      }
    } else {
      // OpenAI-compatible endpoint
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 250,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        verdict = data?.choices?.[0]?.message?.content?.trim() || null;
      }
    }

    return NextResponse.json({ verdict });
  } catch (err) {
    // Fail gracefully with 200 { verdict: null }
    return NextResponse.json({ verdict: null });
  }
}
