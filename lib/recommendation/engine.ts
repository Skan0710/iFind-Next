/**
 * Recommendation Engine
 * 
 * Core service for generating personalized internship recommendations.
 * This is a refactored version of the brute-force logic from run-recommender.mjs.
 * 
 * Current implementation: Brute-force O(U × I) comparison
 * Future: Will be replaced with HNSW vector search
 */

import { connectDB } from "@/lib/db";
import type {
  RecommendationResult,
  RecommendationCandidate,
  InternshipCandidate,
  UserRecommendationInput,
  RecommendationConfig,
} from "./types";
import { computeHybridScore } from "./scoring";

/**
 * Default recommendation configuration
 */
const DEFAULT_CONFIG: Required<RecommendationConfig> = {
  topN: 20,
  threshold: 0.1,
  tfidfWeight: 0.4,
  bertWeight: 0.6,
};

export class RecommendationEngine {
  private config: Required<RecommendationConfig>;

  constructor(config?: RecommendationConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Load all active internships with vectors from database
   * 
   * @returns Array of internship candidates with vector data
   */
  async loadInternshipCandidates(): Promise<InternshipCandidate[]> {
    await connectDB();
    const db = (await import("mongoose")).connection.db;

    if (!db) {
      throw new Error("Database connection not established");
    }

    const internships = await db
      .collection("internships")
      .find({ isActive: true })
      .project({ _id: 1, name: 1, tfidf_vector: 1, bert_vector: 1 })
      .toArray();

    // Filter out internships without vectors
    const candidates: InternshipCandidate[] = [];
    
    for (const intern of internships) {
      if (intern.tfidf_vector && intern.bert_vector) {
        candidates.push({
          id: intern._id,
          name: intern.name,
          vectors: {
            tfidfVector: intern.tfidf_vector,
            bertVector: intern.bert_vector,
          },
        });
      }
    }

    return candidates;
  }

  /**
   * Compute recommendations for a single user
   * 
   * @param user - User data including vectors
   * @param candidates - Array of internship candidates to score
   * @returns Recommendation result with top-N candidates
   */
  computeUserRecommendations(
    user: UserRecommendationInput,
    candidates: InternshipCandidate[]
  ): RecommendationResult {
    // Score all candidates
    const scored: RecommendationCandidate[] = candidates.map((candidate) => ({
      id: candidate.id,
      score: computeHybridScore(
        user.vectors,
        candidate.vectors,
        this.config.tfidfWeight,
        this.config.bertWeight
      ),
    }));

    // Filter by threshold, sort descending, take top N
    const recommendations = scored
      .filter((s) => s.score >= this.config.threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.topN)
      .map((s) => ({
        id: s.id,
        score: Math.round(s.score * 1000) / 1000, // Round to 3 decimal places
      }));

    return {
      userId: user.userId,
      recommendations,
      updatedAt: new Date(),
      metadata: {
        totalCandidates: candidates.length,
        processedCandidates: scored.length,
        threshold: this.config.threshold,
        topN: this.config.topN,
      },
    };
  }

  /**
   * Generate recommendations for a single user
   * 
   * @param userId - User ID to generate recommendations for
   * @returns Recommendation result or null if user has no vectors
   */
  async generateRecommendationsForUser(
    userId: string
  ): Promise<RecommendationResult | null> {
    await connectDB();
    const mongoose = await import("mongoose");
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection not established");
    }

    // Load user vectors
    const user = await db
      .collection("users")
      .findOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { projection: { _id: 1, username: 1, "resume.tfidf_vector": 1, "resume.bert_vector": 1 } }
      );

    if (!user || !user.resume?.tfidf_vector || !user.resume?.bert_vector) {
      return null;
    }

    const userInput: UserRecommendationInput = {
      userId: user._id,
      username: user.username,
      vectors: {
        tfidfVector: user.resume.tfidf_vector,
        bertVector: user.resume.bert_vector,
      },
    };

    // Load all internship candidates
    const candidates = await this.loadInternshipCandidates();

    if (candidates.length === 0) {
      return {
        userId: user._id,
        recommendations: [],
        updatedAt: new Date(),
        metadata: {
          totalCandidates: 0,
          processedCandidates: 0,
          threshold: this.config.threshold,
          topN: this.config.topN,
        },
      };
    }

    // Compute recommendations
    return this.computeUserRecommendations(userInput, candidates);
  }

  /**
   * Save recommendations to user document in database
   * 
   * @param result - Recommendation result to save
   */
  async saveRecommendations(result: RecommendationResult): Promise<void> {
    await connectDB();
    const mongoose = await import("mongoose");
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection not established");
    }

    await db.collection("users").updateOne(
      { _id: new mongoose.Types.ObjectId(result.userId.toString()) },
      {
        $set: {
          recommendedInternships: result.recommendations.map((r) => r.id),
          recommendedScores: result.recommendations,
          recommendedUpdatedAt: result.updatedAt,
        },
      }
    );
  }

  /**
   * Generate and save recommendations for a single user
   * 
   * @param userId - User ID to generate recommendations for
   * @returns Recommendation result or null if user has no vectors
   */
  async generateAndSaveRecommendations(
    userId: string
  ): Promise<RecommendationResult | null> {
    const result = await this.generateRecommendationsForUser(userId);
    
    if (result) {
      await this.saveRecommendations(result);
    }
    
    return result;
  }

  /**
   * Get stored recommendations for a user from database
   * 
   * @param userId - User ID to fetch recommendations for
   * @returns Array of recommendation candidates or null if none found
   */
  async getStoredRecommendations(
    userId: string
  ): Promise<RecommendationCandidate[] | null> {
    await connectDB();
    const mongoose = await import("mongoose");
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection not established");
    }

    const user = await db
      .collection("users")
      .findOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { projection: { recommendedScores: 1 } }
      );

    if (!user || !user.recommendedScores || user.recommendedScores.length === 0) {
      return null;
    }

    return user.recommendedScores;
  }
}
