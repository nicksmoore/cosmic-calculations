import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useFriendNotifications } from "@/hooks/useFriendNotifications";

interface DesktopSidebarProps {
  onOpenPost: () => void;
}

export default function DesktopSidebar({ onOpenPost }: DesktopSidebarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { data: friendNotifications } = useFriendNotifications();
  const friendCount = friendNotifications?.count ?? 0;

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
              `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-gradient-to-r from-primary/30 to-accent/20 text-foreground border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-white/10 border border-transparent"
              }`
            }
          >
            🌌 Firmament
          </NavLink>
          <NavLink
            to="/friends"
            className={({ isActive }) =>
              `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-gradient-to-r from-primary/30 to-accent/20 text-foreground border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-white/10 border border-transparent"
              }`
            }
          >
            ✨ Starseeds
            {friendCount > 0 && (
              <span className="ml-2 min-w-5 h-5 px-1 rounded-full bg-accent text-accent-foreground text-[10px] inline-flex items-center justify-center">
                {friendCount}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/bazaar"
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-gradient-to-r from-primary/30 to-accent/20 text-foreground border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-white/10 border border-transparent"
              }`
            }
          >
            🧿 Bazaar
          </NavLink>
          <NavLink
            to="/live"
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-gradient-to-r from-primary/30 to-accent/20 text-foreground border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-white/10 border border-transparent"
              }`
            }
          >
            📹 The Eleventh House
          </NavLink>
        </nav>

        <Button className="w-full" onClick={onOpenPost}>
          New Post
        </Button>
        <Button variant="outline" className="w-full" onClick={signOut}>
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
