function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

function validGameId(gameId) {
  return /^[a-zA-Z0-9_-]{1,100}$/.test(gameId);
}

export async function onRequestPost(context) {
  const gameId = context.params.gameId;
  if (!validGameId(gameId)) return json({ error: 'Invalid game ID' }, 400);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const visitorId = String(body.visitorId || '');
  if (!/^[a-zA-Z0-9]{20,100}$/.test(visitorId)) {
    return json({ error: 'Invalid visitor ID' }, 400);
  }

  const durationSeconds = Math.floor(Number(body.durationSeconds) || 0);
  const now = Math.floor(Date.now() / 1000);
  const statDate = new Date(now * 1000).toISOString().slice(0, 10);
  if (durationSeconds > 0) {
    if (durationSeconds > 60 * 60 * 3) return json({ error: 'Invalid duration' }, 400);
    await context.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS game_play_sessions (
        game_id TEXT NOT NULL,
        visitor_id TEXT NOT NULL,
        played_at INTEGER NOT NULL,
        duration_seconds INTEGER NOT NULL
      )
    `).run();
    await context.env.DB.prepare(`
      INSERT INTO game_play_sessions (game_id, visitor_id, played_at, duration_seconds)
      VALUES (?, ?, ?, ?)
    `).bind(gameId, visitorId, now, durationSeconds).run();
    await context.env.DB.prepare(`
      INSERT INTO game_daily_stats (stat_date, game_id, duration_seconds)
      VALUES (?, ?, ?)
      ON CONFLICT(stat_date, game_id) DO UPDATE SET duration_seconds = duration_seconds + excluded.duration_seconds
    `).bind(statDate, gameId, durationSeconds).run();
    return json({ success: true });
  }

  await context.env.DB.prepare(`
    INSERT INTO game_plays (game_id, visitor_id, played_at)
    VALUES (?, ?, ?)
  `).bind(gameId, visitorId, now).run();
  await context.env.DB.prepare(`
    INSERT INTO game_daily_stats (stat_date, game_id, plays)
    VALUES (?, ?, 1)
    ON CONFLICT(stat_date, game_id) DO UPDATE SET plays = plays + 1
  `).bind(statDate, gameId).run();
  await context.env.DB.prepare(`
    INSERT OR IGNORE INTO daily_active_visitors (stat_date, visitor_id) VALUES (?, ?)
  `).bind(statDate, visitorId).run();

  return json({ success: true });
}

export async function onRequestGet(context) {
  const gameId = context.params.gameId;
  if (!validGameId(gameId)) return json({ error: 'Invalid game ID' }, 400);

  const cutoff = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
  const result = await context.env.DB.prepare(`
    SELECT COUNT(*) AS players
    FROM game_plays
    WHERE game_id = ? AND played_at >= ?
  `).bind(gameId, cutoff).first();

  return json({ gameId, players: result?.players || 0 });
}
