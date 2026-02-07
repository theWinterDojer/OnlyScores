# Runtime Configuration

## Expo Public Environment Variables

Set `EXPO_PUBLIC_ONLYSCORES_API_BASE_URL` to the OnlyScores backend base URL.
This value is embedded at build time and used at runtime by the mobile app.

### Local development

#### Backend

1. `cd backend`
2. `cp .env.example .env`
3. `npm install`
4. `npm run dev`

The backend defaults to `PORT=4000` and uses the free TheSportsDB v1 key (`123`).
Verify it is running at `http://localhost:4000/health`.

#### App

1. Copy `.env.example` to `.env`.
2. Update `EXPO_PUBLIC_ONLYSCORES_API_BASE_URL` to `http://localhost:4000`.
3. Run the app with `npm run start`.

### EAS/builds

Configure `EXPO_PUBLIC_ONLYSCORES_API_BASE_URL` as an environment variable in
your build profile so it is available during bundle time.
