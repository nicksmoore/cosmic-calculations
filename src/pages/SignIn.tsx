// src/pages/SignIn.tsx
import { Navigate } from "react-router-dom";
import { SignIn } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import StarField from "@/components/StarField";
import { useAuth } from "@/hooks/useAuth";

export default function SignInPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/feed" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <StarField />
      <div className="relative z-10">
        <SignIn
          afterSignInUrl="/feed"
          afterSignUpUrl="/onboarding"
          appearance={{
            elements: {
              card: "glass-panel border-border/30 shadow-2xl w-[360px] max-w-[92vw]",
              headerTitle: "font-serif text-ethereal",
              headerSubtitle: "text-muted-foreground",
              formButtonPrimary: "bg-accent hover:bg-accent/90 text-accent-foreground h-11 text-base font-semibold",
              socialButtonsBlockButton:
                "bg-white text-black hover:bg-zinc-100 border-2 border-white h-11 text-base font-semibold shadow-md",
              socialButtonsBlockButtonText: "text-black font-semibold",
              dividerLine: "bg-border/60",
              dividerText: "text-muted-foreground",
              footerActionLink: "text-accent hover:text-accent/80",
            },
          }}
        />
      </div>
    </div>
  );
}
