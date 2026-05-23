-- two small tables; the second CREATE TABLE is intentionally missing a
-- trailing semicolon so the parser's paren-depth fix is exercised.

CREATE TABLE leads (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  slug TEXT
)
