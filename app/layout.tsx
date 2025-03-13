import { Stack } from "expo-router";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../contexts/AuthContext";
import { RouteGuard } from "../components/RouteGuard";

export default function Layout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouteGuard>
          <Stack>
            <Stack.Screen name="index" options={{ title: "Splash" }} />
            <Stack.Screen name="login" options={{ title: "Login" }} />
            <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
            <Stack.Screen name="tabs" options={{ headerShown: false }} />
          </Stack>
        </RouteGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}