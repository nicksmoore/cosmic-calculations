import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";
import PostComposerSheet from "@/components/PostComposerSheet";
import RootRedirect from "./pages/RootRedirect";
import SignInPage from "./pages/SignIn";
import Onboarding from "./pages/Onboarding";
import TransitDetail from "./pages/TransitDetail";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import PublicProfile from "./pages/PublicProfile";
import Feed from "./pages/Feed";
import Match from "./pages/Match";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AuthedLayout() {
  const [postOpen, setPostOpen] = useState(false);

  return (
    <>
      <Outlet context={{ postOpen, setPostOpen }} />
      <BottomNav onOpenPost={() => setPostOpen(true)} />
      <PostComposerSheet open={postOpen} onOpenChange={setPostOpen} />
    </>
  );
}

const App = () => (
  <ClerkProvider
    publishableKey={clerkKey}
    signInForceRedirectUrl="/feed"
    signUpForceRedirectUrl="/onboarding"
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route
              path="/onboarding"
              element={
                <AuthGuard requireBirthData={false}>
                  <Onboarding />
                </AuthGuard>
              }
            />
            <Route
              element={
                <AuthGuard>
                  <AuthedLayout />
                </AuthGuard>
              }
            >
              <Route path="/feed" element={<Feed />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<PublicProfile />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/match" element={<Match />} />
              <Route path="/transit" element={<TransitDetail />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
