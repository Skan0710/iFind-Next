# Resume-Analyzer Integration Guide for iFind

## Overview

This document outlines how to integrate the Resume-Analyzer project into the iFind system for enhanced resume analysis and scoring capabilities.

---

## Part 1: Assessment of Integration Feasibility

### Resume-Analyzer Typical Architecture

Resume analyzers typically provide:
- **PDF Parsing**: Extract text from resume PDFs
- **Data Extraction**: Parse name, email, skills, experience, education
- **Analysis**: Evaluate resume quality, ATS compatibility
- **Scoring**: Generate resume score and recommendations
- **Skill Detection**: Identify and categorize technical/soft skills

### iFind Current Architecture

iFind currently has:
- Resume upload via Google Drive integration
- Basic resume parsing (OpenAI/Gemini API)
- Vector embeddings (TF-IDF + BERT)
- Resume recommendation matching
- Skill tagging (optional)

### Integration Assessment: ✅ HIGHLY COMPATIBLE

**Why it works:**
- Both systems deal with resume data
- iFind can use Resume-Analyzer's skill extraction
- Vector embeddings can be generated from parsed data
- Scoring can enhance recommendation algorithm
- No major architectural conflicts

**Estimated Effort:** 2-3 days for full integration

---

## Part 2: Schema Changes Required

### Current iFind Resume Schema

```typescript
export interface IResume {
    driveFileId?: string | null;
    driveViewLink?: string | null;
    uploadedAt?: Date | null;
    parsedData?: any | null;  // Stores ParsedResumeData
}

export interface ParsedResumeData {
    summary?: string;
    experience?: Experience[];
    education?: Education[];
    skills?: string[];
    certifications?: Certification[];
    languages?: Language[];
}
```

### Enhanced Schema with Resume-Analyzer Integration

Add these new fields to track analysis results:

```typescript
export interface IResumeAnalysis {
    // Resume-Analyzer output
    overallScore: number;           // 0-100
    atsScore: number;               // ATS compatibility 0-100
    readabilityScore: number;       // 0-100
    formatScore: number;            // Format quality 0-100
    contentScore: number;           // Content quality 0-100
    
    // Detailed metrics
    keywordMatches: {
        keyword: string;
        category: string;           // "technical" | "soft" | "industry"
        frequency: number;
    }[];
    
    missingSkills: {
        skill: string;
        category: string;
        importance: "high" | "medium" | "low";
    }[];
    
    strengths: string[];            // Positive aspects
    weaknesses: string[];           // Areas to improve
    recommendations: string[];      // Action items
    
    // Analysis metadata
    analyzedAt: Date;
    analyzedVersion: string;        // Resume-Analyzer version
}

export interface IResume extends Document {
    driveFileId?: string | null;
    driveViewLink?: string | null;
    uploadedAt?: Date | null;
    
    // Existing parsed data
    parsedData?: ParsedResumeData | null;
    
    // NEW: Resume analysis
    analysis?: IResumeAnalysis | null;
    
    // NEW: Extracted skills (enhanced)
    extractedSkills: SkillTag[];
    
    // NEW: Vector embeddings from resume content
    contentEmbedding?: number[] | null;  // BERT embedding of resume text
    summaryEmbedding?: number[] | null;  // BERT embedding of summary
    
    // NEW: Analysis history for tracking improvements
    analysisHistory: IResumeAnalysis[];
    lastAnalyzedAt?: Date | null;
}

export interface SkillTag {
    name: string;
    category: string;               // "technical" | "soft" | "language" | "tool"
    proficiency: "beginner" | "intermediate" | "advanced" | "expert";
    verified: boolean;              // Verified by analyzer
    endorsements?: number;          // User endorsements
}
```

### MongoDB Schema Updates

```typescript
const ResumeAnalysisSchema = new Schema(
    {
        overallScore: { type: Number, min: 0, max: 100, default: 0 },
        atsScore: { type: Number, min: 0, max: 100, default: 0 },
        readabilityScore: { type: Number, min: 0, max: 100, default: 0 },
        formatScore: { type: Number, min: 0, max: 100, default: 0 },
        contentScore: { type: Number, min: 0, max: 100, default: 0 },
        
        keywordMatches: [{
            keyword: String,
            category: { type: String, enum: ["technical", "soft", "industry"] },
            frequency: Number,
        }],
        
        missingSkills: [{
            skill: String,
            category: String,
            importance: { type: String, enum: ["high", "medium", "low"] },
        }],
        
        strengths: [String],
        weaknesses: [String],
        recommendations: [String],
        
        analyzedAt: { type: Date, default: Date.now },
        analyzedVersion: String,
    },
    { _id: false }
);

const SkillTagSchema = new Schema(
    {
        name: { type: String, required: true },
        category: { type: String, enum: ["technical", "soft", "language", "tool"] },
        proficiency: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"] },
        verified: { type: Boolean, default: false },
        endorsements: { type: Number, default: 0 },
    },
    { _id: false }
);

const ResumeSchema = new Schema(
    {
        driveFileId: { type: String, default: null },
        driveViewLink: { type: String, default: null },
        uploadedAt: { type: Date, default: null },
        
        parsedData: { type: Schema.Types.Mixed, default: null },
        
        // NEW FIELDS
        analysis: ResumeAnalysisSchema,
        extractedSkills: [SkillTagSchema],
        contentEmbedding: [Number],
        summaryEmbedding: [Number],
        analysisHistory: [ResumeAnalysisSchema],
        lastAnalyzedAt: { type: Date, default: null },
        
        // Vector fields for recommendation matching
        tfidf_vector: [Number],     // TF-IDF embedding
        bert_vector: [Number],      // BERT embedding
    },
    { _id: false }
);
```

---

## Part 3: Integration Implementation Steps

### Step 1: Set Up Resume-Analyzer Service

Create new file: `lib/resumeAnalyzer/ResumeAnalyzerService.ts`

```typescript
/**
 * Resume Analyzer Service
 * Integrates with Resume-Analyzer system for resume analysis
 */

export interface ResumeAnalysisInput {
    resumeText: string;
    jobDescription?: string;  // For matching analysis
}

export interface AnalysisResult {
    overallScore: number;
    atsScore: number;
    readabilityScore: number;
    formatScore: number;
    contentScore: number;
    keywordMatches: KeywordMatch[];
    missingSkills: MissingSkill[];
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
}

export class ResumeAnalyzerService {
    private analyzerUrl: string;  // Resume-Analyzer API endpoint
    
    async analyzeResume(input: ResumeAnalysisInput): Promise<AnalysisResult> {
        // Call Resume-Analyzer API
        // Parse response
        // Return structured result
    }
    
    async extractSkills(resumeText: string): Promise<SkillTag[]> {
        // Use Resume-Analyzer skill extraction
    }
    
    async generateEmbeddings(resumeText: string): Promise<{
        content: number[];
        summary: number[];
    }> {
        // Generate embeddings for vector search
    }
}
```

### Step 2: Update User Model

```typescript
// models/User.ts

const ResumeAnalysisSchema = new Schema({ /* ... */ });
const SkillTagSchema = new Schema({ /* ... */ });

const ResumeSchema = new Schema(
    {
        // Existing fields
        driveFileId: { type: String, default: null },
        driveViewLink: { type: String, default: null },
        uploadedAt: { type: Date, default: null },
        parsedData: { type: Schema.Types.Mixed, default: null },
        
        // NEW: Resume analysis integration
        analysis: ResumeAnalysisSchema,
        extractedSkills: [SkillTagSchema],
        contentEmbedding: [Number],
        summaryEmbedding: [Number],
        analysisHistory: [ResumeAnalysisSchema],
        lastAnalyzedAt: { type: Date, default: null },
        
        // Existing embedding fields
        tfidf_vector: [Number],
        bert_vector: [Number],
    },
    { _id: false }
);

const UserSchema = new Schema<IUser>(
    {
        // ... existing fields
        resume: {
            type: ResumeSchema,
            default: () => ({}),
        },
    },
    { timestamps: true }
);
```

### Step 3: Create Analysis API Endpoint

Create: `app/api/user/resume/analyze/route.ts`

```typescript
/**
 * POST /api/user/resume/analyze
 * 
 * Analyzes user's resume using Resume-Analyzer
 * Stores analysis results and updates vectors
 */

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        await connectDB();
        
        // Get user resume
        const user = await db.collection("users").findOne(
            { _id: new ObjectId(session.userId) },
            { projection: { "resume.parsedData": 1 } }
        );
        
        if (!user?.resume?.parsedData) {
            return NextResponse.json(
                { error: "Resume not found" },
                { status: 404 }
            );
        }
        
        // Analyze resume
        const analyzer = new ResumeAnalyzerService();
        const analysisResult = await analyzer.analyzeResume({
            resumeText: user.resume.parsedData.summary || "",
        });
        
        // Extract skills
        const skills = await analyzer.extractSkills(user.resume.parsedData.summary || "");
        
        // Generate embeddings
        const embeddings = await analyzer.generateEmbeddings(
            user.resume.parsedData.summary || ""
        );
        
        // Update user document
        await db.collection("users").updateOne(
            { _id: new ObjectId(session.userId) },
            {
                $set: {
                    "resume.analysis": analysisResult,
                    "resume.extractedSkills": skills,
                    "resume.contentEmbedding": embeddings.content,
                    "resume.summaryEmbedding": embeddings.summary,
                    "resume.lastAnalyzedAt": new Date(),
                },
                $push: {
                    "resume.analysisHistory": analysisResult,
                },
            }
        );
        
        // Invalidate recommendation cache (new resume analysis changes vectors)
        await cache.invalidate(session.userId.toString());
        
        return NextResponse.json({
            success: true,
            analysis: analysisResult,
            skills: skills,
        });
        
    } catch (error) {
        console.error("[resume/analyze]", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
```

### Step 4: Enhance Recommendation Algorithm

Update: `lib/recommendation/scoring.ts`

```typescript
/**
 * Enhanced scoring that incorporates Resume-Analyzer data
 */

export function computeHybridScoreEnhanced(
    userVectors: { tfidfVector: number[]; bertVector: number[] },
    userAnalysis: IResumeAnalysis,  // NEW: Resume analysis
    userSkills: SkillTag[],         // NEW: Extracted skills
    internshipVectors: { tfidfVector: number[]; bertVector: number[] },
    internshipSkills: string[],     // Required skills
    tfidfWeight: number = 0.4,
    bertWeight: number = 0.6
): number {
    // Base cosine similarity
    const tfidfSim = cosineSimilarity(userVectors.tfidfVector, internshipVectors.tfidfVector);
    const bertSim = cosineSimilarity(userVectors.bertVector, internshipVectors.bertVector);
    const baseSim = tfidfSim * tfidfWeight + bertSim * bertWeight;
    
    // NEW: Skill matching bonus
    const skillMatch = calculateSkillMatch(userSkills, internshipSkills);
    
    // NEW: Resume quality factor
    const qualityFactor = userAnalysis?.overallScore ? userAnalysis.overallScore / 100 : 1;
    
    // Combined score
    return (baseSim * 0.7 + skillMatch * 0.2) * qualityFactor;
}

function calculateSkillMatch(
    userSkills: SkillTag[],
    requiredSkills: string[]
): number {
    if (requiredSkills.length === 0) return 1;
    
    const matches = userSkills.filter(skill =>
        requiredSkills.some(req =>
            req.toLowerCase().includes(skill.name.toLowerCase()) ||
            skill.name.toLowerCase().includes(req.toLowerCase())
        )
    );
    
    return matches.length / requiredSkills.length;
}
```

### Step 5: Create Admin Dashboard for Analysis

Create: `app/api/admin/resume-analysis/stats/route.ts`

```typescript
/**
 * GET /api/admin/resume-analysis/stats
 * 
 * Returns statistics on resume analysis across users
 */

export async function GET(req: NextRequest) {
    // Check admin role
    const session = await getSession();
    // ... validation ...
    
    await connectDB();
    const db = mongoose.connection.db;
    
    // Aggregate stats
    const stats = await db.collection("users").aggregate([
        {
            $match: { "resume.analysis": { $exists: true } }
        },
        {
            $group: {
                _id: null,
                avgOverallScore: { $avg: "$resume.analysis.overallScore" },
                avgAtsScore: { $avg: "$resume.analysis.atsScore" },
                avgReadability: { $avg: "$resume.analysis.readabilityScore" },
                totalAnalyzed: { $sum: 1 },
                topSkills: { $push: "$resume.extractedSkills" },
            }
        }
    ]).toArray();
    
    return NextResponse.json({ success: true, stats: stats[0] });
}
```

---

## Part 4: Integration Workflow

### User Journey After Integration

```
1. User uploads resume (existing flow)
   ↓
2. Resume is parsed (existing flow)
   ↓
3. NEW: Resume is analyzed by Resume-Analyzer
   - Scores generated (ATS, readability, etc.)
   - Skills extracted with proficiency levels
   - Weaknesses identified
   - Recommendations provided
   ↓
4. NEW: Embeddings generated for content
   ↓
5. Recommendation cache invalidated
   ↓
6. Next time recommendations requested:
   - Enhanced scoring uses resume quality + skill match
   - Better recommendations based on actual skills
   ↓
7. User sees analysis results + recommendations in dashboard
```

---

## Part 5: Data Migration

### For Existing Users

Create migration script: `scripts/migrate-resume-analysis.mjs`

```javascript
import { connectDB } from "@/lib/db";

async function migrateExistingResumes() {
    await connectDB();
    const db = mongoose.connection.db;
    
    // Find all users with resumes
    const users = await db.collection("users")
        .find({ "resume.parsedData": { $exists: true } })
        .toArray();
    
    console.log(`Found ${users.length} resumes to analyze...`);
    
    const analyzer = new ResumeAnalyzerService();
    
    for (const user of users) {
        try {
            const resumeText = user.resume?.parsedData?.summary || "";
            
            const analysis = await analyzer.analyzeResume({ resumeText });
            const skills = await analyzer.extractSkills(resumeText);
            const embeddings = await analyzer.generateEmbeddings(resumeText);
            
            await db.collection("users").updateOne(
                { _id: user._id },
                {
                    $set: {
                        "resume.analysis": analysis,
                        "resume.extractedSkills": skills,
                        "resume.contentEmbedding": embeddings.content,
                        "resume.summaryEmbedding": embeddings.summary,
                        "resume.lastAnalyzedAt": new Date(),
                    }
                }
            );
            
            console.log(`✅ Analyzed resume for user ${user._id}`);
        } catch (error) {
            console.error(`❌ Failed to analyze user ${user._id}:`, error);
        }
    }
    
    console.log("Migration complete!");
}
```

---

## Part 6: Configuration & Environment Variables

Add to `.env.local`:

```env
# Resume Analyzer Integration
RESUME_ANALYZER_URL=http://localhost:5000  # or your Resume-Analyzer API endpoint
RESUME_ANALYZER_API_KEY=your-api-key       # if required
ENABLE_RESUME_ANALYSIS=true

# Skill extraction preferences
SKILL_EXTRACTION_ENABLED=true
SKILL_PROFICIENCY_AUTO_DETECT=true
```

---

## Part 7: Testing Resume-Analyzer Integration

### Test 1: Analyze Resume

```bash
curl -X POST \
  -H "Authorization: Bearer <user_token>" \
  http://localhost:3000/api/user/resume/analyze
```

**Expected Response:**
```json
{
  "success": true,
  "analysis": {
    "overallScore": 78,
    "atsScore": 82,
    "readabilityScore": 75,
    "formatScore": 80,
    "contentScore": 72,
    "keywordMatches": [
      {
        "keyword": "React",
        "category": "technical",
        "frequency": 3
      }
    ],
    "missingSkills": [
      {
        "skill": "Kubernetes",
        "category": "technical",
        "importance": "high"
      }
    ],
    "strengths": ["Good technical depth", "Clear structure"],
    "weaknesses": ["Missing soft skills", "Needs more metrics"],
    "recommendations": ["Add quantifiable achievements", "Include soft skills"]
  },
  "skills": [
    {
      "name": "React",
      "category": "technical",
      "proficiency": "advanced",
      "verified": true
    }
  ]
}
```

### Test 2: Check Recommendation Enhancement

Before vs After integration:

**Before:**
- Recommendations based only on vector similarity
- Limited skill matching

**After:**
- Incorporates resume quality score
- Uses extracted skills for better matching
- Recommends internships that align with skill gaps

---

## Part 8: Potential Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Resume-Analyzer API latency | Implement async processing with job queue |
| Schema migration for existing users | Run migration script in background |
| Resume parsing accuracy | Use multiple parsers as fallback |
| Skill extraction conflicts | Standardize skill taxonomy/taxonomy mapping |
| Vector embedding mismatch | Retrain embeddings after schema change |
| Cache invalidation complexity | Trigger invalidation on analysis update |

---

## Part 9: Timeline & Effort Estimation

### Phase 1: Setup (1 day)
- Install Resume-Analyzer locally
- Create ResumeAnalyzerService wrapper
- Test API connectivity

### Phase 2: Schema Updates (0.5 days)
- Update MongoDB schemas
- Update TypeScript interfaces
- Create database indexes

### Phase 3: Implementation (1 day)
- Create analysis endpoint
- Enhance recommendation scoring
- Update API routes

### Phase 4: Testing & Migration (0.5 days)
- Unit tests for analysis service
- Migration script for existing users
- E2E testing

### Total: ~3 days

---

## Part 10: Benefits After Integration

✅ **Better Resume Quality Tracking**
- Know exactly which resumes are strong/weak
- Specific improvement recommendations

✅ **Improved Recommendations**
- Skill-based matching
- Quality-aware scoring
- Better internship fits

✅ **Admin Insights**
- Resume quality statistics
- Common skill gaps
- Skill trends across cohort

✅ **User Engagement**
- Resume analysis feedback
- Clear improvement path
- Skill recommendations

---

## Rollback Plan

If integration issues arise:

1. Set `ENABLE_RESUME_ANALYSIS=false` in env
2. Revert recommendation scoring to original version
3. Keep historical analysis data (non-destructive)
4. Users continue to work without disruption

---

## Next Steps

1. Confirm Resume-Analyzer repo details/API specification
2. Set up Resume-Analyzer service locally
3. Create ResumeAnalyzerService wrapper
4. Begin Phase 1 implementation
5. Execute integration plan sequentially

Need specific details about the Resume-Analyzer project? Provide:
- Repository link or detailed architecture
- API endpoints available
- Output format specifications
- Deployment requirements
