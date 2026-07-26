import { api } from '@/convex/_generated/api';
import { useConvexAuth, useMutation } from 'convex/react';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// How foreground notifications are presented while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Asks for notification permission and registers this device's Expo push token
 * with Convex once the user is authenticated. Mount once inside the signed-in
 * part of the app (see app/(tabs)/_layout.tsx).
 */
// Screens the backend can deep-link to via the push payload's data.screen.
const SCREEN_ROUTES: Record<string, string> = {
  'support-chat': '/support-chat',
  dashboard: '/(tabs)',
};

export function usePushNotifications() {
  const { isAuthenticated } = useConvexAuth();
  const registerToken = useMutation(api.pushNotifications.registerToken);

  // useLastNotificationResponse also covers cold starts, where a listener
  // registered after launch would miss the tap that opened the app.
  const response = Notifications.useLastNotificationResponse();
  const handledResponse = useRef<string | null>(null);

  useEffect(() => {
    if (!response) return;
    const id = response.notification.request.identifier;
    if (handledResponse.current === id) return;
    handledResponse.current = id;
    const screen = response.notification.request.content.data?.screen;
    const route = typeof screen === 'string' ? SCREEN_ROUTES[screen] : undefined;
    if (route) router.push(route as any);
  }, [response]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        // Push tokens only exist on physical devices (not simulators/Expo Go).
        if (!Device.isDevice) return;

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        let { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          ({ status } = await Notifications.requestPermissionsAsync());
        }
        if (status !== 'granted') return;

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;
        const { data: token } = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        if (!cancelled) {
          await registerToken({ token, platform: Platform.OS });
        }
      } catch (err) {
        // Non-fatal: the app works without push; just log for diagnostics.
        console.warn('Push notification registration failed:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, registerToken]);
}
