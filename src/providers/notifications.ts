import { NotificationPrefsByCard } from '../types/notifications';
import { backendContract } from './backendContract';

const normalizeApiBase = (value?: string) => (value ? value.replace(/\/+$/, '') : '');
const API_BASE = normalizeApiBase(process.env.EXPO_PUBLIC_ONLYSCORES_API_BASE_URL);

export type DeviceSubscriptionPayload = {
  expoPushToken: string;
  leagueIds: string[];
  teamIds: string[];
  preferences: NotificationPrefsByCard;
};

export const submitDeviceSubscription = async (payload: DeviceSubscriptionPayload) => {
  if (!API_BASE) return false;
  const response = await fetch(`${API_BASE}${backendContract.endpoints.deviceSubscribe}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Subscription failed: ${response.status}`);
  }
  return true;
};
