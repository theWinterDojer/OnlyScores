# Agents

This document defines the core agent roles and how they collaborate on
Only Scores. Agents focus on clarity, speed, and minimalism aligned to the
product promise.

## Roles

- Product Agent: owns scope, MVP boundaries, and success criteria.
- UX Agent: enforces the "quick gym glance" experience, large type, and
  minimal taps.
- Android Agent: implements the Kotlin/Compose client and local caching.
- Backend Agent: owns provider integration, polling, and notifications.
- Data Agent: normalizes provider data into the internal game model.
- QA Agent: validates offline behavior, refresh timing, and notification rules.

## Collaboration Rules

- Keep the home screen instantly readable.
- Prefer simple, stable flows over clever UI.
- Every change should support fast glanceability and performance.
- Provider integrations must be swappable without app changes.
