import { OpenStreetMapPicker, type MapPickerProps } from "./OpenStreetMapPicker";

/**
 * Settings / dashboard location picker.
 * Always uses OpenStreetMap for reliable interactive pin/search.
 * Public /res pages still use a Google Maps iframe embed for display only.
 */
export function LocationMapPicker(props: MapPickerProps) {
  return <OpenStreetMapPicker {...props} />;
}
