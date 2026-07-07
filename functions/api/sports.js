/**
 * Cloudflare Pages Function - Sports API Proxy
 * Proxies requests to sportdb.dev API and adds authentication header
 * Fetches comprehensive sports data including:
 * - Live matches and fixtures
 * - League standings and statistics
 * - Team information and player stats
 * - Transfer market data
 * - Match predictions and lineups
 * 
 * Environment Variables Required:
 * - SPORTDB_API_KEY: Your SportDB API key from https://dashboard.sportdb.dev/
 */

export default {
  async fetch(request, env, ctx) {
    // Only allow GET requests
    if (request.method !== 'GET' && request.method !== 'OPTIONS') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    try {
      // Get the requested endpoint from query parameter or path
      const url = new URL(request.url);
      const endpoint = url.searchParams.get('endpoint') || url.pathname.replace('/api/sports', '');
      
      // Check for API key action
      if (endpoint === '/key' || url.pathname.includes('/sports-key')) {
        return new Response(
          JSON.stringify({ apiKey: !!env.SPORTDB_API_KEY }),
          { 
            headers: { 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // Validate API key exists
      if (!env.SPORTDB_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'API key not configured in Cloudflare Pages environment' }),
          { 
            headers: { 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }

      // Build the SportDB API URL
      const apiUrl = `https://api.sportdb.dev/api/${endpoint}`;

      // Proxy the request with authentication
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': env.SPORTDB_API_KEY,
          'Content-Type': 'application/json',
          'User-Agent': 'Classroom8x-SportDashboard/2.0'
        }
      });

      // Handle API errors
      if (!response.ok) {
        console.error(`SportDB API error: ${response.status} ${response.statusText} for ${endpoint}`);
        return new Response(
          JSON.stringify({ 
            error: `SportDB API returned ${response.status}`,
            endpoint: endpoint,
            status: response.status
          }),
          { 
            headers: { 'Content-Type': 'application/json' },
            status: response.status
          }
        );
      }

      // Return the API response with CORS headers
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          status: 500
        }
      );
    }
  }
};
