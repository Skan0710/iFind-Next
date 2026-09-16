import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Analysis from '@/models/Analysis';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { analysisId, requiredSkills } = await request.json();

    if (!analysisId || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Get the analysis
    const analysis = await Analysis.findOne({
      _id: analysisId,
      userId: session.userId,
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    const resumeSkills = analysis.extractedSkills.map((s) => s.name);
    const matchedSkills = resumeSkills.filter((skill) =>
      requiredSkills.some(
        (req) =>
          req.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(req.toLowerCase())
      )
    );
    const missingSkills = requiredSkills.filter(
      (req) =>
        !resumeSkills.some(
          (skill) =>
            req.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(req.toLowerCase())
        )
    );

    const skillMatchScore = (matchedSkills.length / requiredSkills.length) * 100;

    // Use AI to provide learning recommendations
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Provide concise learning recommendations for these missing skills:
Missing Skills: ${missingSkills.join(', ')}

For each skill, provide:
1. Learning priority (high/medium/low)
2. Estimated learning time (weeks)
3. Top 2 resources (courses, platforms, books)

Return as JSON:
[
  {
    "skill": "skill name",
    "priority": "high|medium|low",
    "estimatedWeeks": <number>,
    "resources": ["resource 1", "resource 2"]
  }
]

Return ONLY the JSON array.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let recommendations = [];
    try {
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
      recommendations = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Error parsing recommendations:', e);
    }

    return NextResponse.json({
      success: true,
      data: {
        matchedSkills,
        missingSkills,
        skillMatchScore: Math.round(skillMatchScore),
        totalRequired: requiredSkills.length,
        totalMatched: matchedSkills.length,
        recommendations,
      },
    });
  } catch (error) {
    console.error('Error analyzing skill gap:', error);
    return NextResponse.json(
      { error: 'Failed to analyze skill gap' },
      { status: 500 }
    );
  }
}
