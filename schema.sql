CREATE TABLE game_plays (
  game_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  played_at INTEGER NOT NULL
);

CREATE INDEX game_plays_game_date
ON game_plays(game_id, played_at);

CREATE TABLE game_play_sessions (
  game_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  played_at INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL
);

CREATE INDEX game_play_sessions_game_date
ON game_play_sessions(game_id, played_at);
