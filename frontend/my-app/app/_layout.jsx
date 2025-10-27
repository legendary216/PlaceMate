import { Stack } from "expo-router";
import FlashMessage from "react-native-flash-message";

export default function Layout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Login/Register pages */}
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name="mentor-register" /> 

        {/* Main app pages */}
        <Stack.Screen name="home" />
        <Stack.Screen name="interviewQuestions" />

        {/* Mentor Status Pages */}
        <Stack.Screen name="pending" />
        <Stack.Screen name="rejected" />

        {/* Admin Page */}
        <Stack.Screen name="adminMentors" />

        {/* Mentor Dashboard (this is the folder) */}
        <Stack.Screen name="mentor" /> 

        {/* Student Bookings Page */}
        <Stack.Screen name="my-bookings" /> 

        <Stack.Screen name="company" />

        {/* --- REMOVE THIS LINE --- */}
        {/* <Stack.Screen name="mentorconnect" /> */} 
        {/* The app/mentorconnect folder automatically handles this group */}

      </Stack>

      {/* 🔔 Global flash message */}
      <FlashMessage position="top" />
    </>
  );
}