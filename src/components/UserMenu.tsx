import { LogOut, User, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

const UserMenu = () => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  // Get user's initials for fallback
  const getInitials = () => {
    const name = user.user_metadata?.full_name || user.email || "";
    if (user.user_metadata?.full_name) {
      return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 glass-panel px-2 py-1.5 rounded-full hover:bg-accent/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50">
          <Avatar className="h-8 w-8 border border-border/50">
            <AvatarImage 
              src={user.user_metadata?.avatar_url || user.user_metadata?.picture} 
              alt={user.user_metadata?.full_name || user.email || "User"} 
            />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-foreground hidden sm:inline max-w-[120px] truncate">
            {user.user_metadata?.full_name || user.email?.split("@")[0]}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass-panel border-border/50">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata?.full_name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" disabled>
          <FileText className="mr-2 h-4 w-4" />
          <span>My Charts</span>
          <span className="ml-auto text-xs text-muted-foreground">Soon</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" disabled>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
          <span className="ml-auto text-xs text-muted-foreground">Soon</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
