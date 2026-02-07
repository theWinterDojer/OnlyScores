import cors from 'cors';
import express from 'express';
import type { Request, Response } from 'express';

import { port } from './config';
import { getLeagues, getScores, getTeams } from './providers/sportsDb';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

const getStringQuery = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
};

app.get('/v1/leagues', async (_req: Request, res: Response) => {
  try {
    const leagues = await getLeagues();
    res.status(200).json({ leagues });
  } catch (error) {
    res.status(502).json({ error: 'Unable to load leagues.' });
  }
});

app.get('/v1/teams', async (req: Request, res: Response) => {
  const leagueId = getStringQuery(req.query.leagueId);
  if (!leagueId) {
    res.status(400).json({ error: 'leagueId is required.' });
    return;
  }
  try {
    const teams = await getTeams(leagueId);
    res.status(200).json({ teams });
  } catch (error) {
    res.status(502).json({ error: 'Unable to load teams.' });
  }
});

const parseListQuery = (value: unknown) => {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => (typeof entry === 'string' ? entry.split(',') : []))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
};

app.get('/v1/scores', async (req: Request, res: Response) => {
  const leagueIds = parseListQuery(req.query.leagueIds);
  const teamIds = parseListQuery(req.query.teamIds);
  const date = getStringQuery(req.query.date);
  const window = getStringQuery(req.query.window);
  const normalizedWindow = window === 'week' ? 'week' : window === 'day' ? 'day' : undefined;

  if (leagueIds.length === 0 && teamIds.length === 0) {
    res.status(400).json({ error: 'leagueIds or teamIds are required.' });
    return;
  }

  try {
    const payload = await getScores({
      leagueIds: leagueIds.length > 0 ? leagueIds : undefined,
      teamIds: teamIds.length > 0 ? teamIds : undefined,
      date,
      window: normalizedWindow,
    });
    res.status(200).json(payload);
  } catch (error) {
    res.status(502).json({ error: 'Unable to load scores.' });
  }
});

app.post('/v1/device/subscribe', (_req: Request, res: Response) => {
  res.status(204).send();
});

app.post('/v1/analytics/events', (_req: Request, res: Response) => {
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`OnlyScores backend listening on ${port}`);
});
