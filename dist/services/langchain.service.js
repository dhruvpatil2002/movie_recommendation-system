"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendations = getRecommendations;
exports.getStructuredRecommendations = getStructuredRecommendations;
require("dotenv/config");
const node_1 = require("@langchain/google/node");
const prompts_1 = require("@langchain/core/prompts");
// import { ChatOpenAI } from "@langchain/openai";
const movie_schema_1 = require("../schemas/movie.schema");
function getChatModel() {
    const provider = process.env.LLM_PROVIDER ?? "google";
    if (provider === "google") {
        return new node_1.ChatGoogle({
            model: "gemini-2.5-flash",
            apiKey: process.env.GOOGLE_API_KEY,
            temperature: 0.3,
            maxRetries: 2,
        });
    }
    throw new Error("Only Google Gemini is currently configured.");
    // If you want OpenAI fallback later:
    // return new ChatOpenAI({
    //   model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    //   temperature: 0.3,
    // });
}
const model = getChatModel();
const promptTemplate = prompts_1.ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are a movie recommendation expert.

Return high-quality movie recommendations based on:
- user's request
- genre
- mood
- count

Rules:
- Every recommendation should feel intentional.
- Avoid repeating only the most obvious mainstream titles.
- Return only real movies.
- Keep reasons concise but specific.
- Cast should contain up to 3 well-known actors.
- Rating should be realistic on a 1 to 10 scale.`,
    ],
    [
        "human",
        `User request: {userPrompt}

Preferences:
- Genre: {genre}
- Mood: {mood}
- Number of movies: {count}`,
    ],
]);
async function getRecommendations(input) {
    const chain = promptTemplate.pipe(model);
    const response = await chain.invoke({
        userPrompt: input.userPrompt,
        genre: input.genre,
        mood: input.mood,
        count: input.count,
    });
    return response.text;
}
const structuredModel = model.withStructuredOutput(movie_schema_1.LLMRecommendationsSchema);
async function getStructuredRecommendations(input) {
    const chain = promptTemplate.pipe(structuredModel);
    const result = await chain.invoke({
        userPrompt: input.userPrompt,
        genre: input.genre,
        mood: input.mood,
        count: input.count,
    });
    return result;
}
