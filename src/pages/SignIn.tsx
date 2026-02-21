// src/pages/SignIn.tsx
import { Navigate } from "react-router-dom";
import { SignIn } from "@clerk/clerk-react";
import StarField from "@/components/StarField";
import { useAuth } from "@/hooks/useAuth";

export default function SignInPage() {
  const { user, isLoading } = useAuth();

  // Only redirect once auth is definitively resolved — avoids spinner flash
  if (!isLoading && user) {
    return <Navigate to="/feed" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <StarField />
      <div className="relative z-10">
        <SignIn
          forceRedirectUrl="/feed"
          signUpForceRedirectUrl="/onboarding"
          appearance={{
            elements: {
              card: "glass-panel border-border/30 shadow-2xl",
              headerTitle: "font-serif text-ethereal",
              headerSubtitle: "text-muted-foreground",
              formButtonPrimary: "bg-accent hover:bg-accent/90 text-accent-foreground",
              footerActionLink: "text-accent hover:text-accent/80",
            },
          }}
        />
      </div>
    </div>
  );
}
