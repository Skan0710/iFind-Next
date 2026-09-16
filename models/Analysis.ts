import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId;
  parsedResume: any;
  extractedSkills: Array<{
    name: string;
    category: 'technical' | 'soft' | 'language' | 'tool';
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    verified: boolean;
  }>;
  scores: {
    overall: number;
    ats: number;
    readability: number;
    format: number;
    content: number;
  };
  keywords: Array<{
    keyword: string;
    category: string;
    frequency: number;
  }>;
  missingSkills: Array<{
    skill: string;
    importance: 'high' | 'medium' | 'low';
    category: string;
  }>;
  recommendations: string[];
  matchedInternships?: Array<{
    internshipId: mongoose.Types.ObjectId;
    matchScore: number;
    matchAnalysis: string;
    matchedSkills: string[];
    missingSkills: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSchema = new Schema<IAnalysis>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parsedResume: {
      type: Schema.Types.Mixed,
      required: true,
    },
    extractedSkills: [
      {
        name: String,
        category: {
          type: String,
          enum: ['technical', 'soft', 'language', 'tool'],
        },
        proficiency: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        },
        verified: Boolean,
      },
    ],
    scores: {
      overall: { type: Number, min: 0, max: 100 },
      ats: { type: Number, min: 0, max: 100 },
      readability: { type: Number, min: 0, max: 100 },
      format: { type: Number, min: 0, max: 100 },
      content: { type: Number, min: 0, max: 100 },
    },
    keywords: [
      {
        keyword: String,
        category: String,
        frequency: Number,
      },
    ],
    missingSkills: [
      {
        skill: String,
        importance: {
          type: String,
          enum: ['high', 'medium', 'low'],
        },
        category: String,
      },
    ],
    recommendations: [String],
    matchedInternships: [
      {
        internshipId: {
          type: Schema.Types.ObjectId,
          ref: 'Internship',
        },
        matchScore: Number,
        matchAnalysis: String,
        matchedSkills: [String],
        missingSkills: [String],
      },
    ],
  },
  { timestamps: true }
);

// Create indexes for better query performance
AnalysisSchema.index({ userId: 1, createdAt: -1 });
AnalysisSchema.index({ resumeId: 1 });

export default mongoose.models.Analysis ||
  mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
