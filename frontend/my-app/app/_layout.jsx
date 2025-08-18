import { Stack } from "expo-router";
import FlashMessage from "react-native-flash-message";

export default function Layout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
      </Stack>

      {/* 🔔 Global flash message */}
      <FlashMessage position="top" />
    </>
  );
}
