CREATE TABLE game_plays (
  game_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  played_at INTEGER NOT NULL
);

CREATE INDEX game_plays_game_date
ON game_plays(game_id, played_at);
