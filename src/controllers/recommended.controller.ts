import { Request, Response } from "express";
import { getStructuredRecommendations } from "../services/langchain.service";
import { enrichMovies } from "../services/movie-enrichment.service";
import { RecommendationsSchema } from "../schemas/movie.schema";

export async function recommendedMovies(req: Request, res: Response) {
  try {
    const {
      userPrompt = "Suggest movies for a rainy night",
      genre = "thriller",
      mood = "relaxed",
      count = 2,
    } = req.body ?? {};

    const rawRecommendations = await getStructuredRecommendations({
      userPrompt: String(userPrompt),
      genre: String(genre),
      mood: String(mood),
      count: Number(count),
    });

    const enrichedMovies = await enrichMovies(rawRecommendations.movies);

    const finalResponse = RecommendationsSchema.parse({
      movies: enrichedMovies,
    });

    return res.status(200).json(finalResponse);
  } catch (error) {
    console.error("recommendedMovies error:", error);

    return res.status(500).json({
      error: "Failed to fetch movie recommendations",
    });
  }
}