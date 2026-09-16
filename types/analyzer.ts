// Resume Analyzer Types

export interface ParsedResume {
  Summary?: string;
  Education?: Education[];
  Skills?: string[];
  Projects?: Project[];
  Experience?: Experience[];
  Activities?: string[];
  Interests?: string[];
  AdditionalInformation?: string;
}

export interface Education {
  Institution: string;
  Degree: string;
  FieldOfStudy: string;
  StartDate?: string;
  EndDate?: string;
  Achievements?: string[];
}

export interface Experience {
  CompanyName: string;
  Role: string;
  Location?: string;
  StartDate?: string;
  EndDate?: string;
  Responsibilities?: string[];
}

export interface Project {
  ProjectName: string;
  StartDate?: string;
  EndDate?: string;
  Responsibilities?: string[];
  Technologies?: string[];
}

export interface ExtractedSkill {
  name: string;
  category: 'technical' | 'soft' | 'language' | 'tool';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  verified: boolean;
}

export interface AnalysisResult {
  _id?: string;
  userId: string;
  resumeId: string;
  parsedResume: ParsedResume;
  extractedSkills: ExtractedSkill[];
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
  matchedInternships?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchedInternship {
  internshipId: string;
  matchScore: number;
  matchAnalysis: string;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface ResumeAnalyzerMetrics {
  totalAnalyses: number;
  averageScores: {
    overall: number;
    ats: number;
    readability: number;
    format: number;
    content: number;
  };
  topSkills: Array<{
    skill: string;
    count: number;
    category: string;
  }>;
  topKeywords: Array<{
    keyword: string;
    frequency: number;
  }>;
  commonMissingSkills: Array<{
    skill: string;
    frequency: number;
  }>;
}
