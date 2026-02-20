// src/App.tsx
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
import DesktopSidebar from "@/components/DesktopSidebar";
import RootRedirect from "./pages/RootRedirect";
import SignInPage from "./pages/SignIn";
import Onboarding from "./pages/Onboarding";
import TransitDetail from "./pages/TransitDetail";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import Match from "./pages/Match";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AuthedLayout() {
  const [postOpen, setPostOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen md:grid md:grid-cols-[18rem_minmax(0,1fr)] lg:grid-cols-[20rem_minmax(0,1fr)]">
        <DesktopSidebar onOpenPost={() => setPostOpen(true)} />
        <div className="min-w-0">
          <Outlet context={{ postOpen, setPostOpen }} />
        </div>
      </div>
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
            {/* Authenticated routes with bottom nav */}
            <Route
              element={
                <AuthGuard>
                  <AuthedLayout />
                </AuthGuard>
              }
            >
              <Route path="/feed" element={<Feed />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/match" element={<Match />} />
              <Route path="/profile/:userId" element={<PublicProfile />} />
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
