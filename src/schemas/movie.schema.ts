import { z } from "zod";

// 1) Raw LLM output
export const LLMMovieSchema = z.object({
  title: z.string().describe("Movie title"),
  year: z.number().int().describe("Release year"),
  genre: z.array(z.string()).describe("List of genres"),
  cast: z.array(z.string()).max(3).describe("Top 3 cast members"),
  reason: z
    .string()
    .describe("Why this matches the user's mood and preference"),
  rating: z.number().min(1).max(10).describe("IMDb-style rating out of 10"),
});

export const LLMRecommendationsSchema = z.object({
  movies: z.array(LLMMovieSchema).describe("List of recommended movies"),
});

// 2) Final enriched API response
export const StreamingProviderSchema = z.object({
  name: z.string().describe("Streaming platform name"),
  logoUrl: z.string().url().nullable().optional(),
});

export const MovieSchema = z.object({
  title: z.string(),
  year: z.number().int(),
  genre: z.array(z.string()),
  cast: z.array(z.string()),
  reason: z.string(),
  rating: z.number().min(1).max(10),

  posterUrl: z.string().url().nullable().optional(),
  streamingLink: z.string().url().nullable().optional(),
  streamingProviders: z.array(StreamingProviderSchema).default([]),
});

export const RecommendationsSchema = z.object({
  movies: z.array(MovieSchema),
});











export type LLMMovie = z.infer<typeof LLMMovieSchema>;
export type LLMRecommendation = z.infer<typeof LLMRecommendationsSchema>;

export type StreamingProvider = z.infer<typeof StreamingProviderSchema>;
export type Movie = z.infer<typeof MovieSchema>;
export type Recommendation = z.infer<typeof RecommendationsSchema>;