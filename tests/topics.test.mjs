import test from 'node:test';
import assert from 'node:assert/strict';
import { topicFor, countTopic } from '../backend/topics.mjs';
test('classifies questions into fixed categories', () => {
  for (const [question, topic] of [
    ['How can I contact John?', 'Contact'], ['Tell me about TikTok edits', 'Creative work'],
    ['Where does John study?', 'Education and background'], ['What languages does he know?', 'Skills and learning'],
    ['Why does AI safety interest him?', 'AI interests and goals'], ['Show me his projects', 'Projects and website'],
    ['When was Splain born?', 'Splain story'], ['Hello there', 'Other'],
  ]) assert.equal(topicFor(question), topic);
});
test('stores date and category only, never raw question text', async () => {
  let stored;
  const db = { prepare: () => ({ bind: (...values) => { stored = values; return { run: async () => ({ success: true }) }; } }) };
  await countTopic(db, 'Email me: someone@example.com. How can I contact John?', new Date('2026-10-04T23:45:00Z'));
  assert.deepEqual(stored, ['2026-10-04', 'Contact']);
  await countTopic(undefined, 'No configured statistics');
});
