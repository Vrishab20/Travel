export type Coordinates = [number, number];

export type SelectedCountry = {
  name: string;
  isoCode: string;
  coordinates: Coordinates;
};

export type SelectionStep = "origin" | "destination" | "complete";

export type HoveredCountry = {
  name: string;
  isoCode: string;
} | null;

export type MousePosition = {
  x: number;
  y: number;
};
