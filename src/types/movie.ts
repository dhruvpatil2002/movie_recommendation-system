export interface Movie {
  title: string;
  year: number;
  rating: number;
  genre: string[];
  cast: string[];

  posterUrl?: string;
  reason?: string;
  streamingLink?: string;

  streamingProviders?: {
    name: string;
    logoUrl?: string;
  }[];
}

export interface RecommendationsResponse {
  recommendations: Movie[];
}