import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const { session, initialized } = useAuthStore();
  if (!initialized) return null;
  if (session) return <Redirect href="/(app)/home" />;
  return <Redirect href="/(auth)/login" />;
}
