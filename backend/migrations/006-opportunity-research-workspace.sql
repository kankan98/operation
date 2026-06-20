CREATE TABLE IF NOT EXISTS opportunity_research_entries (
  product_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'researching',
  priority TEXT NOT NULL DEFAULT 'medium',
  tags_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CHECK (status IN ('researching', 'watching', 'ready', 'rejected')),
  CHECK (priority IN ('low', 'medium', 'high')),
  CHECK (archived IN (0, 1)),
  CHECK (json_valid(tags_json)),
  CHECK (notes IS NULL OR length(notes) <= 2000)
);

CREATE INDEX IF NOT EXISTS idx_opportunity_research_status_archived
ON opportunity_research_entries(status, archived);

CREATE INDEX IF NOT EXISTS idx_opportunity_research_priority_archived
ON opportunity_research_entries(priority, archived);

CREATE INDEX IF NOT EXISTS idx_opportunity_research_updated_at
ON opportunity_research_entries(updated_at DESC);
