CREATE TABLE IF NOT EXISTS game_play_sessions (
  game_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  played_at INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS game_play_sessions_game_date
ON game_play_sessions(game_id, played_at);
