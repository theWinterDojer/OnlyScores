export const backendContract = {
  endpoints: {
    leagues: "/v1/leagues",
    teams: "/v1/teams",
    scores: "/v1/scores",
    deviceSubscribe: "/v1/device/subscribe",
    analyticsEvents: "/v1/analytics/events",
  },
  queryParams: {
    teams: ["leagueId"] as const,
    scores: ["leagueIds", "teamIds", "date", "window"] as const,
  },
  scoresWindowValues: ["day", "week"] as const,
} as const;
