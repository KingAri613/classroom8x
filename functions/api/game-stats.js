function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=60' } });
}

export async function onRequestGet(context) {
  const now = Math.floor(Date.now() / 1000);
  const dayStart = now - (now % 86400);
  const range = new URL(context.request.url).searchParams.get('range') || 'week';
  const rangeDays = range === 'today' ? 0 : range === 'month' ? 29 : range === 'all' ? null : 6;
  const startDate = rangeDays === null ? '0000-01-01' : new Date((dayStart - rangeDays * 86400) * 1000).toISOString().slice(0, 10);
  const todayDate = new Date(dayStart * 1000).toISOString().slice(0, 10);
  const result = await context.env.DB.prepare(`SELECT stat_date AS date, game_id AS gameId, plays, duration_seconds AS durationSeconds FROM game_daily_stats WHERE stat_date >= ? ORDER BY stat_date ASC, plays DESC`).bind(startDate).all();
  const dailyMap = new Map();
  const games = new Map();
  let totalPlays = 0;
  let totalSeconds = 0;
  let today = 0;
  (result.results || []).forEach(row => {
    const plays = Number(row.plays) || 0;
    const seconds = Math.min(Number(row.durationSeconds) || 0, 60 * 60 * 3);
    totalPlays += plays;
    totalSeconds += seconds;
    if (row.date === todayDate) today += plays;
    dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + plays);
    const game = games.get(row.gameId) || { gameId: row.gameId, total: 0, today: 0, period: 0, minutes: 0 };
    game.total += plays;
    game.period += plays;
    game.minutes += seconds / 60;
    if (row.date === todayDate) game.today += plays;
    games.set(row.gameId, game);
  });
  const daily = range === 'all' ? [...dailyMap.entries()].map(([date, plays]) => ({ date, plays })) : Array.from({ length: rangeDays + 1 }, (_, index) => {
    const date = new Date((dayStart - (rangeDays - index) * 86400) * 1000).toISOString().slice(0, 10);
    return { date, plays: dailyMap.get(date) || 0 };
  });
  return json({ totalPlays, periodPlays: totalPlays, today, todayDate, totalMinutes: totalSeconds / 60, daily, games: [...games.values()].map(game => ({ ...game, minutes: Math.round(game.minutes * 10) / 10 })) });
}