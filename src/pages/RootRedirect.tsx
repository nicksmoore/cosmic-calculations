// src/pages/RootRedirect.tsx
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export default function RootRedirect() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
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
