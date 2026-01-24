import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { readCache, writeCache } from '../providers/cache';

const PUSH_TOKEN_CACHE_KEY = 'notifications:deviceToken';

export type NotificationOpenData = {
  id: string;
  type?: string;
};

const buildNotificationOpenData = (
  response: Notifications.NotificationResponse | null
): NotificationOpenData | null => {
  if (!response) return null;
  const data = response.notification.request.content.data ?? {};
  const rawType = (data as Record<string, unknown>).type;
  return {
    id: response.notification.request.identifier,
    type: typeof rawType === 'string' ? rawType : undefined,
  };
};

export const configureNotifications = async () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
};

export const ensureNotificationPermissions = async () => {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
};

export const getCachedPushToken = async () => readCache<string>(PUSH_TOKEN_CACHE_KEY);

export const fetchExpoPushToken = async () => {
  const cached = await readCache<string>(PUSH_TOKEN_CACHE_KEY);
  if (cached) return cached;
  try {
    const response = await Notifications.getExpoPushTokenAsync();
    const token = response.data;
    await writeCache(PUSH_TOKEN_CACHE_KEY, token);
    return token;
  } catch {
    return null;
  }
};

export const addNotificationOpenListener = (handler: (data: NotificationOpenData) => void) =>
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = buildNotificationOpenData(response);
    if (!data) return;
    handler(data);
  });

export const getLastNotificationOpen = async () => {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    return buildNotificationOpenData(response);
  } catch {
    return null;
  }
};
