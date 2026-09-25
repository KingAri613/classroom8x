CREATE TABLE IF NOT EXISTS game_daily_stats (
  stat_date TEXT NOT NULL,
  game_id TEXT NOT NULL,
  plays INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (stat_date, game_id)
);

CREATE TABLE IF NOT EXISTS daily_active_visitors (
  stat_date TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  PRIMARY KEY (stat_date, visitor_id)
);

CREATE INDEX IF NOT EXISTS game_daily_stats_game_date
ON game_daily_stats(game_id, stat_date);

INSERT INTO game_daily_stats (stat_date, game_id, plays)
SELECT strftime('%Y-%m-%d', played_at, 'unixepoch'), game_id, COUNT(*)
FROM game_plays
GROUP BY strftime('%Y-%m-%d', played_at, 'unixepoch'), game_id
ON CONFLICT(stat_date, game_id) DO UPDATE SET plays = excluded.plays;

INSERT INTO game_daily_stats (stat_date, game_id, duration_seconds)
SELECT strftime('%Y-%m-%d', played_at, 'unixepoch'), game_id, SUM(MIN(duration_seconds, 10800))
FROM game_play_sessions
GROUP BY strftime('%Y-%m-%d', played_at, 'unixepoch'), game_id
ON CONFLICT(stat_date, game_id) DO UPDATE SET duration_seconds = excluded.duration_seconds;

INSERT OR IGNORE INTO daily_active_visitors (stat_date, visitor_id)
SELECT strftime('%Y-%m-%d', played_at, 'unixepoch'), visitor_id
FROM game_plays;