import { Stack } from "expo-router";
import FlashMessage from "react-native-flash-message";

export default function Layout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Login/Register pages */}
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name="mentor-register" /> {/* <-- Renamed */}

        {/* Main app pages */}
        <Stack.Screen name="home" />
        <Stack.Screen name="interviewQuestions" />

        {/* Mentor Status Pages */}
        <Stack.Screen name="pending" />
        <Stack.Screen name="rejected" />

        {/* Admin Page */}
        <Stack.Screen name="adminMentors" />

        {/* User-facing Mentor Browsing */}
        <Stack.Screen name="mentorconnect" /> 

        {/* Mentor Dashboard (this is the folder) */}
        <Stack.Screen name="mentor" /> 
      </Stack>

      {/* 🔔 Global flash message */}
      <FlashMessage position="top" />
    </>
  );
}