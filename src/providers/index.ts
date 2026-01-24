import { Provider } from './Provider';
import backendProvider from './BackendProvider';
import type { ProviderLeague, ProviderScoreCard, ProviderTeam } from '../types/provider';

export type ProviderRegistry = Record<
  string,
  Provider<ProviderLeague, ProviderTeam, ProviderScoreCard>
>;

export const providers: ProviderRegistry = {
  backend: backendProvider,
};

export const defaultProviderId = 'backend';

export const getProvider = (id: string = defaultProviderId) => {
  const provider = providers[id];
  if (!provider) {
    throw new Error(`Unknown provider: ${id}`);
  }
  return provider;
};
