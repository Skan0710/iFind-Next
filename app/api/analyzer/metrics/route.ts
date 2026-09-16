import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Analysis from '@/models/Analysis';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const analyses = await Analysis.find({ userId: session.userId });

    if (analyses.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalAnalyses: 0,
          averageScores: {
            overall: 0,
            ats: 0,
            readability: 0,
            format: 0,
            content: 0,
          },
          topSkills: [],
          topKeywords: [],
          commonMissingSkills: [],
          skillDistribution: {
            technical: 0,
            soft: 0,
            language: 0,
            tool: 0,
          },
        },
      });
    }

    // Calculate average scores
    const averageScores = {
      overall: 0,
      ats: 0,
      readability: 0,
      format: 0,
      content: 0,
    };

    analyses.forEach((analysis) => {
      if (analysis.scores) {
        averageScores.overall += analysis.scores.overall || 0;
        averageScores.ats += analysis.scores.ats || 0;
        averageScores.readability += analysis.scores.readability || 0;
        averageScores.format += analysis.scores.format || 0;
        averageScores.content += analysis.scores.content || 0;
      }
    });

    Object.keys(averageScores).forEach((key) => {
      (averageScores as any)[key] = Math.round(
        (averageScores as any)[key] / analyses.length
      );
    });

    // Aggregate skills
    const skillMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();

    analyses.forEach((analysis) => {
      analysis.extractedSkills?.forEach((skill) => {
        skillMap.set(skill.name, (skillMap.get(skill.name) || 0) + 1);
        categoryMap.set(
          skill.category,
          (categoryMap.get(skill.category) || 0) + 1
        );
      });
    });

    const topSkills = Array.from(skillMap.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Aggregate keywords
    const keywordMap = new Map<string, number>();
    analyses.forEach((analysis) => {
      analysis.keywords?.forEach((kw) => {
        keywordMap.set(kw.keyword, (keywordMap.get(kw.keyword) || 0) + 1);
      });
    });

    const topKeywords = Array.from(keywordMap.entries())
      .map(([keyword, frequency]) => ({ keyword, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 15);

    // Common missing skills
    const missingSkillMap = new Map<string, number>();
    analyses.forEach((analysis) => {
      analysis.missingSkills?.forEach((skill) => {
        missingSkillMap.set(skill.skill, (missingSkillMap.get(skill.skill) || 0) + 1);
      });
    });

    const commonMissingSkills = Array.from(missingSkillMap.entries())
      .map(([skill, frequency]) => ({ skill, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        totalAnalyses: analyses.length,
        averageScores,
        topSkills,
        topKeywords,
        commonMissingSkills,
        skillDistribution: {
          technical: categoryMap.get('technical') || 0,
          soft: categoryMap.get('soft') || 0,
          language: categoryMap.get('language') || 0,
          tool: categoryMap.get('tool') || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
