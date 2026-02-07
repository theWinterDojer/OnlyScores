import 'dotenv/config';

const parsePort = (value?: string) => {
  if (!value) return 4000;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 4000;
};

export const port = parsePort(process.env.PORT);
export const sportsDbApiKey = process.env.THE_SPORTS_DB_API_KEY ?? '123';
export const sportsDbBaseUrl = 'https://www.thesportsdb.com/api/v1/json';
