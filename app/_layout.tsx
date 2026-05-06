import { AuthProvider, useAuth } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

function RootLayoutNav() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isIndex = (segments.length as number) === 0 || (segments[0] as string) === 'index';
    const inCustomer = segments[0] === '(customer)';
    const inVendor = segments[0] === '(vendor)';

    if (!session) {
      // Not logged in → always go to landing page
      if (inCustomer || inVendor || inAuthGroup) router.replace('/');
      else if (!isIndex) router.replace('/');
    } else if (profile) {
      // Logged in with a complete profile → route by role
      if (profile.role === 'vendor') {
        if (!inVendor) router.replace('/(vendor)');
      } else {
        if (!inCustomer) router.replace('/(customer)');
      }
    }
    // If session exists but profile is null, wait — don't redirect anywhere
    // (profile loading may still be in progress)
  }, [session, profile, loading]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="(vendor)" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </LanguageProvider>
  );
}
