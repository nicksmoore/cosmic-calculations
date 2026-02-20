// src/components/PostComposerSheet.tsx
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import PostComposer from "@/components/feed/PostComposer";
import { useProfile } from "@/hooks/useProfile";
import { useEphemeris } from "@/hooks/useEphemeris";
import { BirthData } from "@/components/intake/BirthDataForm";

interface PostComposerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PostComposerSheet({ open, onOpenChange }: PostComposerSheetProps) {
  const { profile } = useProfile();

  const birthData: BirthData | null =
    profile?.birth_date && profile?.birth_lat && profile?.birth_lng
      ? {
          name:        profile.display_name ?? "You",
          birthDate:   profile.birth_date,
          birthTime:   profile.birth_time ?? "12:00",
          timeUnknown: profile.time_unknown ?? false,
          location:    profile.birth_location ?? "",
          latitude:    profile.birth_lat,
          longitude:   profile.birth_lng,
          timezone:    "UTC+0",
        }
      : null;

  const { chartData } = useEphemeris(birthData);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass-panel border-border/30 max-w-2xl mx-auto">
        <DrawerHeader>
          <DrawerTitle className="font-serif text-ethereal">Share with the cosmos</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <PostComposer chartData={chartData} onPosted={() => onOpenChange(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
