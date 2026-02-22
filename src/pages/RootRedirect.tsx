// src/pages/RootRedirect.tsx
import { Navigate } from "react-router-dom";
import { CosmicLoaderPage } from "@/components/ui/CosmicLoader";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export default function RootRedirect() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  if (authLoading || (user && profileLoading)) {
    return (
      <CosmicLoaderPage />
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  const hasBirthData = !!profile?.birth_date && !!profile?.birth_lat && !!profile?.birth_lng;
  if (!hasBirthData) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/feed" replace />;
}
