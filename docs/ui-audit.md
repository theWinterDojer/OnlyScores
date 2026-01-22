## UI Audit: Backend/Accounts/Router Usage

- Reviewed `App.tsx` and `src/components` for any backend, account, auth, or router usage.
- UI only consumes scores via the provider interface; no direct backend endpoints are called.
- No router or navigation imports are present in UI code.
