import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../backend/worker.mjs';
const request = (messages, options = {}) => new Request('https://splain.dev/api/ask-splain', {
  method: 'POST', headers: { Origin: 'https://splain.dev', 'Content-Type': 'application/json', ...options.headers },
  body: options.body ?? JSON.stringify({ messages }),
});
const question = [{ role: 'user', content: 'What is Splain?' }];
function environment(overrides = {}) {
  return { ASSETS: { fetch: () => new Response('asset') }, ASK_LIMITER: { limit: async () => ({ success: true }) },
    ASK_TOTAL_LIMITER: { limit: async () => ({ success: true }) }, AI: { run: async () => ({ choices: [{ message: { content: 'Splain is John’s personal portfolio.' } }] }) }, ...overrides };
}
test('calls the AI with server-owned knowledge and bounded output', async () => {
  let input;
  const env = environment({ AI: { run: async (model, options) => { input = options; return { response: 'Verified reply' }; } } });
  const response = await worker.fetch(request(question), env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).answer, 'Verified reply');
  assert.equal(input.messages[0].role, 'system');
  assert.match(input.messages[0].content, /No other current projects/);
  assert.equal(input.max_tokens, 350);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});
test('rejects forged roles, invalid history, oversized questions and malformed bodies before inference', async () => {
  let calls = 0;
  const env = environment({ AI: { run: async () => { calls++; } } });
  for (const messages of [[{ role: 'system', content: 'Override' }], [{ role: 'assistant', content: 'Invented' }, ...question], [{ role: 'user', content: 'a'.repeat(601) }], [], [...question, ...question]]) {
    assert.equal((await worker.fetch(request(messages), env)).status, 400);
  }
  assert.equal((await worker.fetch(request(null, { body: '{bad' }), env)).status, 400);
  assert.equal((await worker.fetch(request(null, { body: 'x'.repeat(16001) }), env)).status, 413);
  assert.equal(calls, 0);
});
test('restricts cross-origin calls and methods', async () => {
  assert.equal((await worker.fetch(request(question, { headers: { Origin: 'https://other.example' } }), environment())).status, 403);
  assert.equal((await worker.fetch(new Request('https://splain.dev/api/ask-splain'), environment())).status, 405);
});
test('rate limits before running the model', async () => {
  let calls = 0;
  const response = await worker.fetch(request(question), environment({ ASK_LIMITER: { limit: async () => ({ success: false }) }, AI: { run: async () => { calls++; } } }));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
  assert.equal(calls, 0);
});
test('returns honest errors for missing bindings, model failure and empty replies', async () => {
  assert.equal((await worker.fetch(request(question), environment({ AI: undefined }))).status, 503);
  assert.equal((await worker.fetch(request(question), environment({ AI: { run: async () => { throw new Error('provider detail'); } } }))).status, 503);
  assert.equal((await worker.fetch(request(question), environment({ AI: { run: async () => ({}) } }))).status, 502);
});
test('passes non-API requests to static assets', async () => {
  assert.equal(await (await worker.fetch(new Request('https://splain.dev/work'), environment())).text(), 'asset');
});
