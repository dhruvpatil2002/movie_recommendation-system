"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichMovie = enrichMovie;
exports.enrichMovies = enrichMovies;
require("dotenv/config");
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
function buildPosterUrl(path, size = "w500") {
    if (!path)
        return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}
function buildProviderLogoUrl(path, size = "w92") {
    if (!path)
        return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}
async function tmdbFetch(path) {
    const res = await fetch(`${TMDB_BASE_URL}${path}`, {
        method: "GET",
        headers: getTmdbHeaders(),
    });
    if (!res.ok) {
        throw new Error(`TMDb request failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
}
async function searchMovieOnTmdb(title, year) {
    const params = new URLSearchParams({
        query: title,
        include_adult: "false",
        language: DEFAULT_LANGUAGE,
    });
    if (year) {
        params.set("year", String(year));
    }
    const data = await tmdbFetch(`/search/movie?${params.toString()}`);
    return data.results?.[0] ?? null;
}
async function getWatchProviders(movieId, region = DEFAULT_REGION) {
    const data = await tmdbFetch(`/movie/${movieId}/watch/providers`);
    const regional = data.results?.[region];
    if (!regional) {
        return {
            streamingLink: null,
            streamingProviders: [],
        };
    }
    const uniqueProviders = new Map();
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
async function enrichMovie(movie) {
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
    }
    catch (error) {
        console.error(`Failed to enrich movie: ${movie.title}`, error);
        return {
            ...movie,
            posterUrl: null,
            streamingLink: null,
            streamingProviders: [],
        };
    }
}
async function enrichMovies(movies) {
    return Promise.all(movies.map(enrichMovie));
}
