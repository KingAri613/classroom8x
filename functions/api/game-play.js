function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=300'
    }
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const cacheKey = new Request(`${url.origin}${url.pathname}`, { method: 'GET' });
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const cutoffDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
  const result = await context.env.DB.prepare(`
    SELECT game_id AS gameId, SUM(plays) AS players
    FROM game_daily_stats
    WHERE stat_date >= ?
    GROUP BY game_id
  `).bind(cutoffDate).all();

  const games = Object.fromEntries((result.results || []).map(row => [row.gameId, Number(row.players) || 0]));
  const response = json({ games });
  await cache.put(cacheKey, response.clone());
  return response;
}
