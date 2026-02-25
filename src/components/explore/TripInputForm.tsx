"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  MapPin,
  Compass,
  Sun,
  DollarSign,
  Users,
  Sparkles,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Home,
  Globe,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripInput } from "@/lib/ai/schemas";

const INTEREST_OPTIONS = [
  "Food & Wine",
  "Hiking",
  "Beaches",
  "Culture & History",
  "Nightlife",
  "Architecture",
  "Nature & Wildlife",
  "Adventure Sports",
  "Shopping",
  "Photography",
  "Relaxation",
  "Local Markets",
];

const WEATHER_OPTIONS = [
  { value: "warm", label: "Warm & Sunny" },
  { value: "mild", label: "Mild & Pleasant" },
  { value: "hot", label: "Hot" },
  { value: "cool", label: "Cool & Crisp" },
  { value: "any", label: "Don't Mind" },
];

const TRIP_STYLES = [
  { value: "road_trip" as const, label: "Road Trip" },
  { value: "city_hopping" as const, label: "City Hop" },
  { value: "beach" as const, label: "Beach" },
  { value: "adventure" as const, label: "Adventure" },
  { value: "cultural" as const, label: "Cultural" },
  { value: "mixed" as const, label: "Mixed" },
];

const TRAVEL_RANGES = [
  { value: "short_haul" as const, label: "Short Haul", desc: "Under 3hr flight / nearby" },
  { value: "medium_haul" as const, label: "Medium Haul", desc: "3-6hr flight / neighbouring countries" },
  { value: "long_haul" as const, label: "Long Haul", desc: "6hr+ flight / different continent" },
  { value: "driving_distance" as const, label: "Driving Distance", desc: "Road trip — stay on the road" },
  { value: "any" as const, label: "Any Distance", desc: "No preference" },
];

const BUDGET_LEVELS = [
  { value: "budget" as const, label: "Budget", desc: "Hostels, street food" },
  { value: "moderate" as const, label: "Moderate", desc: "Mid-range hotels" },
  { value: "comfortable" as const, label: "Comfortable", desc: "Nice hotels, dining" },
  { value: "luxury" as const, label: "Luxury", desc: "Top-end everything" },
];

const COMMON_CITIES = [
  "London", "Paris", "Berlin", "Amsterdam", "Dublin", "Madrid", "Barcelona",
  "Rome", "Milan", "Lisbon", "Vienna", "Prague", "Copenhagen", "Stockholm",
  "Oslo", "Helsinki", "Zurich", "Munich", "Frankfurt", "Brussels",
  "New York", "Los Angeles", "San Francisco", "Chicago", "Boston", "Miami",
  "Toronto", "Vancouver", "Montreal", "Sydney", "Melbourne", "Auckland",
  "Singapore", "Tokyo", "Hong Kong", "Dubai", "Cape Town", "Sao Paulo",
  "Mexico City", "Buenos Aires",
];

const TOTAL_STEPS = 7;
const TOTAL_CARDS = 5;

const CARD_LABELS = ["Origin", "Dates", "Interests", "Preferences", "Finish"];

interface TripInputFormProps {
  onSubmit: (input: TripInput) => void;
  isLoading: boolean;
  hasResults?: boolean;
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

const chipClass = (active: boolean) =>
  cn(
    "px-3.5 py-2 rounded-xl text-sm border transition-all",
    active
      ? "bg-accent text-accent-foreground border-primary/30 shadow-sm"
      : "border-border hover:border-primary/40 text-muted-foreground"
  );

const pillClass = (active: boolean) =>
  cn(
    "px-3.5 py-1.5 rounded-full text-sm border transition-all",
    active
      ? "bg-primary text-primary-foreground border-primary shadow-sm"
      : "border-border hover:border-primary/40 text-muted-foreground"
  );

// Step section wrapper — defined outside TripInputForm so React sees a stable
// component identity across renders (prevents input focus loss on re-render).
function StepSection({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out",
        visible
          ? "max-h-[800px] opacity-100 translate-y-0 overflow-visible"
          : "max-h-0 opacity-0 -translate-y-2 pointer-events-none overflow-hidden"
      )}
    >
      {children}
    </div>
  );
}

export function TripInputForm({ onSubmit, isLoading, hasResults }: TripInputFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [homeCity, setHomeCity] = useState("");
  const [travelRange, setTravelRange] = useState<TripInput["travelRange"]>("any");

  const [dateType, setDateType] = useState<"flexible" | "specific">("specific");
  const [dateDescription, setDateDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState(7);

  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [showCustomInterestInput, setShowCustomInterestInput] = useState(false);
  const [weatherPreference, setWeatherPreference] = useState("warm");
  const [budgetLevel, setBudgetLevel] = useState<TripInput["budgetLevel"]>("moderate");
  const [tripStyle, setTripStyle] = useState<TripInput["tripStyle"]>("mixed");

  const [locationType, setLocationType] = useState<"open" | "region" | "specific">("open");
  const [regionValue, setRegionValue] = useState("");
  const [comparePlaces, setComparePlaces] = useState<string[]>([]);
  const [newPlace, setNewPlace] = useState("");
  const [flexibleDatesConfirmed, setFlexibleDatesConfirmed] = useState(false);
  const [regionConfirmed, setRegionConfirmed] = useState(false);

  const [travelers, setTravelers] = useState(1);
  const [startingPoint, setStartingPoint] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Progressive disclosure state (initial fill)
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);

  // Card mode state (post-submit editing)
  const [activeCard, setActiveCard] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // Track if travel range was explicitly changed (since it has a default)
  const [travelRangeTouched, setTravelRangeTouched] = useState(false);

  // Debounce timer for home city
  const homeCityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const customInterestInputRef = useRef<HTMLInputElement>(null);

  // City autocomplete state
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [citySuggestionIndex, setCitySuggestionIndex] = useState(-1);
  const [showStartPointSuggestions, setShowStartPointSuggestions] = useState(false);
  const [startPointSuggestionIndex, setStartPointSuggestionIndex] = useState(-1);
  const citySuggestionsRef = useRef<HTMLDivElement>(null);
  const startPointSuggestionsRef = useRef<HTMLDivElement>(null);

  const filteredCities = homeCity.trim().length >= 1
    ? COMMON_CITIES.filter((c) => c.toLowerCase().includes(homeCity.toLowerCase())).slice(0, 8)
    : [];

  const filteredStartCities = startingPoint.trim().length >= 1
    ? COMMON_CITIES.filter((c) => c.toLowerCase().includes(startingPoint.toLowerCase())).slice(0, 8)
    : [];

  const isExpanded = hasSubmittedOnce || !!hasResults;

  // In card-edit mode or initial progressive fill?
  const showCardMode = isExpanded && isEditing;
  const showSummary = isExpanded && !isEditing;

  // Step visibility (progressive disclosure only)
  const isStepVisible = (step: number) => isExpanded || step <= currentStep;

  // Click-outside to close city suggestion dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (citySuggestionsRef.current && !citySuggestionsRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false);
      }
      if (startPointSuggestionsRef.current && !startPointSuggestionsRef.current.contains(e.target as Node)) {
        setShowStartPointSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-advance: home city (debounced 500ms)
  useEffect(() => {
    if (isExpanded) return;
    if (homeCityTimerRef.current) clearTimeout(homeCityTimerRef.current);

    if (homeCity.trim().length >= 2 && currentStep === 0) {
      homeCityTimerRef.current = setTimeout(() => {
        setCurrentStep((prev) => Math.max(prev, 1));
      }, 500);
    }

    return () => {
      if (homeCityTimerRef.current) clearTimeout(homeCityTimerRef.current);
    };
  }, [homeCity, currentStep, isExpanded]);

  // Auto-advance: travel range clicked
  useEffect(() => {
    if (isExpanded) return;
    if (travelRangeTouched && currentStep === 1) {
      setCurrentStep((prev) => Math.max(prev, 2));
    }
  }, [travelRangeTouched, currentStep, isExpanded]);

  // Auto-advance: dates filled
  useEffect(() => {
    if (isExpanded) return;
    if (currentStep !== 2) return;

    const datesFilled =
      (dateType === "flexible" && flexibleDatesConfirmed) ||
      (dateType === "specific" && startDate && endDate);

    if (datesFilled) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => Math.max(prev, 3));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [dateType, flexibleDatesConfirmed, startDate, endDate, currentStep, isExpanded]);

  // Auto-advance: at least 1 interest selected
  useEffect(() => {
    if (isExpanded) return;
    if (interests.length >= 1 && currentStep === 3) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => Math.max(prev, 4));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [interests.length, currentStep, isExpanded]);

  // Auto-advance: weather/style/budget section
  const [preferencesSectionTouched, setPreferencesSectionTouched] = useState(false);
  useEffect(() => {
    if (isExpanded) return;
    if (preferencesSectionTouched && currentStep === 4) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => Math.max(prev, 5));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [preferencesSectionTouched, currentStep, isExpanded]);

  // Auto-advance: location preference
  const [locationTouched, setLocationTouched] = useState(false);
  useEffect(() => {
    if (isExpanded) return;
    if (currentStep !== 5) return;

    const shouldAdvance =
      (locationType === "open" && locationTouched) ||
      (locationType === "region" && regionConfirmed) ||
      (locationType === "specific" && comparePlaces.length >= 1);

    if (shouldAdvance) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => Math.max(prev, 6));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [locationType, locationTouched, regionConfirmed, comparePlaces.length, currentStep, isExpanded]);

  // Auto-focus custom interest input when revealed
  useEffect(() => {
    if (showCustomInterestInput && customInterestInputRef.current) {
      customInterestInputRef.current.focus();
    }
  }, [showCustomInterestInput]);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  function addCustomInterest() {
    const trimmed = customInterest.trim();
    if (trimmed && !interests.includes(trimmed) && !INTEREST_OPTIONS.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed]);
      setCustomInterest("");
    }
  }

  const customInterests = interests.filter((i) => !INTEREST_OPTIONS.includes(i));

  function addPlace() {
    const trimmed = newPlace.trim();
    if (trimmed && !comparePlaces.includes(trimmed)) {
      setComparePlaces((prev) => [...prev, trimmed]);
      setNewPlace("");
    }
  }

  function removePlace(place: string) {
    setComparePlaces((prev) => prev.filter((p) => p !== place));
  }

  function buildTripInput(): TripInput {
    return {
      ...(homeCity ? { homeCity } : {}),
      ...(travelRange && travelRange !== "any" ? { travelRange } : {}),
      dates: {
        flexible: dateType === "flexible",
        ...(dateType === "flexible"
          ? { description: dateDescription, durationDays: { min: duration, max: duration } }
          : { startDate, endDate }
        ),
      },
      travelers,
      interests,
      weatherPreference: weatherPreference === "any" ? undefined : weatherPreference,
      budgetLevel,
      tripStyle,
      locationPreference: {
        type: locationType,
        ...(locationType === "region" ? { value: regionValue } : {}),
        ...(locationType === "specific" ? { comparePlaces } : {}),
      },
      ...(startingPoint ? { startingPoint } : {}),
      ...(additionalNotes ? { additionalNotes } : {}),
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHasSubmittedOnce(true);
    setIsEditing(false);
    onSubmit(buildTripInput());
  }

  function handleUpdateSearch() {
    setIsEditing(false);
    onSubmit(buildTripInput());
  }

  // --- Reusable field content (shared between progressive + card mode) ---

  const homeCityField = (
    <fieldset>
      <legend className="flex items-center gap-2 text-sm font-medium mb-3">
        <Home className="h-4 w-4 text-primary" />
        Where are you based?
      </legend>
      <div className="relative" ref={citySuggestionsRef}>
        <input
          type="text"
          value={homeCity}
          onChange={(e) => {
            setHomeCity(e.target.value);
            setShowCitySuggestions(true);
            setCitySuggestionIndex(-1);
          }}
          onFocus={() => {
            if (homeCity.trim().length >= 1) setShowCitySuggestions(true);
          }}
          onKeyDown={(e) => {
            if (!showCitySuggestions || filteredCities.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCitySuggestionIndex((prev) => Math.min(prev + 1, filteredCities.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCitySuggestionIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter" && citySuggestionIndex >= 0) {
              e.preventDefault();
              setHomeCity(filteredCities[citySuggestionIndex]);
              setShowCitySuggestions(false);
              setCitySuggestionIndex(-1);
            } else if (e.key === "Escape") {
              setShowCitySuggestions(false);
            }
          }}
          placeholder='e.g. "London", "Berlin", "New York"'
          className={inputClass}
          autoFocus={!isExpanded}
          autoComplete="off"
        />
        {showCitySuggestions && filteredCities.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
            {filteredCities.map((city, i) => (
              <button
                key={city}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setHomeCity(city);
                  setShowCitySuggestions(false);
                  setCitySuggestionIndex(-1);
                }}
                className={cn(
                  "w-full px-3.5 py-2 text-sm text-left transition-colors",
                  i === citySuggestionIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>
    </fieldset>
  );

  const travelRangeField = (
    <fieldset>
      <legend className="flex items-center gap-2 text-sm font-medium mb-3">
        <Globe className="h-4 w-4 text-primary" />
        How far do you want to go?
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {TRAVEL_RANGES.map((range) => (
          <button
            key={range.value}
            type="button"
            onClick={() => {
              setTravelRange(range.value);
              setTravelRangeTouched(true);
              if (range.value === "driving_distance") {
                setTripStyle("road_trip");
                if (!startingPoint.trim() && homeCity.trim()) {
                  setStartingPoint(homeCity);
                }
              }
            }}
            className={cn(chipClass(travelRange === range.value), "flex flex-col items-start text-left")}
          >
            <span className="font-medium text-foreground">{range.label}</span>
            <span className="text-xs text-muted-foreground">{range.desc}</span>
          </button>
        ))}
      </div>
      {travelRange === "driving_distance" && (
        <div className="mt-3">
          <label className="text-xs text-muted-foreground mb-1 block">
            Starting point for your road trip
          </label>
          <div className="relative" ref={startPointSuggestionsRef}>
            <input
              type="text"
              value={startingPoint}
              onChange={(e) => {
                setStartingPoint(e.target.value);
                setShowStartPointSuggestions(true);
                setStartPointSuggestionIndex(-1);
              }}
              onFocus={() => {
                if (startingPoint.trim().length >= 1) setShowStartPointSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (!showStartPointSuggestions || filteredStartCities.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setStartPointSuggestionIndex((prev) => Math.min(prev + 1, filteredStartCities.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setStartPointSuggestionIndex((prev) => Math.max(prev - 1, 0));
                } else if (e.key === "Enter" && startPointSuggestionIndex >= 0) {
                  e.preventDefault();
                  setStartingPoint(filteredStartCities[startPointSuggestionIndex]);
                  setShowStartPointSuggestions(false);
                  setStartPointSuggestionIndex(-1);
                } else if (e.key === "Escape") {
                  setShowStartPointSuggestions(false);
                }
              }}
              placeholder='e.g. "Frankfurt", "London"'
              className={inputClass}
              autoComplete="off"
            />
            {showStartPointSuggestions && filteredStartCities.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
                {filteredStartCities.map((city, i) => (
                  <button
                    key={city}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setStartingPoint(city);
                      setShowStartPointSuggestions(false);
                      setStartPointSuggestionIndex(-1);
                    }}
                    className={cn(
                      "w-full px-3.5 py-2 text-sm text-left transition-colors",
                      i === startPointSuggestionIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </fieldset>
  );

  const datesField = (
    <fieldset>
      <legend className="flex items-center gap-2 text-sm font-medium mb-3">
        <Calendar className="h-4 w-4 text-primary" />
        When do you want to travel?
      </legend>
      <div className="flex gap-2 mb-3">
        <button type="button" onClick={() => setDateType("specific")} className={pillClass(dateType === "specific")}>
          Specific dates
        </button>
        <button type="button" onClick={() => setDateType("flexible")} className={pillClass(dateType === "flexible")}>
          Flexible dates
        </button>
      </div>
      {dateType === "flexible" ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={dateDescription}
            onChange={(e) => {
              setDateDescription(e.target.value);
              setFlexibleDatesConfirmed(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && dateDescription.trim().length > 0) {
                e.preventDefault();
                setFlexibleDatesConfirmed(true);
              }
            }}
            placeholder='e.g. "mid-April", "sometime in summer"'
            className={cn(inputClass, "flex-1")}
          />
          {dateDescription.trim().length > 0 && !flexibleDatesConfirmed && (
            <button
              type="button"
              onClick={() => setFlexibleDatesConfirmed(true)}
              className="px-3 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0"
              aria-label="Confirm dates"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          {flexibleDatesConfirmed && (
            <span className="flex items-center px-3 text-primary">
              <Check className="h-4 w-4" />
            </span>
          )}
        </div>
      ) : (
        <div className="flex gap-3">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={cn(inputClass, "flex-1")} />
          <span className="self-center text-muted-foreground text-sm">to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={cn(inputClass, "flex-1")} />
        </div>
      )}
      {dateType === "flexible" && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Duration:</span>
          <input
            type="number"
            min={1}
            max={30}
            value={duration}
            onChange={(e) => setDuration(Math.min(30, Math.max(1, Number(e.target.value))))}
            className="w-16 px-2 py-2 rounded-xl border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-sm text-muted-foreground">days</span>
        </div>
      )}
    </fieldset>
  );

  const interestsField = (
    <fieldset>
      <legend className="flex items-center gap-2 text-sm font-medium mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        What are you into?
      </legend>
      <div className="flex flex-wrap gap-2">
        {INTEREST_OPTIONS.map((interest) => (
          <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={chipClass(interests.includes(interest))}>
            {interest}
          </button>
        ))}
        {customInterests.map((interest) => (
          <span
            key={interest}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm bg-accent text-accent-foreground border border-primary/30 shadow-sm"
          >
            {interest}
            <button
              type="button"
              onClick={() => toggleInterest(interest)}
              className="hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {!showCustomInterestInput && (
          <button
            type="button"
            onClick={() => setShowCustomInterestInput(true)}
            className={cn(chipClass(false), "inline-flex items-center gap-1")}
          >
            <Plus className="h-3.5 w-3.5" />
            Add your own
          </button>
        )}
      </div>
      {showCustomInterestInput && (
        <div className="flex gap-2 mt-2">
          <input
            ref={customInterestInputRef}
            type="text"
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomInterest();
              }
            }}
            onBlur={() => {
              if (!customInterest.trim()) {
                setShowCustomInterestInput(false);
              }
            }}
            placeholder="Type an interest and press Enter..."
            className={cn(inputClass, "flex-1")}
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={addCustomInterest}
            className="px-3.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </fieldset>
  );

  const preferencesField = (
    <div className="space-y-5">
      {/* Weather */}
      <fieldset>
        <legend className="flex items-center gap-2 text-sm font-medium mb-3">
          <Sun className="h-4 w-4 text-primary" />
          Weather preference
        </legend>
        <div className="flex flex-wrap gap-2">
          {WEATHER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setWeatherPreference(opt.value);
                setPreferencesSectionTouched(true);
              }}
              className={chipClass(weatherPreference === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Trip Style */}
      <fieldset>
        <legend className="flex items-center gap-2 text-sm font-medium mb-3">
          <Compass className="h-4 w-4 text-primary" />
          Trip style
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {TRIP_STYLES.map((style) => (
            <button
              key={style.value}
              type="button"
              onClick={() => {
                setTripStyle(style.value);
                setPreferencesSectionTouched(true);
              }}
              className={cn(chipClass(tripStyle === style.value), "flex items-center justify-center py-2.5")}
            >
              {style.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Budget */}
      <fieldset>
        <legend className="flex items-center gap-2 text-sm font-medium mb-3">
          <DollarSign className="h-4 w-4 text-primary" />
          Budget
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {BUDGET_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => {
                setBudgetLevel(level.value);
                setPreferencesSectionTouched(true);
              }}
              className={cn(chipClass(budgetLevel === level.value), "flex flex-col items-start text-left")}
            >
              <span className="font-medium text-foreground">{level.label}</span>
              <span className="text-xs text-muted-foreground">{level.desc}</span>
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );

  const locationField = (
    <fieldset>
      <legend className="flex items-center gap-2 text-sm font-medium mb-3">
        <MapPin className="h-4 w-4 text-primary" />
        Where are you thinking?
      </legend>
      <div className="flex gap-2 mb-3">
        {[
          { value: "open" as const, label: "Surprise me" },
          { value: "region" as const, label: "Region" },
          { value: "specific" as const, label: "Compare places" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setLocationType(opt.value);
              setLocationTouched(true);
            }}
            className={pillClass(locationType === opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {locationType === "region" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={regionValue}
            onChange={(e) => {
              setRegionValue(e.target.value);
              setRegionConfirmed(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && regionValue.trim().length > 0) {
                e.preventDefault();
                setRegionConfirmed(true);
              }
            }}
            placeholder='e.g. "Southern Europe", "Southeast Asia"'
            className={cn(inputClass, "flex-1")}
          />
          {regionValue.trim().length > 0 && !regionConfirmed && (
            <button
              type="button"
              onClick={() => setRegionConfirmed(true)}
              className="px-3 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0"
              aria-label="Confirm region"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          {regionConfirmed && (
            <span className="flex items-center px-3 text-primary">
              <Check className="h-4 w-4" />
            </span>
          )}
        </div>
      )}
      {locationType === "specific" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlace}
              onChange={(e) => setNewPlace(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPlace(); } }}
              placeholder="Add a destination..."
              className={cn(inputClass, "flex-1")}
            />
            <button type="button" onClick={addPlace} className="px-3.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {comparePlaces.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {comparePlaces.map((place) => (
                <span key={place} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-sm">
                  {place}
                  <button type="button" onClick={() => removePlace(place)} className="hover:text-destructive transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </fieldset>
  );

  const advancedAndSubmitField = (
    <div className="space-y-4">
      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {showAdvanced ? "Less options" : "More options"}
      </button>

      {showAdvanced && (
        <div className="space-y-4">
          <fieldset>
            <legend className="flex items-center gap-2 text-sm font-medium mb-2">
              <Users className="h-4 w-4 text-primary" />
              How many travelers?
            </legend>
            <input type="number" min={1} max={20} value={travelers} onChange={(e) => setTravelers(Number(e.target.value))} className="w-20 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium mb-2">Anything else we should know?</legend>
            <textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} placeholder="Any special requirements, interests, or constraints..." rows={3} className={cn(inputClass, "resize-none")} />
          </fieldset>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "w-full py-3.5 rounded-xl font-medium text-sm transition-all",
          isLoading
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-foreground text-background hover:opacity-90 shadow-md hover:shadow-lg"
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            Exploring destinations...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Compass className="h-4 w-4" />
            Explore Destinations
          </span>
        )}
      </button>
    </div>
  );

  // --- Summary pills for collapsed view ---

  const summaryPills: { label: string; card: number }[] = [];
  if (homeCity) summaryPills.push({ label: homeCity, card: 0 });
  if (travelRange && travelRange !== "any") {
    const rangeLabel = TRAVEL_RANGES.find((r) => r.value === travelRange)?.label;
    if (rangeLabel) summaryPills.push({ label: rangeLabel, card: 0 });
  }
  if (dateType === "specific" && startDate && endDate) {
    const fmt = (d: string) => {
      try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch { return d; }
    };
    summaryPills.push({ label: `${fmt(startDate)} – ${fmt(endDate)}`, card: 1 });
  } else if (dateType === "flexible" && dateDescription) {
    summaryPills.push({ label: dateDescription, card: 1 });
  }
  if (interests.length > 0) {
    summaryPills.push({ label: interests.length <= 2 ? interests.join(", ") : `${interests.length} interests`, card: 2 });
  }
  const styleLabel = TRIP_STYLES.find((s) => s.value === tripStyle)?.label;
  if (styleLabel && tripStyle !== "mixed") summaryPills.push({ label: styleLabel, card: 3 });
  const budgetLabel = BUDGET_LEVELS.find((b) => b.value === budgetLevel)?.label;
  if (budgetLabel) summaryPills.push({ label: budgetLabel, card: 3 });

  // --- Render ---

  // Mode 1: Collapsed summary (after search, not editing)
  if (showSummary) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Your search</h3>
          <button
            type="button"
            onClick={() => { setIsEditing(true); setActiveCard(0); }}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {summaryPills.map((pill, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setIsEditing(true); setActiveCard(pill.card); }}
              className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs border border-border hover:border-primary/30 transition-colors"
            >
              {pill.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleUpdateSearch}
          disabled={isLoading}
          className={cn(
            "w-full py-3 rounded-xl font-medium text-sm transition-all",
            isLoading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-foreground text-background hover:opacity-90 shadow-md hover:shadow-lg"
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              Exploring...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Compass className="h-4 w-4" />
              Search again
            </span>
          )}
        </button>
      </div>
    );
  }

  // Mode 2: Card-based editing (post-submit, editing mode)
  if (showCardMode) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Clickable progress dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveCard(i)}
              className={cn(
                "h-1.5 rounded-full flex-1 transition-all duration-300",
                i === activeCard ? "bg-primary" : i < activeCard ? "bg-primary/40" : "bg-border"
              )}
              title={CARD_LABELS[i]}
            />
          ))}
        </div>

        {/* Card label */}
        <p className="text-xs text-muted-foreground font-medium">{CARD_LABELS[activeCard]}</p>

        {/* Card content with fade animation */}
        <div key={activeCard} className="animate-fade-in">
          {activeCard === 0 && <div className="space-y-4">{homeCityField}{travelRangeField}</div>}
          {activeCard === 1 && <div className="space-y-4">{datesField}</div>}
          {activeCard === 2 && <div className="space-y-4">{interestsField}</div>}
          {activeCard === 3 && <div className="space-y-4">{preferencesField}</div>}
          {activeCard === 4 && <div className="space-y-4">{locationField}{advancedAndSubmitField}</div>}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-1">
          {activeCard > 0 && (
            <button
              type="button"
              onClick={() => setActiveCard((prev) => prev - 1)}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <div className="flex-1" />
          {activeCard < TOTAL_CARDS - 1 && (
            <button
              type="button"
              onClick={() => setActiveCard((prev) => prev + 1)}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Update search button (visible on every card except the last which has its own submit) */}
        {activeCard < TOTAL_CARDS - 1 && (
          <button
            type="button"
            onClick={handleUpdateSearch}
            disabled={isLoading}
            className={cn(
              "w-full py-3 rounded-xl font-medium text-sm transition-all",
              isLoading
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-foreground text-background hover:opacity-90 shadow-md hover:shadow-lg"
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                Exploring...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Compass className="h-4 w-4" />
                Update search
              </span>
            )}
          </button>
        )}
      </form>
    );
  }

  // Mode 3: Progressive disclosure (initial fill, first-time use)
  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      {/* Progress indicator — hidden once expanded */}
      {!isExpanded && (
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full flex-1 transition-all duration-500",
                i <= currentStep ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>
      )}

      {/* Step 0: Home City — always visible */}
      {homeCityField}

      {/* Step 1: Travel Range */}
      <StepSection visible={isStepVisible(1)}>
        {travelRangeField}
      </StepSection>

      {/* Step 2: Dates */}
      <StepSection visible={isStepVisible(2)}>
        {datesField}
      </StepSection>

      {/* Step 3: Interests */}
      <StepSection visible={isStepVisible(3)}>
        {interestsField}
      </StepSection>

      {/* Step 4: Weather + Trip Style + Budget */}
      <StepSection visible={isStepVisible(4)}>
        {preferencesField}
      </StepSection>

      {/* Step 5: Location */}
      <StepSection visible={isStepVisible(5)}>
        {locationField}
      </StepSection>

      {/* Step 6: Advanced + Submit */}
      <StepSection visible={isStepVisible(6)}>
        {advancedAndSubmitField}
      </StepSection>
    </form>
  );
}
