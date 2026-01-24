import { backendContract } from "./backendContract";

const API_BASE = process.env.EXPO_PUBLIC_ONLYSCORES_API_BASE_URL;

export type AnalyticsEventName = "app_open" | "refresh" | "notification_open";

export type AnalyticsMetadata = Record<string, string>;

type AnalyticsEventPayload = {
  event: AnalyticsEventName;
  occurredAt: string;
  metadata?: AnalyticsMetadata;
};

export const trackAnalyticsEvent = async (
  event: AnalyticsEventName,
  metadata?: AnalyticsMetadata
) => {
  if (!API_BASE) return false;
  const payload: AnalyticsEventPayload = {
    event,
    occurredAt: new Date().toISOString(),
  };
  if (metadata && Object.keys(metadata).length > 0) {
    payload.metadata = metadata;
  }

  try {
    const response = await fetch(
      `${API_BASE}${backendContract.endpoints.analyticsEvents}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.ok;
  } catch {
    return false;
  }
};
