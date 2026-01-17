CREATE TABLE memory (
  id INTEGER PRIMARY KEY,
  type TEXT,
  content TEXT,
  embedding BLOB,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
