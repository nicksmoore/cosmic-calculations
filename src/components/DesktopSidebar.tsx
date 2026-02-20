import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface DesktopSidebarProps {
  onOpenPost: () => void;
}

export default function DesktopSidebar({ onOpenPost }: DesktopSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();

  return (
    <aside className="hidden md:flex md:w-72 lg:w-80 shrink-0 border-r border-border/40 p-6 sticky top-0 h-screen z-20 backdrop-blur-sm">
      <div className="w-full space-y-6">
        <button
          onClick={() => navigate("/profile")}
          className="w-full text-left glass-panel rounded-xl p-4 hover:bg-white/5 transition-colors"
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
        </button>

        <nav className="space-y-1" aria-label="Desktop navigation">
          <NavLink
            to="/feed"
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`
            }
          >
            Sky Feed
          </NavLink>
          <NavLink
            to="/match"
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`
            }
          >
            Match
          </NavLink>
        </nav>

        <Button className="w-full" onClick={onOpenPost}>
          New Post
        </Button>
      </div>
    </aside>
  );
}
