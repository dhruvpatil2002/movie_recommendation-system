"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsSchema = exports.MovieSchema = exports.StreamingProviderSchema = exports.LLMRecommendationsSchema = exports.LLMMovieSchema = void 0;
const zod_1 = require("zod");
// 1) Raw LLM output
exports.LLMMovieSchema = zod_1.z.object({
    title: zod_1.z.string().describe("Movie title"),
    year: zod_1.z.number().int().describe("Release year"),
    genre: zod_1.z.array(zod_1.z.string()).describe("List of genres"),
    cast: zod_1.z.array(zod_1.z.string()).max(3).describe("Top 3 cast members"),
    reason: zod_1.z
        .string()
        .describe("Why this matches the user's mood and preference"),
    rating: zod_1.z.number().min(1).max(10).describe("IMDb-style rating out of 10"),
});
exports.LLMRecommendationsSchema = zod_1.z.object({
    movies: zod_1.z.array(exports.LLMMovieSchema).describe("List of recommended movies"),
});
// 2) Final enriched API response
exports.StreamingProviderSchema = zod_1.z.object({
    name: zod_1.z.string().describe("Streaming platform name"),
    logoUrl: zod_1.z.string().url().nullable().optional(),
});
exports.MovieSchema = zod_1.z.object({
    title: zod_1.z.string(),
    year: zod_1.z.number().int(),
    genre: zod_1.z.array(zod_1.z.string()),
    cast: zod_1.z.array(zod_1.z.string()),
    reason: zod_1.z.string(),
    rating: zod_1.z.number().min(1).max(10),
    posterUrl: zod_1.z.string().url().nullable().optional(),
    streamingLink: zod_1.z.string().url().nullable().optional(),
    streamingProviders: zod_1.z.array(exports.StreamingProviderSchema).default([]),
});
exports.RecommendationsSchema = zod_1.z.object({
    movies: zod_1.z.array(exports.MovieSchema),
});
