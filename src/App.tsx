import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import AuthGuard from "@/components/AuthGuard";
import RootRedirect from "./pages/RootRedirect";
import SignInPage from "./pages/SignIn";
import Onboarding from "./pages/Onboarding";
import TransitDetail from "./pages/TransitDetail";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import PublicProfile from "./pages/PublicProfile";
import Feed from "./pages/Feed";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const App = () => (
  <ClerkProvider publishableKey={clerkKey}>
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
              path="/feed"
              element={
                <AuthGuard>
                  <Feed />
                </AuthGuard>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <AuthGuard>
                  <PublicProfile />
                </AuthGuard>
              }
            />
            <Route
              path="/discover"
              element={
                <AuthGuard>
                  <Discover />
                </AuthGuard>
              }
            />
            <Route
              path="/transit"
              element={
                <AuthGuard>
                  <TransitDetail />
                </AuthGuard>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
