import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { getGoogleMapsApiKey } from "../../lib/googleMaps";
import { GoogleMapPicker } from "./GoogleMapPicker";
import { OpenStreetMapPicker, type MapPickerProps } from "./OpenStreetMapPicker";

import { pickLang } from "../../i18n/pickLang";
export function LocationMapPicker(props: MapPickerProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const hasGoogleKey = Boolean(getGoogleMapsApiKey());
  const [useOpenStreet, setUseOpenStreet] = useState(!hasGoogleKey);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);

  const handleGoogleAuthFailure = () => {
    setUseOpenStreet(true);
    setGoogleNotice(
      tr(
        "Google Maps işləmir (billing və ya API aktiv deyil). OpenStreetMap ehtiyat xəritəsi istifadə olunur.",
        "Google Maps is unavailable (billing or APIs not enabled). Using OpenStreetMap fallback.",
      ),
    );
  };

  if (useOpenStreet) {
    return (
      <div className="space-y-2">
        {googleNotice && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-200">
            <p>{googleNotice}</p>
            <p className="mt-1 text-amber-700/90 dark:text-amber-300/90">
              {tr(
                "Google Cloud-da billing aktiv edin və Maps JavaScript API + Places API aktivləşdirin.",
                "In Google Cloud: enable billing and activate Maps JavaScript API + Places API.",
              )}
            </p>
          </div>
        )}
        {!hasGoogleKey && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-[11px] text-gray-600 dark:text-gray-400">
            {tr(
              "VITE_GOOGLE_MAPS_API_KEY təyin edilməyib — OpenStreetMap istifadə olunur.",
              "VITE_GOOGLE_MAPS_API_KEY is not set — using OpenStreetMap.",
            )}
          </div>
        )}
        <OpenStreetMapPicker {...props} />
      </div>
    );
  }

  return <GoogleMapPicker {...props} onAuthFailure={handleGoogleAuthFailure} />;
}
