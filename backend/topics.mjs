// Only these fixed labels and a UTC date can reach the statistics database.
const rules = [
  ['Contact', /\b(contact|email|linkedin|reach|hire|hiring|available|availability|collaborat\w*|cv|resume)\b/i],
  ['Creative work', /\b(tiktok|gvrnr|after effects|video|videos|edit|edits|editing|followers)\b/i],
  ['Education and background', /\b(education|college|school|stud\w*|level 3|background|niger\w*|england|reading|berkshire|age|old|live|based|move\w*)\b/i],
  ['Skills and learning', /\b(skills?|learn\w*|react\w*|gsap|python|html|css|javascript|languages?|hardware|gpu|storage|challenges?|focus|motiv\w*)\b/i],
  ['AI interests and goals', /\b(ai|agi|superintelligence|openai|engineer\w*|safety|ambitions?|goals?|agent|company|inspir\w*)\b/i],
  ['Projects and website', /\b(project\w*|portfolio|website|built|build|webgl|logo|particles?|version|v2|github|work)\b/i],
  ['Splain story', /\b(splain|studio|name|born|started|origin|brand|meaning)\b/i],
];
export function topicFor(question) {
  return rules.find(([, pattern]) => pattern.test(question))?.[0] || 'Other';
}
export async function countTopic(db, question, now = new Date()) {
  if (!db) return;
  const day = now.toISOString().slice(0, 10);
  await db.prepare('INSERT INTO topic_counts (day, topic, questions) VALUES (?, ?, 1) ON CONFLICT(day, topic) DO UPDATE SET questions = questions + 1')
    .bind(day, topicFor(question)).run();
}
