export function getGoogleMapsApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof key === "string" ? key.trim() : "";
}

let loadPromise: Promise<void> | null = null;
let loadedLanguage: string | null = null;
let pendingLanguage: string | null = null;

export function loadGoogleMapsApi(language = "en"): Promise<void> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("MISSING_GOOGLE_MAPS_API_KEY"));
  }

  // Already loaded — language on the script URL cannot be changed without a full reload.
  if (window.google?.maps) {
    loadedLanguage = loadedLanguage ?? language;
    return Promise.resolve();
  }

  if (loadPromise && pendingLanguage === language) {
    return loadPromise;
  }

  // Reuse in-flight load even if language differs; avoid injecting duplicate scripts.
  if (loadPromise) {
    return loadPromise;
  }

  pendingLanguage = language;
  loadPromise = new Promise<void>((resolve, reject) => {
    const callbackName = `__gmapsInit_${Date.now()}`;
    const win = window as unknown as Record<string, (() => void) | undefined>;

    const fail = (error: Error) => {
      loadPromise = null;
      pendingLanguage = null;
      delete win[callbackName];
      reject(error);
    };

    win[callbackName] = () => {
      loadedLanguage = language;
      pendingLanguage = null;
      resolve();
      delete win[callbackName];
    };

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&libraries=places&language=${encodeURIComponent(language)}&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => fail(new Error("GOOGLE_MAPS_LOAD_FAILED"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
