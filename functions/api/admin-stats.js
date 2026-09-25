function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

export async function onRequestGet(context) {
  const authorization = context.request.headers.get('Authorization') || '';
  const supplied = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!context.env.ADMIN_PASSWORD || supplied !== context.env.ADMIN_PASSWORD) return json({ error: 'Unauthorized' }, 401);
  const requestedRange = new URL(context.request.url).searchParams.get('range');
  const requestedStart = new URL(context.request.url).searchParams.get('start');
  const requestedEnd = new URL(context.request.url).searchParams.get('end');
  const range = ['today', 'month', 'year', 'all'].includes(requestedRange) ? requestedRange : 'today';
  const now = Math.floor(Date.now() / 1000);
  const dayStart = now - (now % 86400);
  const days = range === 'today' ? 0 : range === 'month' ? 29 : range === 'year' ? 364 : null;
  const start = /^\d{4}-\d{2}-\d{2}$/.test(requestedStart || '') ? requestedStart : days === null ? '0000-01-01' : new Date((dayStart - days * 86400) * 1000).toISOString().slice(0, 10);
  const end = /^\d{4}-\d{2}-\d{2}$/.test(requestedEnd || '') ? requestedEnd : '9999-12-31';
  const [stats, visitors] = await Promise.all([
    context.env.DB.prepare('SELECT stat_date AS date, game_id AS gameId, plays, duration_seconds AS durationSeconds FROM game_daily_stats WHERE stat_date >= ? AND stat_date <= ? ORDER BY stat_date ASC, plays DESC').bind(start, end).all(),
    context.env.DB.prepare('SELECT COUNT(*) AS activeVisitors FROM daily_active_visitors WHERE stat_date >= ? AND stat_date <= ?').bind(start, end).first()
  ]);
  return json({ range, activeVisitors: Number(visitors?.activeVisitors) || 0, stats: stats.results || [] });
}