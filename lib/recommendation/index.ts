/**
 * Recommendation Service - Public API
 * 
 * This module provides a unified interface for the recommendation system.
 * It exports the core engine and utilities needed by API routes.
 */

export { RecommendationEngine } from "./engine";
export { computeHybridScore, dotProduct } from "./scoring";
export type {
  RecommendationResult,
  RecommendationCandidate,
  InternshipCandidate,
  UserRecommendationInput,
  RecommendationConfig,
  VectorData,
  GenerateRecommendationsOptions,
} from "./types";
