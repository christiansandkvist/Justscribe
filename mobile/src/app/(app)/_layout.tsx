import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function AppLayout() {
  const { session, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) return;
    if (!session) {
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 100);
    }
  }, [session, initialized]);

  if (!initialized) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
