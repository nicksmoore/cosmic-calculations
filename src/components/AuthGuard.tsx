// src/components/AuthGuard.tsx
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
  if (authLoading || (user && requireBirthData && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  // Not signed in → sign-in page
  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (requireBirthData) {
    const hasBirthData = !!profile?.birth_date && !!profile?.birth_lat && !!profile?.birth_lng;

    if (!hasBirthData) {
      // Encode the current path so onboarding can redirect back after completion.
      const next = encodeURIComponent(location.pathname + location.search);
      return <Navigate to={`/onboarding?next=${next}`} replace />;
    }
  }

  return <>{children}</>;
}
