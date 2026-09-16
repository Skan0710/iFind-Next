import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { missingSkills, currentSkills } = await request.json();

    if (!missingSkills || missingSkills.length === 0) {
      return NextResponse.json(
        { error: 'No missing skills provided' },
        { status: 400 }
      );
    }

    const roadmap = await generateLearningRoadmap(missingSkills, currentSkills);

    return NextResponse.json({
      success: true,
      roadmap,
    });
  } catch (error) {
    console.error('Roadmap generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate roadmap' },
      { status: 500 }
    );
  }
}

async function generateLearningRoadmap(
  missingSkills: Array<{ skill: string; category: string; importance: string }>,
  currentSkills: string[]
): Promise<any[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a career development expert. Create a personalized learning roadmap.

Current Skills: ${currentSkills.join(', ')}

Skills to Develop:
${missingSkills.map((s) => `- ${s.skill} (${s.category}, ${s.importance} priority)`).join('\n')}

Create a structured learning roadmap with 3-4 phases. For each phase, provide:
1. Phase name (e.g., "Foundation Phase", "Intermediate Development")
2. Duration (e.g., "4-6 weeks")
3. Focus area
4. List of 3-5 skills to master
5. 3-4 learning resources with type (Course/Book/Project/Tutorial), title, and description
6. 3-4 key milestones to achieve

Return ONLY a valid JSON array of phases in this format:
[{
  "phase": "Phase name",
  "duration": "Time period",
  "focus": "Main focus area",
  "skills": ["skill1", "skill2"],
  "resources": [
    {
      "type": "Course|Book|Project|Tutorial",
      "title": "Resource name",
      "description": "Brief description"
    }
  ],
  "milestones": ["milestone1", "milestone2"]
}]

Prioritize high-importance skills and build a logical progression from basics to advanced.
Return ONLY the JSON array, no markdown, no code blocks.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  let text = response.text().trim();

  // Clean up response
  if (text.startsWith('```json')) {
    text = text.slice(7);
  }
  if (text.startsWith('```')) {
    text = text.slice(3);
  }
  if (text.endsWith('```')) {
    text = text.slice(0, -3);
  }
  text = text.trim();

  try {
    const roadmap = JSON.parse(text);
    return roadmap;
  } catch (e) {
    console.error('Failed to parse roadmap JSON:', text);
    // Return a basic fallback roadmap
    return [
      {
        phase: 'Foundation Phase',
        duration: '4-6 weeks',
        focus: 'Building core skills',
        skills: missingSkills.slice(0, 5).map((s) => s.skill),
        resources: [
          {
            type: 'Course',
            title: 'Online Learning Platform',
            description: 'Start with beginner-friendly courses',
          },
          {
            type: 'Tutorial',
            title: 'Official Documentation',
            description: 'Read official docs for each skill',
          },
        ],
        milestones: [
          'Complete introductory tutorials',
          'Build 2-3 small projects',
          'Pass skill assessments',
        ],
      },
      {
        phase: 'Practical Application',
        duration: '6-8 weeks',
        focus: 'Hands-on projects',
        skills: missingSkills.slice(5, 10).map((s) => s.skill),
        resources: [
          {
            type: 'Project',
            title: 'Portfolio Projects',
            description: 'Build real-world projects using new skills',
          },
        ],
        milestones: [
          'Complete 3-5 projects',
          'Contribute to open source',
          'Build portfolio website',
        ],
      },
    ];
  }
}
