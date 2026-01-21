# Only Scores (Just Scores) - PRD

## Product Promise
Only Scores is a no-nonsense sports score app optimized for quick gym
glances: fast load, big readable scores, minimal taps, and no extras.

## Goals
- Scores visible immediately on launch.
- Reliable and fast refresh while app is open.
- High-contrast, large type for sweaty hands and quick glances.
- Offline-friendly with last successful scores cached.

## Non-Goals (v0)
- No accounts or login.
- No social, chat, or community features.
- No articles, highlights, or video.
- No betting or odds.
- No advanced stats.

## MVP Scope (v0)
- On first launch, users select leagues and teams.
- Home screen shows score cards per selection.
- Each card lists today's games (current week for NFL).
- Cards collapse/expand when more than 10 games.
- Manual refresh and auto refresh while app is open.
- Reorder cards via drag and drop (persisted locally).
- Settings: toggle notifications per card (start, score change, final).

## Platforms
- Android first.
- iOS later with feature parity.

## Data Provider
- Start with TheSportsDB (free), designed to be swappable later.
- Future providers: TheSportsDB premium or BALLDONTLIE.
- If provider lacks realtime, backend polls every 60-120 seconds.

## UX Rules
- One-screen-first: scores visible immediately on launch.
- Large type, high contrast, large tap targets.
- Optimized vertical space; no wasted padding.
- Cache last successful fetch for weak signal and offline use.

## Notifications
- Per-card toggles for game start, score change, and final.
- Backend triggers pushes based on polling deltas.

## Done Definition
- Warm start to scores under 1.5 seconds.
- Works offline with last cached scores.
- Card reorder persists across app restarts.
- Push notifications verified for at least one league.
