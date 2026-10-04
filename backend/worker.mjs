import { systemPrompt } from './knowledge.mjs';
const json = (data, status = 200, extra = {}) => Response.json(data, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra },
});
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/ask-splain') return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405, { Allow: 'POST' });
    if (request.headers.get('Origin') !== url.origin) return json({ error: 'Origin not allowed.' }, 403);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'JSON required.' }, 415);
    if (!env.AI || !env.ASK_LIMITER || !env.ASK_TOTAL_LIMITER) return json({ error: 'Assistant is not configured.' }, 503);
    let raw = '';
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Body required.' }, 400);
    let bytes = 0;
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 16000) { await reader.cancel(); return json({ error: 'Message too large.' }, 413); }
        raw += decoder.decode(value, { stream: true });
      }
      raw += decoder.decode();
    } catch { return json({ error: 'Invalid request body.' }, 400); }
    let messages;
    try { messages = JSON.parse(raw).messages; } catch { return json({ error: 'Invalid JSON.' }, 400); }
    if (!Array.isArray(messages) || !messages.length || messages.length > 9 ||
        messages.some((m, i) => !m || m.role !== (i % 2 ? 'assistant' : 'user') || typeof m.content !== 'string' || !m.content.trim() || m.content.length > (m.role === 'user' ? 600 : 2400)) ||
        messages.at(-1).role !== 'user') return json({ error: 'Invalid conversation.' }, 400);
    try {
      // IP limits may be shared by visitors on the same network. Counters are regional,
      // eventually consistent safeguards, not a strict account spending cap.
      const visitor = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (!(await env.ASK_LIMITER.limit({ key: `ask:${visitor}` })).success ||
          !(await env.ASK_TOTAL_LIMITER.limit({ key: 'ask:all' })).success) {
        return json({ error: 'Please try again in a minute.' }, 429, { 'Retry-After': '60' });
      }
      const result = await env.AI.run('@cf/google/gemma-4-26b-a4b-it', {
        messages: [{ role: 'system', content: systemPrompt }, ...messages.map(({ role, content }) => ({ role, content }))],
        max_tokens: 350,
        chat_template_kwargs: { enable_thinking: false },
      });
      const answer = result.choices?.[0]?.message?.content || result.response;
      if (typeof answer !== 'string' || !answer.trim()) return json({ error: 'No reply received.' }, 502);
      return json({ answer: answer.trim().slice(0, 2400) });
    } catch { return json({ error: 'Assistant temporarily unavailable.' }, 503); }
  },
};
