# Ask Splain topic statistics

Daily counts start when this feature is deployed. They cannot reconstruct past questions. There is no chat archive or visitor tracking: the database has only UTC day, a fixed topic label and a count. Cloudflare still processes chat messages for AI inference as disclosed in the widget.

Open Cloudflare → Storage & databases → D1 → `splain-topic-statistics` → Console. Run `SELECT * FROM top_topics;` for all-time rankings or `SELECT * FROM top_topics_30_days;` for the last 30 UTC dates including today. Explore Data also provides the daily `topic_counts` table.

Questions count only after an AI reply succeeds. Each question is classified locally into one category using keywords, with precedence: Contact, Creative work, Education and background, Skills and learning, AI interests and goals, Projects and website, Splain story, Other. Mixed questions use the first matching category. Short follow-ups and unfamiliar wording may fall under Other. Counts represent answered questions, not unique visitors; bots and owner tests can contribute. Preview deployments do not write production counts.

No raw question, response, IP, cookie, session ID, email or individual timestamp is bound to a statistics query. Count updates use an atomic SQL upsert. Database failures do not interrupt chat; a fixed warning is emitted without message content. There is no public statistics endpoint. Access follows the owner's existing Cloudflare account permissions.

The schema is in `backend/statistics-schema.sql`. Daily aggregate counts are retained until the owner removes them. Request rate limiting continues to use shared IP counters transiently; these are separate from topic statistics.
