CREATE TABLE IF NOT EXISTS topic_counts (
  day TEXT NOT NULL,
  topic TEXT NOT NULL CHECK(topic IN ('Contact','Creative work','Education and background','Skills and learning','AI interests and goals','Projects and website','Splain story','Other')),
  questions INTEGER NOT NULL DEFAULT 0 CHECK(questions >= 0),
  PRIMARY KEY (day, topic)
);
CREATE VIEW IF NOT EXISTS top_topics AS
SELECT topic, SUM(questions) AS questions FROM topic_counts GROUP BY topic ORDER BY questions DESC, topic;
CREATE VIEW IF NOT EXISTS top_topics_30_days AS
SELECT topic, SUM(questions) AS questions FROM topic_counts WHERE day >= date('now', '-29 days') GROUP BY topic ORDER BY questions DESC, topic;
