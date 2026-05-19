import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Platform, UIManager } from 'react-native';
import 'react-native-reanimated';
import { useEffect } from 'react';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { Colors } from '@/constants/theme';
import { CelebrationProvider } from '@/components/gamification/CelebrationContext';
import { registerForPush } from '@/services/push';

// Same hardcoded mentor / tenant pair used elsewhere; swap for real auth once
// the login flow returns a real session.
const PUSH_ACCOUNT_ID = 'tenant-1';
const PUSH_ACTOR_ID = 'contact-2';
const PUSH_ACTOR_TYPE = 'mentor' as const;

export const unstable_settings = {
  initialRouteName: 'index',
};

// Light-only theme matching Turumba's design system
const TurumbaTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.foreground,
    border: Colors.light.border,
    notification: Colors.light.destructive,
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  // Register for Expo Push once the app boots. Best-effort — failures
  // (permission denied, simulator, network) just no-op so the app keeps
  // working without push.
  useEffect(() => {
    registerForPush({
      accountId: PUSH_ACCOUNT_ID,
      actorId: PUSH_ACTOR_ID,
      actorType: PUSH_ACTOR_TYPE,
    }).catch(() => {});
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={TurumbaTheme}>
      <CelebrationProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="seeker/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="verify-code" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="reset-password" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="privacy" options={{ headerShown: false }} />
          <Stack.Screen name="help" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="dark" />
      </CelebrationProvider>
    </ThemeProvider>
  );
}
