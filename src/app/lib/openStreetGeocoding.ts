export interface GeocodeResult {
  placeId: string;
  label: string;
  latitude: number;
  longitude: number;
}

type NominatimSearchRow = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export async function searchOpenStreetLocations(query: string, limit = 6): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", "Accept-Language": "en,az" },
  });
  if (!res.ok) throw new Error("SEARCH_FAILED");

  const rows = (await res.json()) as NominatimSearchRow[];
  return rows
    .map((row) => ({
      placeId: String(row.place_id),
      label: row.display_name,
      latitude: Number.parseFloat(row.lat),
      longitude: Number.parseFloat(row.lon),
    }))
    .filter((row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude));
}
