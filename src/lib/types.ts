export type PriceLevel = 1 | 2 | 3 | 4;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  price: PriceLevel | null;
  distance: number;
  address: string;
  imageUrl: string;
  isOpen: boolean;
  url: string | null;
  coordinates: Coordinates;
}

export type SortMode = "best" | "closest" | "topRated";

export interface SearchFilters {
  cuisine: string;
  minRating: number;
  priceLevels: PriceLevel[];
  openNow: boolean;
}

export interface SearchParams {
  coordinates: Coordinates;
  cuisine?: string;
  radiusMiles?: number;
}
