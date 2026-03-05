"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  MapPin,
  Compass,
  Sun,
  DollarSign,
  Sparkles,
  Plus,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  Globe,
  Pencil,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripInput } from "@/lib/ai/schemas";
import {
  INTEREST_OPTIONS,
  WEATHER_OPTIONS,
  TRIP_STYLES,
  TRAVEL_RANGES,
  BUDGET_LEVELS,
  COMMON_CITIES,
  TOTAL_CARDS,
  CARD_LABELS,
} from './TripInputForm.constants'
import {
  GROUP_TYPES,
  buildTripInput as buildTripInputHelper,
  buildSummaryPills as buildSummaryPillsHelper,
  validateHomeCity,
  validateDateRange,
} from '@/lib/form/trip-input-builder'
import type { GroupType } from '@/lib/form/trip-input-builder'


interface TripInputFormProps {
  onSubmit: (input: TripInput) => void;
  isLoading: boolean;
  hasResults?: boolean;
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border bg-[#252219] border-[#2E2B25] text-[#F2EEE8] placeholder:text-[#6B6258] text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(42,191,191,0.12)] focus:border-[#2ABFBF] transition-colors";

const chipClass = (active: boolean) =>
  cn(
    "px-3.5 py-2 rounded-xl text-sm transition-all",
    active
      ? "border border-[#2ABFBF] bg-[rgba(42,191,191,0.08)] text-[#2ABFBF]"
      : "border border-[#2E2B25] text-[#A89F94] hover:border-[#2ABFBF] hover:text-[#F2EEE8]"
  );

const pillClass = (active: boolean) =>
  cn(
    "px-3.5 py-1.5 rounded-full text-sm transition-all",
    active
      ? "bg-[#2ABFBF] text-[#0F0E0D] border-[#2ABFBF] font-medium"
      : "border border-[#2E2B25] text-[#A89F94] hover:border-[#2ABFBF] hover:text-[#F2EEE8]"
  );

const ADDITIONAL_NOTES_EXAMPLES = [
  'celebrating an anniversary',
  'need wheelchair access',
  'my partner hates flying',
  'travelling with a toddler',
]

export function TripInputForm({ onSubmit, isLoading, hasResults }: TripInputFormProps) {
  const [homeCity, setHomeCity] = useState("");
  const [travelRange, setTravelRange] = useState<TripInput["travelRange"]>("any");

  const DURATION_CHIPS = [
    { label: "Weekend", value: "weekend", days: 2 },
    { label: "7 days",  value: "7",       days: 7 },
    { label: "10 days", value: "10",      days: 10 },
    { label: "2 weeks", value: "14",      days: 14 },
    { label: "Other",   value: "other",   days: null },
  ] as const

  const [selectedDurationChip, setSelectedDurationChip] = useState<string>("7")
  const [otherDurationValue, setOtherDurationValue] = useState("")
  const otherDurationRef = useRef<HTMLInputElement>(null)

  const duration = (() => {
    const chip = DURATION_CHIPS.find(c => c.value === selectedDurationChip)
    if (!chip || chip.value === "other") {
      const parsed = parseInt(otherDurationValue)
      return Number.isFinite(parsed) ? Math.min(30, Math.max(1, parsed)) : 7
    }
    return chip.days
  })()

  const [dateType, setDateType] = useState<"flexible" | "specific">("specific");
  const [dateDescription, setDateDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [showCustomInterestInput, setShowCustomInterestInput] = useState(false);
  const [weatherPreference, setWeatherPreference] = useState("warm");
  const [budgetLevel, setBudgetLevel] = useState<TripInput["budgetLevel"]>("moderate");
  const [tripStyle, setTripStyle] = useState<TripInput["tripStyle"]>("mixed");
  const [groupType, setGroupType] = useState<GroupType>(undefined)

  const [locationType, setLocationType] = useState<"open" | "region" | "specific">("open");
  const [regionValue, setRegionValue] = useState("");
  const [flexibleDatesConfirmed, setFlexibleDatesConfirmed] = useState(false);
  const [regionConfirmed, setRegionConfirmed] = useState(false);

  const [additionalNotes, setAdditionalNotes] = useState('');

  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);
  const [homeCityError, setHomeCityError] = useState<string | null>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null);

  // Card mode state (post-submit editing)
  const [activeCard, setActiveCard] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"forward" | "back">("forward");

  const customInterestInputRef = useRef<HTMLInputElement>(null);

  // City autocomplete state
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [citySuggestionIndex, setCitySuggestionIndex] = useState(-1);
  const citySuggestionsRef = useRef<HTMLDivElement>(null);

  const filteredCities = homeCity.trim().length >= 1
    ? COMMON_CITIES.filter((c) => c.toLowerCase().includes(homeCity.toLowerCase())).slice(0, 8)
    : [];

  const showSummary = (hasSubmittedOnce || !!hasResults) && !isEditing;

  // Click-outside to close city suggestion dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (citySuggestionsRef.current && !citySuggestionsRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus custom interest input when revealed
  useEffect(() => {
    if (showCustomInterestInput && customInterestInputRef.current) {
      customInterestInputRef.current.focus();
    }
  }, [showCustomInterestInput]);

  useEffect(() => {
    if (selectedDurationChip === "other" && otherDurationRef.current) {
      otherDurationRef.current.focus()
    }
  }, [selectedDurationChip])

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

  function buildTripInput(): TripInput {
    return buildTripInputHelper({
      homeCity,
      travelRange,
      dateType,
      startDate,
      endDate,
      dateDescription,
      duration,
      groupType,
      interests,
      weatherPreference,
      budgetLevel,
      tripStyle,
      locationType,
      regionValue,
      startingPoint: travelRange === "driving_distance" ? homeCity : "",
      additionalNotes,
    })
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

  function goToCard(index: number) {
    setSlideDirection(index > activeCard ? "forward" : "back");
    setActiveCard(index);
  }

  function handleNext() {
    if (activeCard === 0) {
      const cityError = validateHomeCity(homeCity);
      setHomeCityError(cityError);
      if (cityError) return;
    }
    if (activeCard < TOTAL_CARDS - 1) goToCard(activeCard + 1);
  }

  function handleBack() {
    if (activeCard > 0) goToCard(activeCard - 1);
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
            if (homeCityError) setHomeCityError(null);
          }}
          onBlur={() => setHomeCityError(validateHomeCity(homeCity))}
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
          autoFocus
          autoComplete="off"
        />
        {showCitySuggestions && filteredCities.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#2E2B25] bg-[#1C1A17] shadow-lg">
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
                    ? "bg-[#252219] text-[#F2EEE8]"
                    : "text-[#A89F94] hover:bg-[#252219] hover:text-[#F2EEE8]"
                )}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>
      {homeCityError && (
        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
          <span>⚠</span> {homeCityError}
        </p>
      )}
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
              if (range.value === "driving_distance") {
                setTripStyle("road_trip");
              }
            }}
            className={cn(chipClass(travelRange === range.value), "flex flex-col items-start text-left")}
          >
            <span className="font-medium text-foreground">{range.label}</span>
            <span className="text-xs text-muted-foreground">{range.desc}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );

  const groupTypeField = (
    <fieldset>
      <legend className="flex items-center gap-2 text-sm font-medium mb-3">
        <Users className="h-4 w-4 text-primary" />
        Who&apos;s travelling?
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {GROUP_TYPES.map((gt) => (
          <button
            key={gt.value}
            type="button"
            onClick={() => setGroupType(gt.value)}
            className={chipClass(groupType === gt.value)}
          >
            {gt.label}
          </button>
        ))}
      </div>
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
      {dateType === 'flexible' ? (
        <div className="space-y-1">
          <input
            type="text"
            value={dateDescription}
            onChange={(e) => {
              setDateDescription(e.target.value);
              setFlexibleDatesConfirmed(false);
            }}
            onBlur={() => {
              if (dateDescription.trim().length > 0) setFlexibleDatesConfirmed(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && dateDescription.trim().length > 0) {
                e.preventDefault();
                setFlexibleDatesConfirmed(true);
              }
            }}
            placeholder='e.g. "mid-April", "sometime in summer"'
            className={inputClass}
          />
          {!flexibleDatesConfirmed && dateDescription.trim().length === 0 && (
            <p className="text-xs text-muted-foreground">Press Enter or tab away to confirm</p>
          )}
          {flexibleDatesConfirmed && (
            <p className="text-xs text-primary flex items-center gap-1">
              <Check className="h-3 w-3" /> Got it
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={cn(inputClass, 'flex-1')}
            />
            <span className="hidden sm:block text-muted-foreground text-sm">to</span>
            <span className="sm:hidden text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (endDateError) setEndDateError(validateDateRange(startDate, e.target.value));
              }}
              onBlur={() => setEndDateError(validateDateRange(startDate, endDate))}
              className={cn(inputClass, 'flex-1')}
            />
          </div>
          {endDateError && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <span>⚠</span> {endDateError}
            </p>
          )}
        </>
      )}
      {dateType === "flexible" && (
        <div className="mt-3">
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground, #A89F94)" }}>Duration</p>
          <div className="flex flex-wrap gap-2">
            {DURATION_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => setSelectedDurationChip(chip.value)}
                className={chipClass(selectedDurationChip === chip.value)}
                style={{ borderRadius: "999px", padding: "8px 16px", fontSize: "13px" }}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <div
            style={{
              overflow: "hidden",
              maxHeight: selectedDurationChip === "other" ? "60px" : "0",
              transition: "max-height 0.2s ease",
            }}
          >
            <input
              ref={otherDurationRef}
              type="text"
              value={otherDurationValue}
              onChange={(e) => setOtherDurationValue(e.target.value)}
              placeholder="e.g. 12 days"
              className="mt-2"
              style={{
                background: "var(--surface, #252219)",
                border: "1px solid var(--primary, #2ABFBF)",
                borderRadius: "10px",
                padding: "10px 14px",
                width: "200px",
                fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                fontSize: "14px",
                color: "var(--foreground, #F2EEE8)",
                outline: "none",
              }}
            />
          </div>
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
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm border border-[#2ABFBF] bg-[rgba(42,191,191,0.08)] text-[#2ABFBF]"
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
            className="px-3.5 py-2.5 rounded-xl bg-[#2ABFBF] text-[#0F0E0D] text-sm hover:opacity-90 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </fieldset>
  );

  const tripStyleField = (
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
  );

  const weatherField = (
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
            onClick={() => setWeatherPreference(opt.value)}
            className={chipClass(weatherPreference === opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  )

  const budgetField = (
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
            className={cn(chipClass(budgetLevel === level.value), 'flex flex-col items-start text-left')}
          >
            <span className="font-medium text-foreground">{level.label}</span>
            <span className="text-xs text-muted-foreground">{level.desc}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )

  const additionalNotesField = (
    <fieldset>
      <legend className="flex items-center gap-2 text-sm font-medium mb-1">
        <Pencil className="h-4 w-4 text-primary" />
        Anything else?
        <span className="text-xs font-normal text-muted-foreground ml-1">optional</span>
      </legend>
      <p className="text-xs text-muted-foreground mb-2">
        e.g.{' '}
        {ADDITIONAL_NOTES_EXAMPLES.map((ex, i) => (
          <span key={ex}>
            <button
              type="button"
              className="italic hover:text-foreground transition-colors"
              onClick={() => setAdditionalNotes(ex)}
            >
              &ldquo;{ex}&rdquo;
            </button>
            {i < ADDITIONAL_NOTES_EXAMPLES.length - 1 ? ' · ' : ''}
          </span>
        ))}
      </p>
      <textarea
        value={additionalNotes}
        onChange={(e) => setAdditionalNotes(e.target.value)}
        placeholder="Any extra context for your trip..."
        rows={2}
        className={cn(inputClass, 'resize-none')}
      />
    </fieldset>
  )

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
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLocationType(opt.value)}
            className={pillClass(locationType === opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {locationType === 'region' && (
        <div className="space-y-1">
          <input
            type="text"
            value={regionValue}
            onChange={(e) => {
              setRegionValue(e.target.value);
              setRegionConfirmed(false);
            }}
            onBlur={() => {
              if (regionValue.trim().length > 0) setRegionConfirmed(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && regionValue.trim().length > 0) {
                e.preventDefault();
                setRegionConfirmed(true);
              }
            }}
            placeholder='e.g. "Southern Europe", "Southeast Asia"'
            className={inputClass}
          />
          {!regionConfirmed && regionValue.trim().length === 0 && (
            <p className="text-xs text-muted-foreground">Press Enter or tab away to confirm</p>
          )}
          {regionConfirmed && (
            <p className="text-xs text-primary flex items-center gap-1">
              <Check className="h-3 w-3" /> Got it
            </p>
          )}
        </div>
      )}
    </fieldset>
  );

  // --- Summary pills ---
  const summaryPills = buildSummaryPillsHelper({
    homeCity,
    travelRange,
    dateType,
    startDate,
    endDate,
    dateDescription,
    groupType,
    interests,
    tripStyle,
    budgetLevel,
    locationType,
    regionValue,
  })

  // --- Render: summary mode ---
  if (showSummary) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#6B6258]">Your search</h3>
          <button
            type="button"
            onClick={() => { setIsEditing(true); goToCard(0); }}
            className="inline-flex items-center gap-1 text-xs text-[#2ABFBF] hover:underline"
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
              onClick={() => { setIsEditing(true); goToCard(pill.card); }}
              className="px-2.5 py-1 rounded-full text-xs border border-[#2E2B25] bg-[#252219] text-[#A89F94] hover:border-[#2ABFBF] hover:text-[#2ABFBF] transition-colors"
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
              ? "bg-[#252219] text-[#6B6258] cursor-not-allowed"
              : "bg-[#2ABFBF] text-[#0F0E0D] font-semibold hover:opacity-90 shadow-md hover:shadow-lg"
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 border-2 border-[#6B6258]/40 border-t-[#6B6258] rounded-full animate-spin" />
              Exploring...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Compass className="h-4 w-4" />
              Find my trip
            </span>
          )}
        </button>
      </div>
    );
  }

  // --- Render: card mode (initial fill + post-submit editing) ---
  const cardContent = [
    // Step 0: Where & Who
    <div key="where-who" className="space-y-5">
      {homeCityField}
      {travelRangeField}
      {locationField}
      {groupTypeField}
    </div>,
    // Step 1: When & Weather
    <div key="when-weather" className="space-y-5">
      {datesField}
      {weatherField}
    </div>,
    // Step 2: Vibe & Budget
    <div key="vibe-budget" className="space-y-5">
      {interestsField}
      {tripStyleField}
      {budgetField}
      {additionalNotesField}
    </div>,
  ]

  const isLastCard = activeCard === TOTAL_CARDS - 1;

  const searchButton = (
    <button
      type="submit"
      disabled={isLoading}
      className={cn(
        'w-full py-3 rounded-xl font-medium text-sm transition-all',
        isLoading
          ? 'bg-muted text-muted-foreground cursor-not-allowed'
          : 'bg-foreground text-background hover:opacity-90 shadow-md hover:shadow-lg'
      )}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 border-2 border-[#6B6258]/40 border-t-[#6B6258] rounded-full animate-spin" />
          Exploring...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <Compass className="h-4 w-4" />
          Find my trip
        </span>
      )}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Progress bar — clickable segments */}
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goToCard(i)}
            className="flex-1 py-2 -my-2 group"
            title={CARD_LABELS[i]}
          >
            <div className={cn(
              'h-1.5 rounded-full w-full transition-all duration-300 group-hover:h-2',
              i === activeCard
                ? 'bg-[#2ABFBF]'
                : i < activeCard
                ? 'bg-[rgba(42,191,191,0.35)]'
                : 'bg-[#2E2B25]'
            )} />
          </button>
        ))}
      </div>

      {/* Step label */}
      <p className="text-xs text-muted-foreground font-medium">
        Step {activeCard + 1} of {TOTAL_CARDS} · {CARD_LABELS[activeCard]}
      </p>

      {/* Card content with directional slide animation */}
      <div
        key={activeCard}
        className={slideDirection === "forward" ? "animate-slide-from-right" : "animate-slide-from-left"}
      >
        {cardContent[activeCard]}
      </div>

      {/* Navigation row: Back on left, Next on right (or nothing on last card) */}
      <div className="flex items-center gap-3 pt-1">
        {activeCard > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[#2E2B25] text-sm text-[#A89F94] hover:text-[#F2EEE8] hover:border-[#2ABFBF] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        )}
        {!isLastCard && (
          <>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[#2E2B25] text-sm text-[#A89F94] hover:text-[#F2EEE8] hover:border-[#2ABFBF] transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Search button: only shown on last card */}
      {isLastCard && searchButton}
    </form>
  );
}
