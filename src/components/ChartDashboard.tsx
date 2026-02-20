import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Box, Circle, Globe, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BirthData } from "@/components/intake/BirthDataForm";
import NatalChartWheel from "@/components/NatalChartWheel";
import CelestialSphere3D from "@/components/CelestialSphere3D";
import AstrocartographyMap from "@/components/AstrocartographyMap";
import TodaysPlanetaryBar from "@/components/TodaysPlanetaryBar";
import PlanetDetails from "@/components/PlanetDetails";
import HouseDetails from "@/components/HouseDetails";
import HouseSystemSelector from "@/components/HouseSystemSelector";
import ZodiacSystemSelector, { ZodiacSystem } from "@/components/ZodiacSystemSelector";
import UserMenu from "@/components/UserMenu";
import PodcastUpsell from "@/components/PodcastUpsell";
import NatalChartExplainer from "@/components/NatalChartExplainer";
import ChartBadges from "@/components/ChartBadges";
import AstrologyHistory from "@/components/AstrologyHistory";
import SynastryPartnerForm from "@/components/SynastryPartnerForm";
import CompatibilityScorecard from "@/components/CompatibilityScorecard";
import DailyInsightPanel from "@/components/DailyInsightPanel";
import { Planet, House } from "@/data/natalChartData";

import { useEphemeris } from "@/hooks/useEphemeris";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { getAuthenticatedClient } from "@/integrations/supabase/authClient";

interface ChartDashboardProps {
  birthData: BirthData;
}

export type HouseSystem = "placidus" | "whole-sign" | "equal";

const ChartDashboard = ({ birthData }: ChartDashboardProps) => {
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("placidus");
  const [zodiacSystem, setZodiacSystem] = useState<ZodiacSystem>("tropical");
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<"2d" | "3d" | "map">("2d");
  const [partnerData, setPartnerData] = useState<BirthData | null>(null);
  
  
  const { user } = useAuth();
  const { getToken } = useClerkAuth();
  
  // Use ephemeris for real calculations
  const { chartData, isCalculated } = useEphemeris(birthData, houseSystem, zodiacSystem);
  const { chartData: partnerChartData } = useEphemeris(partnerData, houseSystem, zodiacSystem);

  // Auto-save Big Three to profile when chart is calculated
  useEffect(() => {
    if (!chartData || !user) return;
    const sun = chartData.planets.find(p => p.name === "Sun");
    const moon = chartData.planets.find(p => p.name === "Moon");
    const rising = chartData.angles.ascendant;
    if (!sun || !moon || !rising) return;

    (async () => {
      const token = await getToken({ template: "supabase" });
      const client = token ? getAuthenticatedClient(token) : supabase;

      const { error } = await (client as any)
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            sun_sign: sun.sign,
            moon_sign: moon.sign,
            rising_sign: rising.sign,
            birth_date: birthData.birthDate,
            birth_time: birthData.timeUnknown ? null : birthData.birthTime,
            birth_location: birthData.location || null,
            birth_lat: birthData.latitude || null,
            birth_lng: birthData.longitude || null,
            time_unknown: birthData.timeUnknown || false,
          },
          { onConflict: "user_id" }
        );

      if (error) console.error("Failed to save Big Three:", error);
    })();
  }, [chartData, user, birthData, getToken]);

  const handleSelectPlanet = (planet: Planet | null) => {
    setSelectedPlanet(planet);
    setSelectedHouse(null);
  };

  const handleSelectHouse = (house: House | null) => {
    setSelectedHouse(house);
    setSelectedPlanet(null);
  };

  // Handle case when chart data isn't ready
  if (!chartData) {
    const missingCoords = !birthData.latitude || !birthData.longitude;
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          {missingCoords ? (
            <p className="text-destructive">Missing birth coordinates — please go back and select a location from the dropdown.</p>
          ) : (
            <>
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground">Calculating your chart...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* User Menu - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <UserMenu />
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 pt-6 sm:pt-8 pb-24">
        {/* Header with user info */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif text-ethereal mb-2">
            {birthData.name}'s Cosmic Blueprint
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Born {(() => {
              // Parse date parts to avoid timezone issues
              const [year, month, day] = birthData.birthDate.split('-').map(Number);
              const date = new Date(year, month - 1, day);
              return date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              });
            })()}
            {!birthData.timeUnknown && ` at ${birthData.birthTime}`}
            {birthData.location && ` • ${birthData.location.split(",")[0]}`}
          </p>
          <a
            href="https://substack.com/@holynakamoto/note/c-211239934?r=2hzwh&utm_medium=ios&utm_source=notes-share-action"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 hover:text-yellow-300 text-xs sm:text-sm underline underline-offset-4 transition-colors mt-1 inline-block"
          >
            How we calculate position data
          </a>
        </motion.header>

        {/* Main Tabs */}
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 sm:mb-8 glass-panel">
            <TabsTrigger value="chart" className="gap-2 data-[state=active]:bg-primary/20">
              <Circle className="h-4 w-4" />
              Your Chart
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-primary/20">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-0">
            {/* AI Daily Insight + Life Events */}
            <DailyInsightPanel chartData={chartData} />

            {/* Today's Planetary Transits Bar */}
            <TodaysPlanetaryBar chartData={chartData} />

            {/* Action Bar */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              {/* View Mode Toggle */}
              <div className="flex glass-panel rounded-lg p-1">
                <Button
                  variant={viewMode === "2d" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("2d")}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Circle className="h-3 w-3 sm:h-4 sm:w-4" />
                  2D
                </Button>
                <Button
                  variant={viewMode === "3d" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("3d")}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Box className="h-3 w-3 sm:h-4 sm:w-4" />
                  3D
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                  Map
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="gap-1 sm:gap-2 glass-panel border-border/50 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">House</span> System
              </Button>

              {/* Synastry */}
              <SynastryPartnerForm
                onSubmit={setPartnerData}
                onClear={() => setPartnerData(null)}
                partnerData={partnerData}
              />
            </div>

            {/* Zodiac System Selector */}
            <ZodiacSystemSelector value={zodiacSystem} onChange={setZodiacSystem} />

            {/* House System Selector */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8"
                >
                  <HouseSystemSelector
                    value={houseSystem}
                    onChange={setHouseSystem}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chart Area */}
            <div className={`grid gap-4 sm:gap-8 ${viewMode === "map" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"}`}>
              {/* Chart View */}
              <div className={viewMode === "map" ? "" : "lg:col-span-2 order-1"}>
                <AnimatePresence mode="wait">
                  {viewMode === "2d" && (
                    <motion.div
                      key="2d"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-center px-2 sm:px-0"
                    >
                      <NatalChartWheel
                        onSelectPlanet={handleSelectPlanet}
                        onSelectHouse={handleSelectHouse}
                        selectedPlanet={selectedPlanet}
                        selectedHouse={selectedHouse}
                        houseSystem={houseSystem}
                        chartData={chartData}
                        partnerChartData={partnerChartData}
                        partnerName={partnerData?.name}
                      />
                    </motion.div>
                  )}
                  {viewMode === "3d" && (
                    <motion.div
                      key="3d"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="relative aspect-square max-h-[60vh] sm:max-h-none"
                    >
                      <CelestialSphere3D
                        onSelectPlanet={handleSelectPlanet}
                        selectedPlanet={selectedPlanet}
                        houseSystem={houseSystem}
                        chartData={chartData}
                      />
                    </motion.div>
                  )}
                  {viewMode === "map" && (
                    <motion.div
                      key="map"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <AstrocartographyMap
                        chartData={chartData}
                        birthData={birthData}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Details Panel - hidden in map mode */}
              {viewMode !== "map" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-panel p-4 sm:p-6 rounded-xl h-fit order-2"
                >
                  {selectedPlanet && <PlanetDetails planet={selectedPlanet} />}
                  {selectedHouse && <HouseDetails house={selectedHouse} planets={chartData.planets} />}
                  {!selectedPlanet && !selectedHouse && (
                    <div className="text-center py-6 sm:py-12">
                      <p className="text-muted-foreground text-base sm:text-lg font-serif">
                        {viewMode === "3d" 
                          ? "Tap a planet in the sphere to reveal its cosmic significance"
                          : "Tap a planet or house to reveal its cosmic significance"
                        }
                      </p>
                      <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-2">
                        {chartData.planets.slice(0, 5).map((planet) => (
                          <button
                            key={planet.name}
                            onClick={() => handleSelectPlanet(planet)}
                            className="text-xl sm:text-2xl hover:scale-125 transition-transform p-1"
                            title={planet.name}
                          >
                            {planet.symbol}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Compatibility Scorecard - shown when synastry partner is active */}
            {partnerData && partnerChartData && (
              <CompatibilityScorecard
                natalPlanets={chartData.planets}
                partnerPlanets={partnerChartData.planets}
                partnerName={partnerData.name}
                userName={birthData.name}
              />
            )}

            {/* Chart Treasure Hunt Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-8"
            >
              <ChartBadges planets={chartData.planets} />
            </motion.div>

            {/* Natal Chart Explainer - Always visible */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <NatalChartExplainer chartData={chartData} />
            </motion.div>

            {/* Podcast Upsell Section */}
            <PodcastUpsell birthData={birthData} />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <AstrologyHistory />
          </TabsContent>
        </Tabs>
      </main>

    </div>
  );
};

export default ChartDashboard;
