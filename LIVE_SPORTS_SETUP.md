# Live Sports Dashboard Setup Guide

## Overview
The Live Sports Dashboard integrates with **SportDB API** (via https://dashboard.sportdb.dev/) to display:
- 🔴 Live football matches with real-time scores
- 📊 League standings and rankings
- 📅 Upcoming fixtures
- 🔄 Transfer market news

## Architecture
- **Frontend**: HTML/CSS/JavaScript in `/drive.google.com/index.html`
- **Backend Proxy**: Cloudflare Pages Function at `/functions/api/sports.js`
- **API**: SportDB (https://api.sportdb.dev/)

## Setup Instructions

### Step 1: Get SportDB API Key
1. Visit https://dashboard.sportdb.dev/
2. Sign up or log in
3. Create an API key
4. Copy your API key

### Step 2: Configure Cloudflare Pages Environment Variable
1. Go to your Cloudflare Pages project: https://dash.cloudflare.com/
2. Navigate to: **Settings → Environment variables**
3. Add a new environment variable:
   - **Name**: `SPORTDB_API_KEY`
   - **Value**: `your_api_key_here`
   - **Environments**: `Production` (and `Preview` if you want to test)
4. Click "Save"

### Step 3: Deploy
1. The Cloudflare Pages Function at `/functions/api/sports.js` will automatically:
   - Intercept API requests from the frontend
   - Add the `X-API-Key` header using the environment variable
   - Proxy requests to SportDB API
   - Handle CORS headers
   - Cache responses for 5 minutes

2. Deploy your changes:
   ```bash
   git add .
   git commit -m "Add Live Sports Dashboard with SportDB API integration"
   git push origin main
   ```

3. Cloudflare Pages will automatically deploy and your Live Sports feature will be active!

## Testing

### Local Testing (Before Deployment)
If using Wrangler locally:
```bash
wrangler pages dev --env production
```

Then set the environment variable locally:
```bash
export SPORTDB_API_KEY=your_api_key_here
```

### Production Testing
1. Click the "Live Sport" button in the header
2. You should see:
   - Loading spinner while data fetches
   - Live matches with scores
   - Tab navigation (Live Matches, Standings, Fixtures, Transfers)
   - Real data from SportDB API

## API Endpoints Used

The Worker proxies these SportDB endpoints:

```
GET /api/flashscore/football
- Live football matches from Flashscore

GET /api/transfermarkt/countries
- Transfer market data by country
```

### Example Worker Request Flow:
```
Frontend: GET /api/sports?endpoint=flashscore/football
    ↓
Worker: Adds X-API-Key header from SPORTDB_API_KEY env var
    ↓
SportDB API: https://api.sportdb.dev/api/flashscore/football
    ↓
Response cached for 5 minutes and returned to frontend
```

## Features Implemented

✅ **Live Matches Tab**
- Displays up to 12 live matches
- Shows team names, scores, league, status, time elapsed
- Updates available when page refreshes

✅ **Standings Tab**
- Shows up to 20 teams
- Displays: Position, Team Name, Played, Wins, Draws, Losses, Points
- Color-coded stats (Green for wins, Blue for draws, Red for losses)

✅ **Fixtures Tab**
- Shows upcoming matches
- Displays team names and kick-off times
- Up to 10 upcoming fixtures

✅ **Transfers Tab**
- Transfer market data by country
- Shows top transfer destinations

✅ **UI/UX**
- Dark theme matching Classroom8x branding (#16213e to #0f3460)
- Red accents (#e94560) for highlights
- Responsive grid layout
- Loading spinner while fetching
- Error handling with user-friendly messages
- Tab-based navigation
- Hover effects on match cards

## Security

🔒 **API Key Protection**
- API key never exposed to client (stored only in Cloudflare environment)
- All requests proxied through Cloudflare Worker
- CORS headers properly configured
- No credentials in code or client-side

## Troubleshooting

### "Unable to fetch data" Error
1. **Check API Key**: Verify `SPORTDB_API_KEY` is set in Cloudflare Pages environment variables
2. **Check Deployment**: Ensure latest code is deployed to production
3. **Check Worker**: Visit `https://classroom8x.pages.dev/api/sports?endpoint=flashscore/football` to test directly
4. **Check API Status**: Verify SportDB API is accessible at https://dashboard.sportdb.dev/

### API Key Not Working
1. Log in to https://dashboard.sportdb.dev/
2. Generate a new API key
3. Update environment variable in Cloudflare Pages
4. Redeploy or wait for cache to clear (5 minutes)

### No Data Showing
1. The API response might not include data for that endpoint
2. Check browser console for detailed error messages
3. Visit https://dashboard.sportdb.dev/api-explorer to test endpoints directly

## Future Enhancements

🚀 Possible improvements:
- Add specific league/team filtering
- Real-time WebSocket updates for live scores
- Player statistics and profiles
- Match predictions
- Custom team/league bookmarks
- Notification system for favorite teams
- Advanced stats charts and analytics

## Files Modified/Created

```
/drive.google.com/index.html
  - Updated openLiveSport() function
  - Added fetchSportDBData() function
  - Added generateLiveSportHTML() function
  - Added tab switching JavaScript

/functions/api/sports.js (NEW)
  - Cloudflare Pages Function for API proxy
  - Handles authentication and CORS

/LIVE_SPORTS_SETUP.md (NEW)
  - This setup guide
```

## Support

For issues or questions:
1. Check browser console for error messages (F12)
2. Verify Cloudflare Pages deployment status
3. Test API directly at https://dashboard.sportdb.dev/api-explorer
4. Check SportDB API documentation

---

**Last Updated**: 2026-07-07
**Version**: 1.0
**API Provider**: SportDB (https://dashboard.sportdb.dev/)
