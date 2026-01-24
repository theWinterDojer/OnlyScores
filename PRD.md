# Only Scores - PRD

Note: Only the Tasks section uses checkboxes to track work.

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
- No "Latest only" display toggle; cards show all games in the selected window.
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
- Edit leagues & teams: Settings > Edit leagues & teams, adjust selections,
  confirm save, persist changes, refresh home cards.

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
Note: No "Latest only" display toggle in the client card model for v0.

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
- 1) Provider adapter + normalization.
- 2) Backend polling + notifications.
- 3) Expo MVP with cache and home cards.
- 4) Settings + reorder + collapse.
- 5) Performance and QA pass.

## Current Implementation Notes (as of 2026-01-22)
- Mobile app uses backend API provider (requires `EXPO_PUBLIC_ONLYSCORES_API_BASE_URL`).
- Notifications use Expo push permissions/token and backend subscription calls.
- Card reorder uses drag-and-drop with a drag handle.
- Refresh interval setting persists between 60-120 seconds.
- Team logos render with fallback badges when missing.

## Tasks
- [x] Create `src/` layout with `components`, `providers`, `types` folders.
- [x] Move `GameStatus`, `Game`, `ScoreCard` types into `src/types/score.ts`.
- [x] Add `src/types/provider.ts` for provider contracts and response shapes.
- [x] Extract `StatusPill` into `src/components/StatusPill.tsx`.
- [x] Extract `GameRow` into `src/components/GameRow.tsx`.
- [x] Extract `ScoreCardView` into `src/components/ScoreCardView.tsx`.
- [x] Extract app header into `src/components/AppHeader.tsx`.
- [x] Wire `App.tsx` to use new components and type imports.
- [x] Create `Provider` interface in `src/providers/Provider.ts`.
- [x] Add `MockProvider` with existing mock data in `src/providers/MockProvider.ts`.
- [x] Replace inline mock data in `App.tsx` with `MockProvider` fetch call.
- [x] Add simple provider registry in `src/providers/index.ts`.
- [x] Add `AsyncStorage` cache helper in `src/providers/cache.ts`.
- [x] Cache latest scores snapshot after provider fetch.
- [x] Hydrate cached scores on app start before network fetch.
- [x] Track and display last updated time on each card.
- [x] Add loading state UI for initial fetch.
- [x] Add empty state UI when no games exist.
- [x] Add error state UI with retry action.
- [x] Add pull-to-refresh on score list.
- [x] Add auto-refresh interval while app is active.
- [x] Pause auto-refresh when app goes background/inactive.
- [x] Add up/down buttons to reorder cards in list.
- [x] Persist card order to `AsyncStorage`.
- [x] Restore card order from cache on launch.
- [x] Disable reorder buttons at top/bottom edges.
- [x] Add lightweight test data for reorder logic in mock.
- [x] Create `TheSportsDBProvider` implementing the provider interface.
- [x] Map TheSportsDB responses to internal game model.
- [x] Switch provider registry to use TheSportsDB (behind interface).
- [x] Audit UI to confirm no backend, accounts, or router usage.
- [x] Wire `App.tsx` to consume `src/components` and `src/types/score.ts` (remove inline duplicates).
- [x] Implement onboarding for league/team selection and persist selections.
- [x] Use selected league/team ids when calling `getScores`.
- [x] Implement TheSportsDB `getLeagues` and `getTeams` with team logos.
- [x] Add settings UI with per-card notification toggles.
- [x] Implement notification subscription and event delivery flow.
- [x] Add explicit offline indicator with last updated timestamp context.
- [x] Route mobile data access through backend API endpoints and keep provider adapters server-side.
- [x] Filter score cards by selected team ids when provided.
- [x] Wire real Expo push permissions/token + backend event delivery; remove local alert fallback.
- [x] Replace reorder buttons with drag-and-drop list and persist order.
- [x] Render team logos in score rows with fallback when missing.
- [x] Add refresh interval setting (60-120 seconds) and persist user choice.
- [x] Support NFL week-based scoring windows instead of day-only filtering.
- [x] Confirm backend endpoints match PRD contract, including `window=week`.
- [x] Set and document `EXPO_PUBLIC_ONLYSCORES_API_BASE_URL` for runtime.
- [x] Run end-to-end Expo push notification test with backend events.
- [x] Add a clear startup warning when API base URL is missing.
- [x] Reconcile provider history now that the mobile app uses `BackendProvider` only.
- [x] Implement selection-scoped cache snapshots (selectionId + fetchedAt) for hydration.
- [x] Document "Edit leagues & teams" settings flow in PRD key flows.
- [x] Add analytics tracking for app open, refresh, and notification open events (no PII).
- [x] Document edit leagues and teams flow in PRD key flows.
- [x] Decide on `/v1/scores/last-updated` usage: wire into UI or remove from contract.
- [x] Pass explicit date for non-NFL score requests to guarantee "today" behavior.
- [x] Persist per-card collapse state or remove it from the client data model.
- [x] Add warm-start timing instrumentation to validate the 1.5s metric.
- [x] Align notification strategy: remove client-side local scheduling or document hybrid model.
- [x] Document or remove the "Latest only" display toggle in PRD scope and data model.
- [x] Document the "Edit leagues & teams" settings flow in PRD key flows.
- [ ] Align platform scope with Expo config (Android-first vs iOS enabled in `app.json`).
