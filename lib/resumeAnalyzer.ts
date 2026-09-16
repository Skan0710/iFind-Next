import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedResume, ExtractedSkill, AnalysisResult } from '@/types/analyzer';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function parseResumeWithAI(
  resumeText: string
): Promise<ParsedResume> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Extract structured information from this resume and return it as a JSON object.

Resume text:
${resumeText}

Return a JSON object with these fields:
- Summary: brief professional summary (string or null)
- Education: array of education entries with Institution, Degree, FieldOfStudy, StartDate, EndDate, Achievements
- Skills: array of technical skills (strings)
- Projects: array of projects with ProjectName, StartDate, EndDate, Responsibilities, Technologies
- Experience: array of work experience with CompanyName, Role, Location, StartDate, EndDate, Responsibilities
- Activities: array of activities/extracurriculars (strings)
- Interests: array of interests (strings)
- AdditionalInformation: any other relevant info (string or null)

IMPORTANT: Remove any personal information like name, email, phone number, or address.
Return ONLY the JSON object, no other text. If a field is not present or empty, use null or empty array.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean up the response
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.substring(7);
    }
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    const parsed = JSON.parse(cleanedText) as ParsedResume;
    return parsed;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error('Failed to parse resume');
  }
}

export async function extractSkills(
  parsedResume: ParsedResume
): Promise<ExtractedSkill[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const skillsText = [
      ...(parsedResume.Skills || []),
      ...flattenExperience(parsedResume.Experience),
      ...flattenProjects(parsedResume.Projects),
    ].join(', ');

    const prompt = `Analyze these skills and extract them with categorization and proficiency levels.

Skills: ${skillsText}

For each skill, determine:
1. Category: technical | soft | language | tool
2. Proficiency: beginner | intermediate | advanced | expert (based on context)

Return a JSON array of objects with format:
[
  {
    "name": "skill name",
    "category": "technical|soft|language|tool",
    "proficiency": "beginner|intermediate|advanced|expert",
    "verified": true
  }
]

Return ONLY the JSON array, no markdown or extra text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.substring(7);
    }
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    const skills = JSON.parse(cleanedText) as ExtractedSkill[];
    return skills;
  } catch (error) {
    console.error('Error extracting skills:', error);
    return [];
  }
}

export async function analyzeResumeComprehensively(
  resumeText: string,
  parsedResume: ParsedResume
): Promise<{
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
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Perform a comprehensive resume analysis and return structured feedback as JSON.

Resume Content:
${resumeText}

Analyze and return a JSON object with:
{
  "scores": {
    "overall": <0-100 score for overall resume quality>,
    "ats": <0-100 ATS compatibility score>,
    "readability": <0-100 readability score>,
    "format": <0-100 formatting quality score>,
    "content": <0-100 content depth and relevance score>
  },
  "keywords": [
    {
      "keyword": "important keyword",
      "category": "technical|business|soft-skill",
      "frequency": <estimated frequency in resume>
    }
  ],
  "missingSkills": [
    {
      "skill": "skill name",
      "importance": "high|medium|low",
      "category": "technical|soft"
    }
  ],
  "recommendations": [
    "specific actionable recommendation 1",
    "specific actionable recommendation 2",
    "specific actionable recommendation 3"
  ]
}

Scoring Guidelines:
- Overall: Average of all scores
- ATS: Check for keywords, formatting, clarity (0-30 for poor, 50-70 for good, 80-100 for excellent)
- Readability: Clarity, structure, conciseness
- Format: Consistency, spacing, professional appearance
- Content: Relevance, depth, achievements vs duties

Return ONLY the JSON object, no markdown or extra text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.substring(7);
    }
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    const analysis = JSON.parse(cleanedText);

    return {
      scores: {
        overall: Math.min(100, Math.max(0, analysis.scores.overall || 75)),
        ats: Math.min(100, Math.max(0, analysis.scores.ats || 70)),
        readability: Math.min(100, Math.max(0, analysis.scores.readability || 75)),
        format: Math.min(100, Math.max(0, analysis.scores.format || 70)),
        content: Math.min(100, Math.max(0, analysis.scores.content || 75)),
      },
      keywords: analysis.keywords || [],
      missingSkills: analysis.missingSkills || [],
      recommendations: analysis.recommendations || [],
    };
  } catch (error) {
    console.error('Error analyzing resume:', error);
    return {
      scores: {
        overall: 0,
        ats: 0,
        readability: 0,
        format: 0,
        content: 0,
      },
      keywords: [],
      missingSkills: [],
      recommendations: ['Unable to analyze resume at this time.'],
    };
  }
}

function flattenExperience(experience?: any[]): string[] {
  if (!experience) return [];
  return experience.flatMap((exp) => [
    ...(exp.Responsibilities || []),
    exp.Role || '',
  ]);
}

function flattenProjects(projects?: any[]): string[] {
  if (!projects) return [];
  return projects.flatMap((proj) => [
    ...(proj.Technologies || []),
    ...(proj.Responsibilities || []),
  ]);
}

export async function matchResumeWithInternships(
  skills: ExtractedSkill[],
  internships: any[],
  parsedResume: ParsedResume
): Promise<
  Array<{
    internshipId: string;
    matchScore: number;
    matchAnalysis: string;
    matchedSkills: string[];
    missingSkills: string[];
  }>
> {
  try {
    const skillNames = skills.map((s) => s.name);
    const skillsStr = skillNames.join(', ');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const internshipSummaries = internships
      .slice(0, 10)
      .map(
        (i) =>
          `ID: ${i._id}, Position: ${i.name}, Company: ${i.company}, Skills: ${(i.skills || []).join(', ')}, Summary: ${i.summary || ''}`
      )
      .join('\n');

    const prompt = `Match resume skills with internship opportunities.

Resume Skills: ${skillsStr}
Resume Experience Level: ${parsedResume.Experience?.length || 0} positions
Resume Education: ${parsedResume.Education?.length || 0} degrees

Internships:
${internshipSummaries}

For each internship, calculate:
1. Match Score (0-100)
2. Matched Skills (skills from resume that match internship)
3. Missing Skills (skills needed for internship not on resume)

Return JSON array:
[
  {
    "internshipId": "internship id",
    "matchScore": <0-100>,
    "matchedSkills": ["skill1", "skill2"],
    "missingSkills": ["skill3"]
  }
]

Sort by matchScore descending. Return top 5 matches.
Return ONLY the JSON array, no markdown.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.substring(7);
    }
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    const matches = JSON.parse(cleanedText);

    return matches.map((match: any) => ({
      ...match,
      matchAnalysis: `This internship matches ${match.matchScore}% of your profile. You have ${match.matchedSkills.length} required skills and need to develop ${match.missingSkills.length} additional skills.`,
    }));
  } catch (error) {
    console.error('Error matching internships:', error);
    return [];
  }
}
