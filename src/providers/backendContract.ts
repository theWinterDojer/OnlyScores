export const backendContract = {
  endpoints: {
    leagues: "/v1/leagues",
    teams: "/v1/teams",
    scores: "/v1/scores",
    scoresLastUpdated: "/v1/scores/last-updated",
    deviceSubscribe: "/v1/device/subscribe",
  },
  queryParams: {
    teams: ["leagueId"] as const,
    scores: ["leagueIds", "teamIds", "date", "window"] as const,
  },
  scoresWindowValues: ["day", "week"] as const,
} as const;
