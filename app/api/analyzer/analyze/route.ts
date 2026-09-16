import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Analysis from '@/models/Analysis';
import Internship from '@/models/Internship';
import {
  parseResumeWithAI,
  extractSkills,
  analyzeResumeComprehensively,
  matchResumeWithInternships,
} from '@/lib/resumeAnalyzer';
import { PdfReader } from 'pdfjs-dist/legacy/build/pdf';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the resume from user's resume field
    if (!user.resume?.parsedData) {
      return NextResponse.json(
        { error: 'No resume found. Please upload a resume first.' },
        { status: 400 }
      );
    }

    // Extract resume text from parsed data
    const resumeText = formatResumeForAnalysis(user.resume.parsedData);

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: 'Resume is empty or could not be processed.' },
        { status: 400 }
      );
    }

    // Step 1: Parse resume with AI
    const parsedResume = await parseResumeWithAI(resumeText);

    // Step 2: Extract skills
    const extractedSkills = await extractSkills(parsedResume);

    // Step 3: Comprehensive analysis
    const analysisResult = await analyzeResumeComprehensively(
      resumeText,
      parsedResume
    );

    // Step 4: Match with internships
    const internships = await Internship.find(
      { isActive: true },
      { name: 1, company: 1, skills: 1, summary: 1, _id: 1 }
    ).limit(20);

    const matchedInternships = await matchResumeWithInternships(
      extractedSkills,
      internships,
      parsedResume
    );

    // Save analysis to database
    const analysis = new Analysis({
      userId: session.userId,
      resumeId: user._id,
      parsedResume,
      extractedSkills,
      scores: analysisResult.scores,
      keywords: analysisResult.keywords,
      missingSkills: analysisResult.missingSkills,
      recommendations: analysisResult.recommendations,
      matchedInternships: matchedInternships.map((match) => ({
        internshipId: match.internshipId,
        matchScore: match.matchScore,
        matchAnalysis: match.matchAnalysis,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
      })),
    });

    await analysis.save();

    return NextResponse.json({
      success: true,
      data: {
        analysisId: analysis._id,
        scores: analysisResult.scores,
        skills: extractedSkills,
        keywords: analysisResult.keywords.slice(0, 10),
        missingSkills: analysisResult.missingSkills.slice(0, 5),
        recommendations: analysisResult.recommendations.slice(0, 5),
        matchedInternships: matchedInternships.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume' },
      { status: 500 }
    );
  }
}

function formatResumeForAnalysis(parsedData: any): string {
  const sections: string[] = [];

  if (parsedData.Summary) {
    sections.push(`Summary:\n${parsedData.Summary}`);
  }

  if (parsedData.Experience && Array.isArray(parsedData.Experience)) {
    sections.push(
      `Experience:\n${parsedData.Experience.map(
        (exp: any) =>
          `${exp.CompanyName} - ${exp.Role} (${exp.StartDate} to ${exp.EndDate})\n${(exp.Responsibilities || []).join('\n')}`
      ).join('\n\n')}`
    );
  }

  if (parsedData.Education && Array.isArray(parsedData.Education)) {
    sections.push(
      `Education:\n${parsedData.Education.map(
        (edu: any) =>
          `${edu.Institution} - ${edu.Degree} in ${edu.FieldOfStudy}`
      ).join('\n')}`
    );
  }

  if (parsedData.Skills && Array.isArray(parsedData.Skills)) {
    sections.push(`Skills:\n${parsedData.Skills.join(', ')}`);
  }

  if (parsedData.Projects && Array.isArray(parsedData.Projects)) {
    sections.push(
      `Projects:\n${parsedData.Projects.map(
        (proj: any) =>
          `${proj.ProjectName}\n${(proj.Responsibilities || []).join('\n')}`
      ).join('\n\n')}`
    );
  }

  return sections.join('\n\n');
}
