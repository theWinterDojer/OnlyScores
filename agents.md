# Agents

This document defines the core agent roles and how they collaborate on
Only Scores. Agents focus on clarity, speed, and minimalism aligned to the
product promise.

## Roles

- Product Agent: owns scope, MVP boundaries, and success criteria.
- UX Agent: enforces a scores-first experience, large type, and minimal taps.
- Mobile Agent: implements the Expo/React Native client and local caching.
- Backend Agent: owns provider integration, polling, and notifications.
- Data Agent: normalizes provider data into the internal game model.
- QA Agent: validates offline behavior, refresh timing, and notification rules.

## Collaboration Rules

- Keep the home screen instantly readable.
- Prefer simple, stable flows over clever UI.
- Every change should support fast readability and performance.
- Provider integrations must be swappable without app changes.

## Execution Rules

- Do one PRD checkbox-sized task at a time.
- Keep diffs small; avoid refactors unless required for the current task.
- Build the provider interface first; never hardcode API usage into UI.
- After each task, run the app; if checks exist, run them.
- Commit after each completed task.
