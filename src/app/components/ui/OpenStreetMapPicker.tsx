import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Loader2, MapPin, Navigation, Search } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { searchOpenStreetLocations, type GeocodeResult } from "../../lib/openStreetGeocoding";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { pickLang } from "../../i18n/pickLang";
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export interface MapPickerProps {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
  onAddressResolved?: (address: string) => void;
  searchPlaceholder?: string;
  className?: string;
  mapHeightClassName?: string;
}

function MapViewportSync({
  latitude,
  longitude,
  zoom,
}: {
  latitude: number;
  longitude: number;
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], zoom ?? map.getZoom(), { animate: true });
  }, [latitude, longitude, zoom, map]);
  return null;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export function OpenStreetMapPicker({
  latitude,
  longitude,
  onChange,
  onAddressResolved,
  searchPlaceholder,
  className = "",
  mapHeightClassName = "h-80",
}: MapPickerProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const resolvedPlaceholder =
    searchPlaceholder ?? tr("Ünvan və ya yer axtarın...", "Search for a place or address...");

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const position = useMemo<[number, number]>(() => [latitude, longitude], [latitude, longitude]);

  const runSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setSearchError(null);
        return;
      }
      setSearching(true);
      setSearchError(null);
      try {
        const rows = await searchOpenStreetLocations(trimmed);
        setResults(rows);
        setDropdownOpen(true);
        if (rows.length === 0) {
          setSearchError(tr("Yer tapılmadı", "No locations found"));
        }
      } catch {
        setResults([]);
        setSearchError(tr("Axtarış alınmadı. Yenidən cəhd edin.", "Search failed. Try again."));
      } finally {
        setSearching(false);
      }
    },
    [language],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void runSearch(searchQuery), 400);
    return () => window.clearTimeout(timer);
  }, [searchQuery, runSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyLocation = useCallback(
    (lat: number, lng: number, label?: string, zoom = 16) => {
      onChange(lat, lng);
      setMapZoom(zoom);
      if (label) {
        setSearchQuery(label);
        onAddressResolved?.(label);
      }
      setDropdownOpen(false);
    },
    [onChange, onAddressResolved],
  );

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyLocation(pos.coords.latitude, pos.coords.longitude, undefined, 16);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setSearchError(tr("Yerinizə giriş alınmadı", "Could not access your location"));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className={`space-y-2 ${className}`} ref={containerRef}>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => {
              if (results.length > 0) setDropdownOpen(true);
            }}
            placeholder={resolvedPlaceholder}
            className="w-full pl-9 pr-9 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
          )}
          {dropdownOpen && results.length > 0 && (
            <div className="absolute z-[500] mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
              {results.map((row) => (
                <button
                  key={row.placeId}
                  type="button"
                  onClick={() => applyLocation(row.latitude, row.longitude, row.label)}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                >
                  {row.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
        >
          {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
          {tr("Mənim yerim", "My location")}
        </button>
      </div>

      {searchError && <p className="text-[10px] text-amber-600 dark:text-amber-400">{searchError}</p>}

      <div
        className={`relative w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 ${mapHeightClassName}`}
      >
        <MapContainer center={position} zoom={15} scrollWheelZoom className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewportSync latitude={latitude} longitude={longitude} zoom={mapZoom} />
          <MapClickHandler onPick={(lat, lng) => applyLocation(lat, lng, undefined, undefined)} />
          <Marker
            position={position}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target as L.Marker;
                const { lat, lng } = marker.getLatLng();
                onChange(lat, lng);
                setMapZoom(undefined);
              },
            }}
          />
        </MapContainer>
      </div>

      <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
        <MapPin className="w-3 h-3 shrink-0" />
        <span>
          {tr("İşarəni sürükləyin, xəritəyə klikləyin və ya axtarın.", "Drag the pin, click the map, or search.")}{" "}
          <span className="font-mono">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        </span>
      </p>
    </div>
  );
}
