import { useState } from "react";
import { useSSO } from "@clerk/clerk-expo"
import { Alert } from "react-native";

export const useSocialAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const {startSSOFlow}= useSSO();

    const handleSocialAuth = async(strategy:"oauth_google" | "oauth_apple") => {
        setIsLoading(true);
        try {
            {/* Check if user has been authenticated */}
            const { createdSessionId, setActive } = await startSSOFlow({ strategy });

            if (createdSessionId && setActive) {
                await setActive ({ session: createdSessionId});
            }

        } catch (err) {
            console.log("Error in social auth", err);
            const provider = strategy === "oauth_google" ? "Google":"Apple";
            Alert.alert("Error", `Gailed to sign in with ${provider}. Please try again`)
            
        } finally {
            setIsLoading(false)
            
        }
    }


    return {isLoading, handleSocialAuth}
}