"use client";

import { useState } from "react";
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
  ChevronDown,
  ChevronUp,
  Home,
  Plane,
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
  { value: "short_haul" as const, label: "Short Haul", desc: "Under 3hr flight" },
  { value: "medium_haul" as const, label: "Medium Haul", desc: "3-6hr flight" },
  { value: "long_haul" as const, label: "Long Haul", desc: "6hr+ flight" },
  { value: "any" as const, label: "Any Distance", desc: "No preference" },
];

const BUDGET_LEVELS = [
  { value: "budget" as const, label: "Budget", desc: "Hostels, street food" },
  { value: "moderate" as const, label: "Moderate", desc: "Mid-range hotels" },
  { value: "comfortable" as const, label: "Comfortable", desc: "Nice hotels, dining" },
  { value: "luxury" as const, label: "Luxury", desc: "Top-end everything" },
];

interface TripInputFormProps {
  onSubmit: (input: TripInput) => void;
  isLoading: boolean;
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

export function TripInputForm({ onSubmit, isLoading }: TripInputFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [homeCity, setHomeCity] = useState("");
  const [travelRange, setTravelRange] = useState<TripInput["travelRange"]>("any");

  const [dateType, setDateType] = useState<"flexible" | "specific">("flexible");
  const [dateDescription, setDateDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationMin, setDurationMin] = useState(5);
  const [durationMax, setDurationMax] = useState(10);

  const [interests, setInterests] = useState<string[]>([]);
  const [weatherPreference, setWeatherPreference] = useState("warm");
  const [budgetLevel, setBudgetLevel] = useState<TripInput["budgetLevel"]>("moderate");
  const [tripStyle, setTripStyle] = useState<TripInput["tripStyle"]>("mixed");

  const [locationType, setLocationType] = useState<"open" | "region" | "specific">("open");
  const [regionValue, setRegionValue] = useState("");
  const [comparePlaces, setComparePlaces] = useState<string[]>([]);
  const [newPlace, setNewPlace] = useState("");

  const [travelers, setTravelers] = useState(1);
  const [startingPoint, setStartingPoint] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: TripInput = {
      ...(homeCity ? { homeCity } : {}),
      ...(travelRange && travelRange !== "any" ? { travelRange } : {}),
      dates: {
        flexible: dateType === "flexible",
        ...(dateType === "flexible" ? { description: dateDescription } : { startDate, endDate }),
        durationDays: { min: durationMin, max: durationMax },
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
    onSubmit(input);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Home City */}
      <fieldset>
        <legend className="flex items-center gap-2 text-sm font-medium mb-3">
          <Home className="h-4 w-4 text-primary" />
          Where are you based?
        </legend>
        <input
          type="text"
          value={homeCity}
          onChange={(e) => setHomeCity(e.target.value)}
          placeholder='e.g. "London", "Berlin", "New York"'
          className={inputClass}
        />
      </fieldset>

      {/* Travel Range */}
      <fieldset>
        <legend className="flex items-center gap-2 text-sm font-medium mb-3">
          <Plane className="h-4 w-4 text-primary" />
          How far do you want to go?
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {TRAVEL_RANGES.map((range) => (
            <button
              key={range.value}
              type="button"
              onClick={() => setTravelRange(range.value)}
              className={cn(chipClass(travelRange === range.value), "flex flex-col items-start text-left")}
            >
              <span className="font-medium text-foreground">{range.label}</span>
              <span className="text-xs text-muted-foreground">{range.desc}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Dates */}
      <fieldset>
        <legend className="flex items-center gap-2 text-sm font-medium mb-3">
          <Calendar className="h-4 w-4 text-primary" />
          When do you want to travel?
        </legend>
        <div className="flex gap-2 mb-3">
          <button type="button" onClick={() => setDateType("flexible")} className={pillClass(dateType === "flexible")}>
            Flexible dates
          </button>
          <button type="button" onClick={() => setDateType("specific")} className={pillClass(dateType === "specific")}>
            Specific dates
          </button>
        </div>
        {dateType === "flexible" ? (
          <input
            type="text"
            value={dateDescription}
            onChange={(e) => setDateDescription(e.target.value)}
            placeholder='e.g. "mid-April", "sometime in summer"'
            className={inputClass}
          />
        ) : (
          <div className="flex gap-3">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={cn(inputClass, "flex-1")} />
            <span className="self-center text-muted-foreground text-sm">to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={cn(inputClass, "flex-1")} />
          </div>
        )}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Duration:</span>
          <input type="number" min={1} max={90} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className="w-16 px-2 py-2 rounded-xl border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <span className="text-sm text-muted-foreground">to</span>
          <input type="number" min={1} max={90} value={durationMax} onChange={(e) => setDurationMax(Number(e.target.value))} className="w-16 px-2 py-2 rounded-xl border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <span className="text-sm text-muted-foreground">days</span>
        </div>
      </fieldset>

      {/* Interests */}
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
        </div>
      </fieldset>

      {/* Weather */}
      <fieldset>
        <legend className="flex items-center gap-2 text-sm font-medium mb-3">
          <Sun className="h-4 w-4 text-primary" />
          Weather preference
        </legend>
        <div className="flex flex-wrap gap-2">
          {WEATHER_OPTIONS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => setWeatherPreference(opt.value)} className={chipClass(weatherPreference === opt.value)}>
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
              onClick={() => setTripStyle(style.value)}
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
              onClick={() => setBudgetLevel(level.value)}
              className={cn(chipClass(budgetLevel === level.value), "flex flex-col items-start text-left")}
            >
              <span className="font-medium text-foreground">{level.label}</span>
              <span className="text-xs text-muted-foreground">{level.desc}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Location */}
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
            <button key={opt.value} type="button" onClick={() => setLocationType(opt.value)} className={pillClass(locationType === opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>
        {locationType === "region" && (
          <input type="text" value={regionValue} onChange={(e) => setRegionValue(e.target.value)} placeholder='e.g. "Southern Europe", "Southeast Asia"' className={inputClass} />
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
            <legend className="text-sm font-medium mb-2">Starting point (for road trips)</legend>
            <input type="text" value={startingPoint} onChange={(e) => setStartingPoint(e.target.value)} placeholder='e.g. "Frankfurt", "London"' className={inputClass} />
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
    </form>
  );
}
