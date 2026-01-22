# Runtime Configuration

## Expo Public Environment Variables

Set `EXPO_PUBLIC_ONLYSCORES_API_BASE_URL` to the OnlyScores backend base URL.
This value is embedded at build time and used at runtime by the mobile app.

### Local development

1. Copy `.env.example` to `.env`.
2. Update `EXPO_PUBLIC_ONLYSCORES_API_BASE_URL` to your backend URL.
3. Run the app with `npm run start`.

### EAS/builds

Configure `EXPO_PUBLIC_ONLYSCORES_API_BASE_URL` as an environment variable in
your build profile so it is available during bundle time.
