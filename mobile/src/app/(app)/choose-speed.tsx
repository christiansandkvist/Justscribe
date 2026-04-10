// This screen is no longer used — navigation goes directly to record or processing.
// Kept as a safety redirect in case of any deep-link or stale navigation reference.
import { Redirect } from 'expo-router';
export default function ChooseSpeedScreen() {
  return <Redirect href="/(app)/home" />;
}
