import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Clock, Calendar, User, Sparkles, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import LocationInput from "./LocationInput";
import UserMenu from "@/components/UserMenu";
import PdfUpload from "./PdfUpload";

export interface BirthData {
  name: string;
  birthDate: string;
  birthTime: string;
  timeUnknown: boolean;
  location: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
}

interface BirthDataFormProps {
  onSubmit: (data: BirthData) => void;
}

const steps = [
  { id: "name", title: "What's your name?", subtitle: "Let's begin your cosmic journey" },
  { id: "date", title: "When were you born?", subtitle: "The stars were aligned just for you" },
  { id: "time", title: "What time were you born?", subtitle: "Precision reveals deeper insights" },
  { id: "location", title: "Where were you born?", subtitle: "Your cosmic coordinates matter" },
];

const BirthDataForm = ({ onSubmit }: BirthDataFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!formData.name.trim()) {
          newErrors.name = "Please enter your name";
        } else if (formData.name.length > 100) {
          newErrors.name = "Name must be less than 100 characters";
        }
        break;
      case 1:
        if (!formData.birthDate) {
          newErrors.birthDate = "Please enter your birth date";
        }
        break;
      case 2:
        if (!formData.timeUnknown && !formData.birthTime) {
          newErrors.birthTime = "Please enter your birth time or mark as unknown";
        }
        break;
      case 3:
        if (!formData.location.trim()) {
          newErrors.location = "Please enter your birth location";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onSubmit(formData);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNext();
    }
  };

  const updateFormData = (updates: Partial<BirthData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setErrors({});
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                onKeyDown={handleKeyDown}
                className="pl-12 h-14 text-lg glass-panel border-border/50 focus:border-accent"
                autoFocus
                maxLength={100}
              />
            </div>
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name}</p>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => updateFormData({ birthDate: e.target.value })}
                onKeyDown={handleKeyDown}
                className="pl-12 h-14 text-lg glass-panel border-border/50 focus:border-accent"
                autoFocus
              />
            </div>
            {errors.birthDate && (
              <p className="text-destructive text-sm">{errors.birthDate}</p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 glass-panel rounded-lg">
              <Label htmlFor="time-unknown" className="text-base cursor-pointer">
                I don't know my birth time
              </Label>
              <Switch
                id="time-unknown"
                checked={formData.timeUnknown}
                onCheckedChange={(checked) =>
                  updateFormData({ timeUnknown: checked, birthTime: checked ? "12:00" : "" })
                }
              />
            </div>
            
            {!formData.timeUnknown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="time"
                  value={formData.birthTime}
                  onChange={(e) => updateFormData({ birthTime: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="pl-12 h-14 text-lg glass-panel border-border/50 focus:border-accent"
                  autoFocus
                />
              </motion.div>
            )}
            
            {errors.birthTime && (
              <p className="text-destructive text-sm">{errors.birthTime}</p>
            )}
            
            {formData.timeUnknown && (
              <p className="text-sm text-muted-foreground">
                We'll use noon as the default time. Some house placements may be less accurate.
              </p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <LocationInput
              value={formData.location}
              onChange={(location, lat, lng, tz) =>
                updateFormData({
                  location,
                  latitude: lat,
                  longitude: lng,
                  timezone: tz,
                })
              }
              onKeyDown={handleKeyDown}
            />
            {errors.location && (
              <p className="text-destructive text-sm">{errors.location}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const handlePdfExtracted = (data: BirthData) => {
    setFormData(data);
    setShowUpload(false);
    onSubmit(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* User Menu - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <UserMenu />
      </div>

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {showUpload ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl md:text-4xl font-serif text-ethereal">
                  Upload Your Chart
                </h2>
                <p className="text-muted-foreground">
                  AI will extract your birth data automatically
                </p>
              </div>

              <PdfUpload onExtracted={handlePdfExtracted} />

              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowUpload(false)}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Enter data manually instead
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Progress Indicator */}
              <div className="flex justify-center gap-2 mb-12">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      index === currentStep
                        ? "w-8 bg-accent"
                        : index < currentStep
                        ? "w-4 bg-accent/60"
                        : "w-4 bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl md:text-4xl font-serif text-ethereal">
                      {steps[currentStep].title}
                    </h2>
                    <p className="text-muted-foreground">
                      {steps[currentStep].subtitle}
                    </p>
                  </div>

                  {renderStep()}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between mt-12">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>

                <Button
                  onClick={handleNext}
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 nebula-glow"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Chart
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Upload PDF Option */}
              {currentStep === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 text-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-4 text-sm text-muted-foreground">
                        or
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowUpload(true)}
                    className="mt-4 gap-2 glass-panel border-border/50"
                  >
                    <FileUp className="h-4 w-4" />
                    Upload existing chart PDF
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BirthDataForm;
