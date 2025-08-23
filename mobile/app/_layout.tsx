import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { Stack } from "expo-router";
import "../global.css";

// Stack allows for easy navigation of previous pages by swiping right or left like a stack of pages
export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <Stack>
        <Stack.Screen name="(auth)" options={{headerShown: false}}/>
      </Stack>
    </ClerkProvider>
  )
}
