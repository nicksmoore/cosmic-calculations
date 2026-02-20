// src/pages/SignIn.tsx
import { SignIn } from "@clerk/clerk-react";
import StarField from "@/components/StarField";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <StarField />
      <div className="relative z-10">
        <SignIn
          afterSignInUrl="/feed"
          afterSignUpUrl="/onboarding"
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
