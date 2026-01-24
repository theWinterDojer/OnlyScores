export type NotificationSettingKey = 'notifyStart' | 'notifyScore' | 'notifyFinal';

export type CardNotificationPrefs = Record<NotificationSettingKey, boolean>;

export type NotificationPrefsByCard = Record<string, CardNotificationPrefs>;

export const DEFAULT_NOTIFICATION_PREFS: CardNotificationPrefs = {
  notifyStart: true,
  notifyScore: true,
  notifyFinal: true,
};
