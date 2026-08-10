export function getGoogleMapsApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof key === "string" ? key.trim() : "";
}

let loadPromise: Promise<void> | null = null;
let loadedLanguage: string | null = null;

export function loadGoogleMapsApi(language = "en"): Promise<void> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("MISSING_GOOGLE_MAPS_API_KEY"));
  }

  if (window.google?.maps && loadedLanguage === language) {
    return Promise.resolve();
  }

  if (loadPromise && loadedLanguage === language) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const callbackName = `__gmapsInit_${Date.now()}`;
    const win = window as unknown as Record<string, () => void>;
    win[callbackName] = () => {
      loadedLanguage = language;
      resolve();
      delete win[callbackName];
    };

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&libraries=places&language=${encodeURIComponent(language)}&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      loadPromise = null;
      delete win[callbackName];
      reject(new Error("GOOGLE_MAPS_LOAD_FAILED"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
