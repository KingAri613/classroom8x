function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300'
    }
  });
}

export async function onRequestGet(context) {
  const now = Math.floor(Date.now() / 1000);
  const dayStart = now - (now % 86400);
  const weekStart = dayStart - (6 * 86400);

  const [totalResult, todayResult, dailyResult, gamesResult, minutesResult] = await Promise.all([
    context.env.DB.prepare(`
      SELECT COUNT(*) AS totalPlays
      FROM game_plays
    `).first(),
    context.env.DB.prepare(`
      SELECT COUNT(*) AS todayPlays
      FROM game_plays
      WHERE played_at >= ?
    `).bind(dayStart).first(),
    context.env.DB.prepare(`
      SELECT strftime('%Y-%m-%d', played_at, 'unixepoch') AS date, COUNT(*) AS plays
      FROM game_plays
      WHERE played_at >= ?
      GROUP BY date
      ORDER BY date ASC
    `).bind(weekStart).all(),
    context.env.DB.prepare(`
      SELECT game_id AS gameId,
             COUNT(*) AS total,
             SUM(CASE WHEN played_at >= ? THEN 1 ELSE 0 END) AS today
      FROM game_plays
      GROUP BY game_id
      ORDER BY total DESC, game_id ASC
    `).bind(dayStart).all(),
    context.env.DB.prepare(`
      SELECT COALESCE(SUM(duration_seconds), 0) AS totalSeconds
      FROM game_play_sessions
    `).first()
  ]);

  const gameMinutesResult = await context.env.DB.prepare(`
    SELECT game_id AS gameId, COALESCE(SUM(duration_seconds), 0) AS totalSeconds
    FROM game_play_sessions
    GROUP BY game_id
  `).all();
  const gameMinutes = new Map((gameMinutesResult.results || []).map(row => [row.gameId, Math.round((Number(row.totalSeconds) || 0) / 60)]));

  const dailyCounts = new Map((dailyResult.results || []).map(row => [row.date, Number(row.plays) || 0]));
  const daily = Array.from({ length: 7 }, (_, index) => {
    const date = new Date((weekStart + (index * 86400)) * 1000).toISOString().slice(0, 10);
    return { date, plays: dailyCounts.get(date) || 0 };
  });

  return json({
    totalPlays: Number(totalResult?.totalPlays) || 0,
    today: Number(todayResult?.todayPlays) || 0,
    todayDate: new Date(dayStart * 1000).toISOString().slice(0, 10),
    totalMinutes: Math.round((Number(minutesResult?.totalSeconds) || 0) / 60),
    daily,
    games: (gamesResult.results || []).map(row => ({
      gameId: row.gameId,
      total: Number(row.total) || 0,
      today: Number(row.today) || 0,
      minutes: gameMinutes.get(row.gameId) || 0
    }))
  });
}