import { useState, useEffect } from "react";
import StarField from "@/components/StarField";
import BirthDataForm, { BirthData } from "@/components/intake/BirthDataForm";
import ChartDashboard from "@/components/ChartDashboard";
import AuthGate from "@/components/AuthGate";

type AppState = "intake" | "chart";

// Default demo data for testing
const demoData: BirthData = {
  name: "Kathryn",
  birthDate: "1990-09-15",
  birthTime: "14:30",
  timeUnknown: false,
  location: "Los Angeles, California, USA",
  latitude: 34.0522,
  longitude: -118.2437,
  timezone: "UTC-8",
};

const BIRTH_DATA_STORAGE_KEY = "cosmic_birthData_v1";

const Index = () => {
  const [appState, setAppState] = useState<AppState>("intake");
  const [birthData, setBirthData] = useState<BirthData | null>(null);

  // Restore last chart state so navigating away (e.g., to transit detail) doesn't reset back to intake.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(BIRTH_DATA_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as BirthData;
      // Very small sanity check to avoid crashing on bad data
      if (parsed?.birthDate && parsed?.name) {
        setBirthData(parsed);
        setAppState("chart");
      }
    } catch {
      // Ignore corrupted storage
    }
  }, []);

  // Dev shortcut: Press Escape to skip to demo chart (Escape won't type in inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && appState === 'intake') {
        setBirthData(demoData);
        setAppState('chart');
        try {
          window.sessionStorage.setItem(BIRTH_DATA_STORAGE_KEY, JSON.stringify(demoData));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState]);

  const handleFormSubmit = async (data: BirthData) => {
    setBirthData(data);
    setAppState("chart");
    try {
      window.sessionStorage.setItem(BIRTH_DATA_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-background text-foreground overflow-hidden">
        <StarField />

        {appState === "intake" && (
          <BirthDataForm onSubmit={handleFormSubmit} />
        )}

        {appState === "chart" && birthData && (
          <ChartDashboard birthData={birthData} />
        )}
      </div>
    </AuthGate>
  );
};

export default Index;
