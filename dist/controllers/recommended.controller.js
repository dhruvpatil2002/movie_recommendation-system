"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendedMovies = recommendedMovies;
const langchain_service_1 = require("../services/langchain.service");
const movie_enrichment_service_1 = require("../services/movie-enrichment.service");
const movie_schema_1 = require("../schemas/movie.schema");
async function recommendedMovies(req, res) {
    try {
        const { userPrompt = "Suggest movies for a rainy night", genre = "thriller", mood = "relaxed", count = 2, } = req.body ?? {};
        const rawRecommendations = await (0, langchain_service_1.getStructuredRecommendations)({
            userPrompt: String(userPrompt),
            genre: String(genre),
            mood: String(mood),
            count: Number(count),
        });
        const enrichedMovies = await (0, movie_enrichment_service_1.enrichMovies)(rawRecommendations.movies);
        const finalResponse = movie_schema_1.RecommendationsSchema.parse({
            movies: enrichedMovies,
        });
        return res.status(200).json(finalResponse);
    }
    catch (error) {
        console.error("recommendedMovies error:", error);
        return res.status(500).json({
            error: "Failed to fetch movie recommendations",
        });
    }
}
