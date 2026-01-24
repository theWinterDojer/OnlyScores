import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'onlyscores:cache:';

const buildCacheKey = (key: string) => `${CACHE_PREFIX}${key}`;

export const readCache = async <T>(key: string): Promise<T | null> => {
  const stored = await AsyncStorage.getItem(buildCacheKey(key));
  if (!stored) return null;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
};

export const writeCache = async <T>(key: string, value: T): Promise<void> => {
  await AsyncStorage.setItem(buildCacheKey(key), JSON.stringify(value));
};

export const removeCache = async (key: string): Promise<void> => {
  await AsyncStorage.removeItem(buildCacheKey(key));
};
