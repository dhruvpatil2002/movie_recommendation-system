import "dotenv/config";
import type { LLMMovie, Movie, StreamingProvider } from "../schemas/movie.schema";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const DEFAULT_REGION = process.env.TMDB_REGION ?? "IN";
const DEFAULT_LANGUAGE = process.env.TMDB_LANGUAGE ?? "en-US";

function getTmdbHeaders() {
  const token = process.env.TMDB_API_TOKEN;

  if (!token) {
    throw new Error("Missing TMDB_API_TOKEN in environment variables");
  }

  return {
    accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function buildPosterUrl(path?: string | null, size: "w342" | "w500" | "original" = "w500") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

function buildProviderLogoUrl(path?: string | null, size: "w45" | "w92" | "w154" | "original" = "w92") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

type TmdbSearchMovie = {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
};

type TmdbSearchResponse = {
  results?: TmdbSearchMovie[];
};

type TmdbProviderItem = {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
};

type TmdbWatchProviderRegion = {
  link?: string;
  flatrate?: TmdbProviderItem[];
  rent?: TmdbProviderItem[];
  buy?: TmdbProviderItem[];
};

type TmdbWatchProvidersResponse = {
  results?: Record<string, TmdbWatchProviderRegion>;
};

async function tmdbFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${TMDB_BASE_URL}${path}`, {
    method: "GET",
    headers: getTmdbHeaders(),
  });

  if (!res.ok) {
    throw new Error(`TMDb request failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

async function searchMovieOnTmdb(title: string, year?: number) {
  const params = new URLSearchParams({
    query: title,
    include_adult: "false",
    language: DEFAULT_LANGUAGE,
  });

  if (year) {
    params.set("year", String(year));
  }

  const data = await tmdbFetch<TmdbSearchResponse>(`/search/movie?${params.toString()}`);
  return data.results?.[0] ?? null;
}

async function getWatchProviders(movieId: number, region: string = DEFAULT_REGION) {
  const data = await tmdbFetch<TmdbWatchProvidersResponse>(
    `/movie/${movieId}/watch/providers`
  );

  const regional = data.results?.[region];
  if (!regional) {
    return {
      streamingLink: null,
      streamingProviders: [] as StreamingProvider[],
    };
  }

  const uniqueProviders = new Map<string, StreamingProvider>();
  const providerBuckets = [
    ...(regional.flatrate ?? []),
    ...(regional.rent ?? []),
    ...(regional.buy ?? []),
  ];

  for (const provider of providerBuckets) {
    if (!uniqueProviders.has(provider.provider_name)) {
      uniqueProviders.set(provider.provider_name, {
        name: provider.provider_name,
        logoUrl: buildProviderLogoUrl(provider.logo_path),
      });
    }
  }

  return {
    streamingLink: regional.link ?? null,
    streamingProviders: Array.from(uniqueProviders.values()),
  };
}

export async function enrichMovie(movie: LLMMovie): Promise<Movie> {
  try {
    const tmdbMovie = await searchMovieOnTmdb(movie.title, movie.year);

    if (!tmdbMovie) {
      return {
        ...movie,
        posterUrl: null,
        streamingLink: null,
        streamingProviders: [],
      };
    }

    const watchData = await getWatchProviders(tmdbMovie.id);

    return {
      ...movie,
      posterUrl: buildPosterUrl(tmdbMovie.poster_path),
      streamingLink: watchData.streamingLink,
      streamingProviders: watchData.streamingProviders,
    };
  } catch (error) {
    console.error(`Failed to enrich movie: ${movie.title}`, error);

    return {
      ...movie,
      posterUrl: null,
      streamingLink: null,
      streamingProviders: [],
    };
  }
}

export async function enrichMovies(movies: LLMMovie[]): Promise<Movie[]> {
  return Promise.all(movies.map(enrichMovie));
}