// src/App.tsx
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, NavLink, Navigate } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import AuthGuard from "@/components/AuthGuard";
import GlobalLayout from "@/components/layout/GlobalLayout";
import BottomNav from "@/components/BottomNav";
import PostComposerSheet from "@/components/PostComposerSheet";
import DesktopSidebar from "@/components/DesktopSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import RootRedirect from "./pages/RootRedirect";
import SignInPage from "./pages/SignIn";
import Onboarding from "./pages/Onboarding";
import TransitDetail from "./pages/TransitDetail";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import Match from "./pages/Match";
import Friends from "./pages/Friends";
import Marketplace from "./pages/Marketplace";
import LiveVideo from "./pages/LiveVideo";
import PublicProfile from "./pages/PublicProfile";
import PlacementMeaning from "./pages/PlacementMeaning";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AuthedLayout() {
  const [postOpen, setPostOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { profile } = useProfile();

  return (
    <>
      <div className="aurora-bar fixed top-0 left-0 right-0 z-50 pointer-events-none" aria-hidden="true" />
      <div className="min-h-screen md:grid md:grid-cols-[18rem_minmax(0,1fr)] lg:grid-cols-[20rem_minmax(0,1fr)] pointer-events-auto">
        <DesktopSidebar onOpenPost={() => setPostOpen(true)} />
        <div className="min-w-0">
          <div className="md:hidden fixed top-3 left-3 z-50">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open your profile"
              className="inline-flex rounded-full ring-1 ring-border/50 bg-background/70 backdrop-blur-sm p-1"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-serif">
                  {(profile?.display_name || user?.name || user?.email || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
          <Outlet context={{ postOpen, setPostOpen }} />
        </div>
      </div>
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="md:hidden w-[84vw] max-w-xs border-border/40 bg-background/95 p-4 backdrop-blur-md"
        >
          <div className="mt-8 space-y-5">
            <NavLink
              to="/profile"
              onClick={() => setMobileSidebarOpen(false)}
              className="block glass-panel rounded-xl p-3 hover:bg-white/5 transition-colors"
              aria-label="Open your profile"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-border/30">
                  <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} />
                  <AvatarFallback className="bg-primary/20 text-primary font-serif">
                    {(profile?.display_name || user?.name || user?.email || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">{profile?.display_name || user?.name || "You"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile?.current_status || "View your profile"}
                  </p>
                </div>
              </div>
            </NavLink>

            <nav className="space-y-1" aria-label="Mobile profile navigation">
              <NavLink
                to="/friends"
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`
                }
              >
                Starseeds
              </NavLink>
              <NavLink
                to="/feed"
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`
                }
              >
                Firmament
              </NavLink>
              <NavLink
                to="/bazaar"
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`
                }
              >
                Bazaar
              </NavLink>
              <NavLink
                to="/live"
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`
                }
              >
                The Eleventh House
              </NavLink>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
      <BottomNav onOpenPost={() => setPostOpen(true)} onSignOut={signOut} />
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
          <GlobalLayout>
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
              <Route path="/friends" element={<Friends />} />
              <Route path="/bazaar" element={<Marketplace />} />
              <Route path="/marketplace" element={<Navigate to="/bazaar" replace />} />
              <Route path="/live" element={<LiveVideo />} />
              <Route path="/match" element={<Match />} />
              <Route path="/profile/:userId" element={<PublicProfile />} />
              <Route path="/meaning" element={<PlacementMeaning />} />
              <Route path="/transit" element={<TransitDetail />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </GlobalLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
