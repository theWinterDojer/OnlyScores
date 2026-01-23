# Only Scores - PRD

## Product Promise
Only Scores delivers fast, reliable sports scores with minimal distractions.
No news, no highlights, no betting, and no clutter.

## Problem
Fans want scores and game status quickly, without digging through feeds or
noise. Most sports apps prioritize content and engagement over speed.

## Target Users
- [x] Sports fans who check scores multiple times a day.
- [x] Casual fans who only want the latest result or current score.
- [x] Power users who track multiple leagues and teams.

## Goals
- [x] Scores visible immediately on launch.
- [x] Consistent, fast refresh while the app is open.
- [x] Readable scores with minimal taps.
- [x] Use clean team logos and branding.
- [x] Reliable notifications for game events.
- [x] Offline-friendly with last successful scores cached.

## Success Metrics (v0)
- [ ] Warm start to usable scores under 1.5 seconds.
- [ ] 99% of launches show cached scores even without network.
- [ ] Notifications sent within 120 seconds of an event.
- [ ] Fewer than 3 taps to reach any score list.

## MVP Scope (v0)
- [x] First launch: user selects leagues and teams.
- [x] Home screen shows score cards per selection.
- [x] Each card lists today's games (current week for NFL).
- [x] Cards collapse/expand when more than 10 games.
- [x] Manual refresh and auto refresh while app is open.
- [x] Auto refresh interval defaults to 60 seconds (configurable 60-120 seconds).
- [x] Reorder cards via drag and drop (persisted locally).
- [x] Settings: toggle notifications per card (start, score change, final).
- [x] Cached last fetch shown if offline.

## Non-Goals (v0)
- [x] No accounts or login.
- [x] No social, chat, or community features.
- [x] No articles, highlights, or video.
- [x] No betting or odds.
- [x] No advanced stats.

## Platforms and Stack
- [x] Expo (React Native) app with TypeScript.
- [ ] Android first.
- [ ] iOS later with feature parity.
- [x] Push notifications via Expo Push (FCM/APNs).

## Key User Flows
- [x] Onboarding: choose leagues and teams, proceed to home.
- [x] Home: view score cards, expand or collapse cards, reorder cards.
- [x] Refresh: pull to refresh or tap refresh control.
- [x] Settings: toggle notifications for each card.

## UX Principles
- [x] Scores first: content visible immediately on launch.
- [x] Large type, high contrast, and clear game status.
- [x] Minimal taps: most actions are one tap away.
- [x] Efficient vertical space with stable layouts.
- [x] Clear offline state and last updated time.

## Data Provider Strategy
- [ ] Start with TheSportsDB (free).
- [x] Provider interface must be swappable for premium or alternate providers.
- [x] Mobile clients consume normalized backend data only.
- [ ] If provider lacks realtime, backend polls every 60-120 seconds.

## Backend Requirements (v0)
- [ ] Poll providers and normalize data into internal game model.
- [ ] Store latest game state and compute deltas.
- [ ] Trigger notifications for start, score change, and final.
- [ ] Provide read-optimized endpoints for mobile clients.
- [ ] Cache provider responses to reduce rate limits.
- [ ] Store Expo push tokens for device subscriptions.

## API Contracts (v0)
- [x] GET /v1/leagues
- [x] GET /v1/teams?leagueId=...
- [x] GET /v1/scores?leagueIds=...
- [x] GET /v1/scores?teamIds=...
- [ ] GET /v1/scores/last-updated
- [x] POST /v1/device/subscribe

## Data Model (v0)
Backend:
- [ ] league (id, name, sport, providerLeagueId)
- [ ] team (id, leagueId, name, shortName, providerTeamId, logoUrl)
- [ ] game (id, leagueId, providerGameId, startTime, status,
  homeTeamId, awayTeamId, homeScore, awayScore, lastUpdate)
- [ ] notification_event (id, gameId, type, payload, createdAt)
- [ ] device (id, expoPushToken, selectionPreferences, updatedAt)

Client:
- [x] selection (league/team, order)
- [ ] card (selectionId, collapsed, notifyStart, notifyScore, notifyFinal)
- [ ] game (id, leagueId, teams, scores, status, startTime, lastUpdated)
- [ ] cacheSnapshot (selectionId, fetchedAt, payload)

## Notifications
- [x] Per-card toggles for game start, score change, and final.
- [ ] Backend computes events by comparing latest and previous game state.
- [ ] Expo push notifications with minimal payload (game id, teams, score, status).

## Performance and Offline
- [x] Render from cache immediately, refresh in background.
- [ ] Keep payloads small and only include needed fields.
- [x] Show last updated time for cached data.

## Analytics (v0)
- [ ] Track app open, refresh, and notification open events.
- [ ] No personal data collection beyond device token for push.

## Risks and Mitigations
- [ ] Provider latency: use polling + caching to stabilize data.
- [ ] Provider schema changes: isolate via adapter layer.
- [ ] Rate limits: throttle polling and cache responses.

## Done Definition
- [x] Home loads and shows scores from a real API.
- [x] Expand/collapse works for large cards.
- [x] Card reorder persists across app restarts.
- [x] Works offline with last cached scores.
- [x] Push notifications verified for at least one league.
- [ ] Warm start to scores under 1.5 seconds.

## Milestones
- [ ] 1) Provider adapter + normalization.
- [ ] 2) Backend polling + notifications.
- [ ] 3) Expo MVP with cache and home cards.
- [ ] 4) Settings + reorder + collapse.
- [ ] 5) Performance and QA pass.

## Current Implementation Notes (as of 2026-01-22)
- [x] Mobile app uses backend API provider (requires `EXPO_PUBLIC_ONLYSCORES_API_BASE_URL`).
- [x] Notifications use Expo push permissions/token and backend subscription calls.
- [x] Card reorder uses drag-and-drop with a drag handle.
- [x] Refresh interval setting persists between 60-120 seconds.
- [x] Team logos render with fallback badges when missing.

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
- [ ] Reconcile provider history now that the mobile app uses `BackendProvider` only.
- [ ] Implement selection-scoped cache snapshots (selectionId + fetchedAt) for hydration.
- [ ] Add analytics tracking for app open, refresh, and notification open events (no PII).
- [ ] Decide on `/v1/scores/last-updated` usage: wire into UI or remove from contract.
- [ ] Pass explicit date for non-NFL score requests to guarantee "today" behavior.
- [ ] Persist per-card collapse state or remove it from the client data model.
- [ ] Add warm-start timing instrumentation to validate the 1.5s metric.
