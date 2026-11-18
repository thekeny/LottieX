CREATE TABLE IF NOT EXISTS sessions (
    token_hash bytea PRIMARY KEY,
    expires_at timestamptz NOT NULL DEFAULT now() + interval '1 day'
);

CREATE TABLE IF NOT EXISTS notes (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    body text NOT NULL,
    filename text,
    attachment bytea
);

CREATE TABLE IF NOT EXISTS demo_migrations (
    version integer PRIMARY KEY
);

WITH migration AS (
    INSERT INTO demo_migrations (version) VALUES (1)
    ON CONFLICT DO NOTHING
    RETURNING version
)
INSERT INTO notes (title, body)
SELECT 'First note', 'This note is stored in PostgreSQL.'
FROM migration;
