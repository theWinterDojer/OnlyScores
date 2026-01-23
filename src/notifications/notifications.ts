import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { readCache, writeCache } from "../providers/cache";

const PUSH_TOKEN_CACHE_KEY = "notifications:deviceToken";

export const configureNotifications = async () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
};

export const ensureNotificationPermissions = async () => {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
};

export const getCachedPushToken = async () =>
  readCache<string>(PUSH_TOKEN_CACHE_KEY);

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

export const sendLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
  } catch {
    // Ignore notification failures to keep the UI responsive.
  }
};
