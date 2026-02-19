import { useState, useEffect, useRef } from "react"; // Location autocomplete
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationInputProps {
  value: string;
  onChange: (location: string, lat: number | null, lng: number | null, timezone: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const LocationInput = ({ value, onChange, onKeyDown }: LocationInputProps) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchLocations = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );

      if (response.ok) {
        const data: LocationSuggestion[] = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Location search error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onChange(newQuery, null, null, "");

    // Debounce the API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchLocations(newQuery);
    }, 300);
  };

  const handleSelectLocation = (suggestion: LocationSuggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    
    // Calculate timezone offset based on longitude (simplified)
    // For production, use a proper timezone API
    const tzOffset = Math.round(lng / 15);
    const timezone = `UTC${tzOffset >= 0 ? "+" : ""}${tzOffset}`;

    setQuery(suggestion.display_name);
    onChange(suggestion.display_name, lat, lng, timezone);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
      <Input
        type="text"
        placeholder="Enter city or place of birth"
        value={query}
        onChange={handleInputChange}
        onKeyDown={onKeyDown}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        className="pl-12 pr-10 h-14 text-lg glass-panel border-border/50 focus:border-accent"
        autoFocus
      />
      {isLoading && (
        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 w-full mt-2 glass-panel rounded-lg overflow-hidden shadow-xl border border-border/50">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelectLocation(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors flex items-start gap-3 border-b border-border/30 last:border-0"
            >
              <MapPin className="h-4 w-4 mt-1 text-accent shrink-0" />
              <span className="text-sm line-clamp-2">{suggestion.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
