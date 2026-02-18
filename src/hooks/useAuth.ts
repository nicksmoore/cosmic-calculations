import { useCallback } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";

interface UseAuthReturn {
  user: { id: string; email: string | null; name: string | null; avatar: string | null } | null;
  session: null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { user, isLoaded } = useUser();
  const { openSignIn, signOut: clerkSignOut } = useClerk();
  const { toast } = useToast();

  const signInWithGoogle = useCallback(async () => {
    openSignIn({ redirectUrl: window.location.href });
  }, [openSignIn]);

  const signOut = useCallback(async () => {
    try {
      await clerkSignOut({ redirectUrl: window.location.origin });
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (err) {
      console.error("Sign out error:", err);
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: err instanceof Error ? err.message : "Could not sign out",
      });
    }
  }, [clerkSignOut, toast]);

  return {
    user: user
      ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          name: user.fullName,
          avatar: user.imageUrl,
        }
      : null,
    session: null,
    isLoading: !isLoaded,
    signInWithGoogle,
    signOut,
  };
}
