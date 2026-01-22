import { Provider } from "./Provider";
import mockProvider from "./MockProvider";
import theSportsDbProvider from "./TheSportsDBProvider";

export type ProviderRegistry = Record<string, Provider>;

export const providers: ProviderRegistry = {
  mock: mockProvider,
  thesportsdb: theSportsDbProvider,
};

export const defaultProviderId = "mock";

export const getProvider = (id: string = defaultProviderId) => {
  const provider = providers[id];
  if (!provider) {
    throw new Error(`Unknown provider: ${id}`);
  }
  return provider;
};
