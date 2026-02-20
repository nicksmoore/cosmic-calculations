// src/pages/Onboarding.tsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import StarField from "@/components/StarField";
import BirthDataForm, { BirthData } from "@/components/intake/BirthDataForm";
import { useProfile } from "@/hooks/useProfile";

function getSafeNext(raw: string | null): string {
  if (!raw) return "/feed";
  const decoded = decodeURIComponent(raw);
  if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  return "/feed";
}

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateProfile } = useProfile();

  const handleSubmit = async (data: BirthData) => {
    const success = await updateProfile({
      display_name: data.name,
      birth_date: data.birthDate,
      birth_time: data.timeUnknown ? null : data.birthTime,
      birth_location: data.location,
      birth_lat: data.latitude,
      birth_lng: data.longitude,
      time_unknown: data.timeUnknown,
    });
    if (!success) return; // updateProfile already shows a toast on failure
    const destination = getSafeNext(searchParams.get("next"));
    navigate(destination, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <StarField />

      <div className="relative z-10 pt-8 pb-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 text-muted-foreground text-sm mb-2"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Step 1 of 1
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-2xl font-serif text-ethereal"
        >
          Your Cosmic Blueprint
        </motion.h1>
      </div>

      <BirthDataForm onSubmit={handleSubmit} />
    </div>
  );
}
