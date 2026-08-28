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
  const cutoff = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
  const result = await context.env.DB.prepare(`
    SELECT game_id AS gameId, COUNT(*) AS players
    FROM game_plays
    WHERE played_at >= ?
    GROUP BY game_id
  `).bind(cutoff).all();

  const games = Object.fromEntries((result.results || []).map(row => [row.gameId, Number(row.players) || 0]));
  return json({ games });
}
