import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import LocationInput from "@/components/intake/LocationInput";
import { BirthData } from "@/components/intake/BirthDataForm";

interface SynastryPartnerFormProps {
  onSubmit: (data: BirthData) => void;
  onClear: () => void;
  partnerData: BirthData | null;
}

const SynastryPartnerForm = ({ onSubmit, onClear, partnerData }: SynastryPartnerFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<BirthData>({
    name: "",
    birthDate: "",
    birthTime: "",
    timeUnknown: false,
    location: "",
    latitude: null,
    longitude: null,
    timezone: "",
  });

  const updateFormData = (updates: Partial<BirthData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.birthDate || !formData.location || !formData.latitude) return;
    onSubmit(formData);
    setIsOpen(false);
  };

  const isValid = formData.name.trim() && formData.birthDate && formData.location && formData.latitude;

  const selectedDate = formData.birthDate
    ? parse(formData.birthDate, "yyyy-MM-dd", new Date())
    : undefined;

  if (partnerData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 glass-panel rounded-lg px-3 py-2 text-sm"
      >
        <Users className="h-4 w-4 text-pink-400" />
        <span className="text-muted-foreground">Synastry with</span>
        <span className="font-medium text-pink-300">{partnerData.name}</span>
        <Button variant="ghost" size="sm" onClick={onClear} className="h-6 w-6 p-0 ml-1">
          <X className="h-3 w-3" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 glass-panel border-border/50 text-xs sm:text-sm px-2 sm:px-3"
      >
        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-pink-400" />
        Synastry
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-panel rounded-xl p-4 sm:p-6 mt-4 space-y-4 max-w-md mx-auto">
              <h3 className="text-sm font-serif text-pink-300 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Add a partner for synastry overlay
              </h3>

              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input
                  placeholder="Partner's name"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  className="h-10 glass-panel border-border/50 text-sm"
                  maxLength={100}
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Birth date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-10 justify-start text-left text-sm glass-panel border-border/50",
                        !formData.birthDate && "text-muted-foreground"
                      )}
                    >
                      {formData.birthDate
                        ? format(selectedDate!, "MMMM d, yyyy")
                        : "Select birth date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) updateFormData({ birthDate: format(date, "yyyy-MM-dd") });
                      }}
                      disabled={(date) => date > new Date()}
                      defaultMonth={selectedDate || new Date(1990, 0)}
                      captionLayout="dropdown-buttons"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Birth time</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="partner-time-unknown" className="text-xs text-muted-foreground cursor-pointer">
                      Unknown
                    </Label>
                    <Switch
                      id="partner-time-unknown"
                      checked={formData.timeUnknown}
                      onCheckedChange={(checked) =>
                        updateFormData({ timeUnknown: checked, birthTime: checked ? "12:00" : "" })
                      }
                      className="scale-75"
                    />
                  </div>
                </div>
                {!formData.timeUnknown && (
                  <Input
                    type="time"
                    value={formData.birthTime}
                    onChange={(e) => updateFormData({ birthTime: e.target.value })}
                    className="h-10 glass-panel border-border/50 text-sm"
                  />
                )}
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Birth location</Label>
                <LocationInput
                  value={formData.location}
                  onChange={(location, lat, lng, tz) =>
                    updateFormData({ location, latitude: lat, longitude: lng, timezone: tz })
                  }
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!isValid}
                className="w-full gap-2 bg-pink-600 hover:bg-pink-700 text-white"
                size="sm"
              >
                <Sparkles className="h-3 w-3" />
                Overlay Charts
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SynastryPartnerForm;
