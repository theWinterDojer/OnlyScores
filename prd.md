# Only Scores - PRD

## Product Promise
Only Scores delivers fast, reliable sports scores with minimal distractions.
No news, no highlights, no betting, and no clutter.

## Problem
Fans want scores and game status quickly, without digging through feeds or
noise. Most sports apps prioritize content and engagement over speed.

## Target Users
- Sports fans who check scores multiple times a day.
- Casual fans who only want the latest result or current score.
- Power users who track multiple leagues and teams.

## Goals
- Scores visible immediately on launch.
- Consistent, fast refresh while the app is open.
- Readable scores with minimal taps.
- Use clean team logos and branding.
- Reliable notifications for game events.
- Offline-friendly with last successful scores cached.

## Success Metrics (v0)
- Warm start to usable scores under 1.5 seconds.
- 99% of launches show cached scores even without network.
- Notifications sent within 120 seconds of an event.
- Fewer than 3 taps to reach any score list.

## MVP Scope (v0)
- First launch: user selects leagues and teams.
- Home screen shows score cards per selection.
- Each card lists today's games (current week for NFL).
- Cards collapse/expand when more than 10 games.
- Manual refresh and auto refresh while app is open.
- Auto refresh interval defaults to 60 seconds (configurable 60-120 seconds).
- Reorder cards via drag and drop (persisted locally).
- Settings: toggle notifications per card (start, score change, final).
- Cached last fetch shown if offline.

## Non-Goals (v0)
- No accounts or login.
- No social, chat, or community features.
- No articles, highlights, or video.
- No betting or odds.
- No advanced stats.

## Platforms and Stack
- Expo (React Native) app with TypeScript.
- Android first.
- iOS later with feature parity.
- Push notifications via Expo Push (FCM/APNs).

## Key User Flows
- Onboarding: choose leagues and teams, proceed to home.
- Home: view score cards, expand or collapse cards, reorder cards.
- Refresh: pull to refresh or tap refresh control.
- Settings: toggle notifications for each card.

## UX Principles
- Scores first: content visible immediately on launch.
- Large type, high contrast, and clear game status.
- Minimal taps: most actions are one tap away.
- Efficient vertical space with stable layouts.
- Clear offline state and last updated time.

## Data Provider Strategy
- Start with TheSportsDB (free).
- Provider interface must be swappable for premium or alternate providers.
- Mobile clients consume normalized backend data only.
- If provider lacks realtime, backend polls every 60-120 seconds.

## Backend Requirements (v0)
- Poll providers and normalize data into internal game model.
- Store latest game state and compute deltas.
- Trigger notifications for start, score change, and final.
- Provide read-optimized endpoints for mobile clients.
- Cache provider responses to reduce rate limits.
- Store Expo push tokens for device subscriptions.

## API Contracts (v0)
- GET /v1/leagues
- GET /v1/teams?leagueId=...
- GET /v1/scores?leagueIds=...
- GET /v1/scores?teamIds=...
- GET /v1/scores/last-updated
- POST /v1/device/subscribe

## Data Model (v0)
Backend:
- league (id, name, sport, providerLeagueId)
- team (id, leagueId, name, shortName, providerTeamId, logoUrl)
- game (id, leagueId, providerGameId, startTime, status,
  homeTeamId, awayTeamId, homeScore, awayScore, lastUpdate)
- notification_event (id, gameId, type, payload, createdAt)
- device (id, expoPushToken, selectionPreferences, updatedAt)

Client:
- selection (league/team, order)
- card (selectionId, collapsed, notifyStart, notifyScore, notifyFinal)
- game (id, leagueId, teams, scores, status, startTime, lastUpdated)
- cacheSnapshot (selectionId, fetchedAt, payload)

## Notifications
- Per-card toggles for game start, score change, and final.
- Backend computes events by comparing latest and previous game state.
- Expo push notifications with minimal payload (game id, teams, score, status).

## Performance and Offline
- Render from cache immediately, refresh in background.
- Keep payloads small and only include needed fields.
- Show last updated time for cached data.

## Analytics (v0)
- Track app open, refresh, and notification open events.
- No personal data collection beyond device token for push.

## Risks and Mitigations
- Provider latency: use polling + caching to stabilize data.
- Provider schema changes: isolate via adapter layer.
- Rate limits: throttle polling and cache responses.

## Done Definition
- Home loads and shows scores from a real API.
- Expand/collapse works for large cards.
- Card reorder persists across app restarts.
- Works offline with last cached scores.
- Push notifications verified for at least one league.
- Warm start to scores under 1.5 seconds.

## Milestones
1) Provider adapter + normalization.
2) Backend polling + notifications.
3) Expo MVP with cache and home cards.
4) Settings + reorder + collapse.
5) Performance and QA pass.
