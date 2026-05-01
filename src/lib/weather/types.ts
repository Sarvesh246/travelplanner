export interface WeatherSnapshot {
  tempF: number;
  conditionShort: string;
  iconCode: string;
  forecastDate: string;
  locationLabel?: string | null;
}

export type WeatherState =
  | { state: "ready"; data: WeatherSnapshot }
  | { state: "empty" | "error"; message: string };

export interface ApproxUserLocation {
  city?: string;
  region?: string;
  lat: number;
  lon: number;
}
