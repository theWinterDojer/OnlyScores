import { Provider } from "./Provider";
import backendProvider from "./BackendProvider";

export type ProviderRegistry = Record<string, Provider>;

export const providers: ProviderRegistry = {
  backend: backendProvider,
};

export const defaultProviderId = "backend";

export const getProvider = (id: string = defaultProviderId) => {
  const provider = providers[id];
  if (!provider) {
    throw new Error(`Unknown provider: ${id}`);
  }
  return provider;
};
