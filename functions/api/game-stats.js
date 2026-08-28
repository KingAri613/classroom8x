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
  const range = new URL(context.request.url).searchParams.get('range') || 'week';
  const rangeStart = range === 'today' ? dayStart : range === 'month' ? dayStart - (29 * 86400) : range === 'all' ? 0 : dayStart - (6 * 86400);

  const [totalResult, todayResult, dailyResult, gamesResult] = await Promise.all([
    context.env.DB.prepare(`
      SELECT COUNT(*) AS totalPlays,
             SUM(CASE WHEN played_at >= ? THEN 1 ELSE 0 END) AS periodPlays
      FROM game_plays
    `).bind(rangeStart).first(),
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
    `).bind(rangeStart).all(),
    context.env.DB.prepare(`
      SELECT game_id AS gameId,
             COUNT(*) AS total,
             SUM(CASE WHEN played_at >= ? THEN 1 ELSE 0 END) AS today,
             SUM(CASE WHEN played_at >= ? THEN 1 ELSE 0 END) AS period
      FROM game_plays
      GROUP BY game_id
      ORDER BY total DESC, game_id ASC
    `).bind(dayStart, rangeStart).all()
  ]);

  let minutesResult = null;
  let gameMinutesResult = { results: [] };
  try {
    [minutesResult, gameMinutesResult] = await Promise.all([
      context.env.DB.prepare(`
        SELECT COALESCE(SUM(duration_seconds), 0) AS totalSeconds
        FROM game_play_sessions
      `).first(),
      context.env.DB.prepare(`
        SELECT game_id AS gameId, COALESCE(SUM(duration_seconds), 0) AS totalSeconds
        FROM game_play_sessions
        GROUP BY game_id
      `).all()
    ]);
  } catch (error) {
    console.warn('game_play_sessions is unavailable; returning zero minutes', error);
  }
  const gameMinutes = new Map((gameMinutesResult.results || []).map(row => [row.gameId, Math.round((Number(row.totalSeconds) || 0) / 6) / 10]));

  const dailyCounts = new Map((dailyResult.results || []).map(row => [row.date, Number(row.plays) || 0]));
  const daily = range === 'all'
    ? [...dailyCounts.entries()].map(([date, plays]) => ({ date, plays }))
    : [];
  if (range !== 'all') {
    for (let timestamp = rangeStart; timestamp <= dayStart; timestamp += 86400) {
      const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
      daily.push({ date, plays: dailyCounts.get(date) || 0 });
    }
  }

  return json({
    totalPlays: Number(totalResult?.totalPlays) || 0,
    periodPlays: Number(totalResult?.periodPlays) || 0,
    today: Number(todayResult?.todayPlays) || 0,
    todayDate: new Date(dayStart * 1000).toISOString().slice(0, 10),
    totalMinutes: Math.round((Number(minutesResult?.totalSeconds) || 0) / 6) / 10,
    daily,
    games: (gamesResult.results || []).map(row => ({
      gameId: row.gameId,
      total: Number(row.total) || 0,
      today: Number(row.today) || 0,
      period: Number(row.period) || 0,
      minutes: gameMinutes.get(row.gameId) || 0
    }))
  });
}