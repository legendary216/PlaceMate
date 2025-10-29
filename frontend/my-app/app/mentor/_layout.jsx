import { Stack } from 'expo-router';

export default function MentorLayout() {
  // This stack controls the navigation for all pages
  // inside the /mentor folder.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" /> 
      <Stack.Screen name="availability" />
    </Stack>
  );
}
