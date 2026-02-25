// src/components/AuthGuard.tsx
import { Navigate, useLocation } from "react-router-dom";
import { CosmicLoaderPage } from "@/components/ui/CosmicLoader";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface AuthGuardProps {
  children: React.ReactNode;
  requireBirthData?: boolean; // default true
}

export default function AuthGuard({ children, requireBirthData = true }: AuthGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  // Wait for both auth AND profile to resolve before making any redirect decision.
  // Without this, a returning user with birth data would flash /onboarding for a frame.
  if (authLoading || (user && profileLoading)) {
    return (
      <CosmicLoaderPage />
    );
  }

  // Not signed in → sign-in page
  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (requireBirthData) {
    const hasBirthData = !!profile?.birth_date && !!profile?.birth_lat && !!profile?.birth_lng;
    if (!hasBirthData) {
      const next = encodeURIComponent(location.pathname + location.search);
      return <Navigate to={`/onboarding?next=${next}`} replace />;
    }
  } else {
    // requireBirthData=false (onboarding route): redirect already-onboarded users to /feed
    const hasBirthData = !!profile?.birth_date && !!profile?.birth_lat && !!profile?.birth_lng;
    if (hasBirthData) {
      return <Navigate to="/feed" replace />;
    }
  }

  return <>{children}</>;
}
