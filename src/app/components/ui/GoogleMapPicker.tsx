import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { getGoogleMapsApiKey, loadGoogleMapsApi } from "../../lib/googleMaps";
import type { MapPickerProps } from "./OpenStreetMapPicker";

import { pickLang } from "../../i18n/pickLang";
type GoogleMapPickerProps = MapPickerProps & {
  onAuthFailure: () => void;
};

export function GoogleMapPicker({
  latitude,
  longitude,
  onChange,
  onAddressResolved,
  searchPlaceholder,
  className = "",
  mapHeightClassName = "h-80",
  onAuthFailure,
}: GoogleMapPickerProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const resolvedPlaceholder =
    searchPlaceholder ?? tr("Ünvan və ya yer axtarın...", "Search for a place or address...");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const internalUpdateRef = useRef(false);
  const authFailureRef = useRef(onAuthFailure);
  authFailureRef.current = onAuthFailure;

  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const mapsLanguage = language === "az" ? "az" : language === "ru" ? "ru" : "en";

  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (!geocoderRef.current) return;
      geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
        if (status !== "OK" || !results?.[0]) return;
        const label = results[0].formatted_address;
        if (searchInputRef.current) searchInputRef.current.value = label;
        onAddressResolved?.(label);
      });
    },
    [onAddressResolved],
  );

  const applyPosition = useCallback(
    (lat: number, lng: number, options?: { address?: string; zoom?: number; reverse?: boolean }) => {
      internalUpdateRef.current = true;
      onChange(lat, lng);
      const position = { lat, lng };
      markerRef.current?.setPosition(position);
      mapRef.current?.panTo(position);
      if (options?.zoom != null) mapRef.current?.setZoom(options.zoom);
      if (options?.address) {
        if (searchInputRef.current) searchInputRef.current.value = options.address;
        onAddressResolved?.(options.address);
      } else if (options?.reverse) {
        reverseGeocode(lat, lng);
      }
    },
    [onChange, onAddressResolved, reverseGeocode],
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;
    let cancelled = false;
    let authWatchdogs: number[] = [];

    const win = window as unknown as Record<string, unknown>;
    const previousAuthFailure = win.gm_authFailure;
    win.gm_authFailure = () => {
      authFailureRef.current();
    };

    const init = async () => {
      try {
        await loadGoogleMapsApi(mapsLanguage);
        if (cancelled || !mapContainerRef.current || !searchInputRef.current) return;

        const center = { lat: latitude, lng: longitude };
        const map = new google.maps.Map(mapContainerRef.current, {
          center,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        const marker = new google.maps.Marker({ map, position: center, draggable: true });
        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
          fields: ["geometry", "formatted_address", "name"],
        });

        geocoderRef.current = new google.maps.Geocoder();
        mapRef.current = map;
        markerRef.current = marker;
        autocompleteRef.current = autocomplete;

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const loc = place.geometry?.location;
          if (!loc) return;
          applyPosition(loc.lat(), loc.lng(), {
            address: place.formatted_address || place.name || undefined,
            zoom: 16,
          });
        });

        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          if (!pos) return;
          applyPosition(pos.lat(), pos.lng(), { reverse: true });
        });

        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          applyPosition(event.latLng.lat(), event.latLng.lng(), { reverse: true });
        });

        google.maps.event.addListenerOnce(map, "tilesloaded", () => {
          if (cancelled) return;
          google.maps.event.trigger(map, "resize");
          map.setCenter(center);
        });

        if (cancelled) return;
        setMapReady(true);
        setLoadError(null);

        const checkAuthError = () => {
          if (cancelled) return;
          const hasGoogleError = Boolean(mapContainerRef.current?.querySelector(".gm-err-container"));
          if (hasGoogleError) authFailureRef.current();
        };
        authWatchdogs.push(window.setTimeout(checkAuthError, 1500));
        authWatchdogs.push(window.setTimeout(checkAuthError, 3500));
      } catch {
        if (!cancelled) authFailureRef.current();
      }
    };

    void init();

    // Hard timeout: never leave settings stuck on the Google spinner.
    authWatchdogs.push(
      window.setTimeout(() => {
        if (cancelled) return;
        if (!mapRef.current || mapContainerRef.current?.querySelector(".gm-err-container")) {
          authFailureRef.current();
        }
      }, 6000),
    );

    return () => {
      cancelled = true;
      authWatchdogs.forEach((id) => window.clearTimeout(id));
      win.gm_authFailure = previousAuthFailure;
      autocompleteRef.current = null;
      markerRef.current = null;
      mapRef.current = null;
      geocoderRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLanguage]);

  useEffect(() => {
    if (!mapReady || !markerRef.current || !mapRef.current) return;
    if (internalUpdateRef.current) {
      internalUpdateRef.current = false;
      return;
    }
    const position = { lat: latitude, lng: longitude };
    markerRef.current.setPosition(position);
    mapRef.current.panTo(position);
  }, [latitude, longitude, mapReady]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyPosition(pos.coords.latitude, pos.coords.longitude, { zoom: 16, reverse: true });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLoadError(tr("Yerinizə giriş alınmadı", "Could not access your location"));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            ref={searchInputRef}
            type="text"
            defaultValue=""
            placeholder={resolvedPlaceholder}
            disabled={!mapReady}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={!mapReady || locating}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
        >
          {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
          {tr("Mənim yerim", "My location")}
        </button>
      </div>

      {loadError && <p className="text-[10px] text-amber-600 dark:text-amber-400">{loadError}</p>}

      <div
        className={`relative w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 ${mapHeightClassName}`}
      >
        {!mapReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/80 dark:bg-gray-800/80">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
        <MapPin className="w-3 h-3 shrink-0" />
        <span>
          {tr(
            "Google Maps-də axtarın, işarəni sürükləyin və ya xəritəyə klikləyin.",
            "Search with Google Maps, drag the pin, or click the map.",
          )}{" "}
          <span className="font-mono">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        </span>
      </p>
    </div>
  );
}
