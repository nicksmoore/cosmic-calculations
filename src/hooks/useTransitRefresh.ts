/**
 * Daily Transit Refresh Hook
 * Automatically refreshes transit data at midnight or when a new day begins
 * Reference: Guided Astrology Workbook by Stefanie Caponi
 */

import { useState, useEffect, useCallback } from "react";
import { calculateTransits, TransitsData } from "@/lib/astrocartography/transits";

interface SimplePosition {
  name: string;
  longitude: number;
  sign: string;
  signDegree: number;
  isRetrograde: boolean;
}

interface UseTransitRefreshOptions {
  natalPlanets: SimplePosition[];
  ascendantLongitude?: number;
  midheavenLongitude?: number;
}

interface UseTransitRefreshResult {
  transits: TransitsData | null;
  lastRefreshed: Date;
  isStale: boolean;
  refresh: () => void;
}

/**
 * Get the start of today (midnight) in local time
 */
function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Get milliseconds until midnight
 */
function getMsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime() - now.getTime();
}

/**
 * Check if the date has changed since the last refresh
 */
function hasDateChanged(lastRefreshDate: Date): boolean {
  const today = getStartOfToday();
  const lastDate = new Date(
    lastRefreshDate.getFullYear(),
    lastRefreshDate.getMonth(),
    lastRefreshDate.getDate()
  );
  return today.getTime() !== lastDate.getTime();
}

export function useTransitRefresh({
  natalPlanets,
  ascendantLongitude,
  midheavenLongitude,
}: UseTransitRefreshOptions): UseTransitRefreshResult {
  const [transits, setTransits] = useState<TransitsData | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isStale, setIsStale] = useState(false);

  const refresh = useCallback(() => {
    if (natalPlanets.length === 0) return;
    
    const newTransits = calculateTransits(
      natalPlanets,
      ascendantLongitude,
      midheavenLongitude
    );
    
    setTransits(newTransits);
    setLastRefreshed(new Date());
    setIsStale(false);
    
    console.log("[Transit Refresh] Updated transits for", newTransits.date.toLocaleDateString());
  }, [natalPlanets, ascendantLongitude, midheavenLongitude]);

  // Initial calculation
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Set up midnight refresh timer
  useEffect(() => {
    const scheduleMidnightRefresh = () => {
      const msUntilMidnight = getMsUntilMidnight();
      
      console.log(
        "[Transit Refresh] Next refresh scheduled in",
        Math.round(msUntilMidnight / 1000 / 60),
        "minutes"
      );

      return setTimeout(() => {
        refresh();
        // Schedule the next midnight refresh
        scheduleMidnightRefresh();
      }, msUntilMidnight);
    };

    const timeoutId = scheduleMidnightRefresh();

    return () => clearTimeout(timeoutId);
  }, [refresh]);

  // Check if data is stale (date has changed but not yet refreshed)
  useEffect(() => {
    const checkStale = () => {
      if (hasDateChanged(lastRefreshed)) {
        setIsStale(true);
      }
    };

    // Check every minute
    const intervalId = setInterval(checkStale, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [lastRefreshed]);

  // Auto-refresh when stale
  useEffect(() => {
    if (isStale) {
      refresh();
    }
  }, [isStale, refresh]);

  return {
    transits,
    lastRefreshed,
    isStale,
    refresh,
  };
}
