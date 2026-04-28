import { AuthProvider, useAuth } from '@/lib/auth';
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
      // Not logged in → go to landing page
      if (!inAuthGroup && !isIndex) router.replace('/');
    } else if (profile) {
      // Logged in with profile → route by role
      if (profile.role === 'vendor') {
        if (!inVendor) router.replace('/(vendor)');
      } else {
        if (!inCustomer) router.replace('/(customer)');
      }
    } else {
      // Session exists but no profile row (e.g. registered before schema was ready)
      // Default to customer home — they can still use the app
      if (!inCustomer && !inVendor) router.replace('/(customer)');
    }
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
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
