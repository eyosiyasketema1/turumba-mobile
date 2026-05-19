// ============================================================================
// Push Notifications — Mobile
//
// Wraps expo-notifications: requests permission, fetches the Expo Push token,
// and registers it with the backend so the drip-processor can deliver push
// notifications to this device.
//
// Setup required (one-time):
//   npx expo install expo-notifications expo-device
//
// In app.json you should add a notification channel for Android — Expo's
// defaults work for development, but production builds want an icon + color:
//   "plugins": [["expo-notifications", { ... }]]
// ============================================================================

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { api } from "./api";

// Foreground notification behavior — show banner + play sound when a push
// arrives while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request permission, fetch the Expo push token, and register it with the
 * backend for this (account, actor) pair. No-op on simulators (Expo Push
 * only delivers to physical devices) and when permission is denied.
 *
 * Returns the token string on success, or null otherwise.
 */
export async function registerForPush(opts: {
  accountId: string;
  actorId: string;
  actorType: "seeker" | "mentor";
}): Promise<string | null> {
  // Expo Push requires a physical device.
  if (!Device.isDevice) {
    return null;
  }

  // Android needs an explicit notification channel before tokens work.
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2563eb",
      });
    } catch {
      /* non-fatal */
    }
  }

  // Permission flow — request if not already granted.
  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;
  if (finalStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  let token: string;
  try {
    const result = await Notifications.getExpoPushTokenAsync();
    token = result.data;
  } catch (err) {
    console.warn("[push] getExpoPushTokenAsync failed", err);
    return null;
  }

  // Best-effort upsert to the backend; ignore network failures since the
  // app should keep working without push.
  try {
    await api("/gamification/push/register", {
      method: "POST",
      body: {
        account_id: opts.accountId,
        actor_id: opts.actorId,
        actor_type: opts.actorType,
        expo_push_token: token,
        platform: Platform.OS,
        device_name: (Device as any).modelName || (Device as any).deviceName || null,
      },
    });
  } catch (err) {
    console.warn("[push] register call failed", err);
  }

  return token;
}

/**
 * Soft-disable a token (e.g. on logout) so the backend stops sending
 * pushes to this device.
 */
export async function unregisterPush(opts: { actorId: string; token: string }): Promise<void> {
  try {
    await api("/gamification/push/unregister", {
      method: "POST",
      body: { actor_id: opts.actorId, expo_push_token: opts.token },
    });
  } catch {
    /* best-effort */
  }
}
