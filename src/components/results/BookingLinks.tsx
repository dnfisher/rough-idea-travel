"use client";

import { Plane, Hotel, Calculator, ExternalLink } from "lucide-react";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";

interface BookingLinksProps {
  destination: DeepPartial<DestinationSuggestion>;
}

export function BookingLinks({ destination }: BookingLinksProps) {
  const accommodation = destination.accommodation;
  const flight = destination.flightEstimate;
  const totalCost = destination.estimatedTotalTripCostEur;

  if (!accommodation && !flight && totalCost == null) return null;

  const destName = destination.name ?? "";
  const country = destination.country ?? "";
  const searchLocation = accommodation?.recommendedArea ?? `${destName}, ${country}`;

  const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(searchLocation)}`;
  const airbnbUrl = `https://www.airbnb.com/s/${encodeURIComponent(`${destName}, ${country}`)}/homes`;

  const googleFlightsUrl =
    flight?.fromAirportCode && flight?.toAirportCode
      ? `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(flight.fromAirportCode)}+to+${encodeURIComponent(flight.toAirportCode)}`
      : null;

  const skyscannerUrl =
    flight?.fromAirportCode && flight?.toAirportCode
      ? `https://www.skyscanner.net/transport/flights/${flight.fromAirportCode.toLowerCase()}/${flight.toAirportCode.toLowerCase()}/`
      : null;

  const linkClass =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors";

  return (
    <div className="space-y-4 border-t border-border pt-6">
      <h3 className="font-display font-semibold text-sm">Book Your Trip</h3>

      {/* Total cost estimate */}
      {totalCost != null && (
        <div className="rounded-xl bg-accent/50 border border-border p-4 flex items-center gap-3">
          <Calculator className="h-5 w-5 text-primary flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">Estimated Total: ~&euro;{totalCost}</p>
            <p className="text-xs text-muted-foreground">
              Flights + accommodation + daily expenses
            </p>
          </div>
        </div>
      )}

      {/* Accommodation */}
      {accommodation && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Hotel className="h-4 w-4 text-primary" />
            <span className="font-medium">Accommodation</span>
            {accommodation.averageNightlyEur != null && (
              <span className="text-muted-foreground">
                ~&euro;{accommodation.averageNightlyEur}/night
              </span>
            )}
          </div>
          {accommodation.recommendedArea && (
            <p className="text-xs text-muted-foreground ml-6">
              Recommended area: {accommodation.recommendedArea}
            </p>
          )}
          <div className="flex gap-2 ml-6">
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Booking.com
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href={airbnbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Airbnb
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* Flights */}
      {flight && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Plane className="h-4 w-4 text-primary" />
            <span className="font-medium">Flights</span>
            {flight.roundTripEur != null && (
              <span className="text-muted-foreground">
                ~&euro;{flight.roundTripEur} return
              </span>
            )}
          </div>
          {flight.fromAirportCode && flight.toAirportCode && (
            <p className="text-xs text-muted-foreground ml-6">
              {flight.fromAirportCode} &rarr;{" "}
              {destination.accommodation?.nearestAirportName
                ? `${destination.accommodation.nearestAirportName} (${flight.toAirportCode})`
                : flight.toAirportCode}
            </p>
          )}
          <div className="flex gap-2 ml-6">
            {googleFlightsUrl && (
              <a
                href={googleFlightsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Google Flights
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {skyscannerUrl && (
              <a
                href={skyscannerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Skyscanner
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
