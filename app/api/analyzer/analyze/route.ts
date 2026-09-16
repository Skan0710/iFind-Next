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
        { error: 'No resume data found. Please upload your resume in the Dashboard → Resume tab, wait for it to be parsed, then try analyzing again.' },
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

  // Handle Summary (both formats: Summary and summary)
  const summary = parsedData.Summary || parsedData.summary;
  if (summary) {
    sections.push(`Summary:\n${summary}`);
  }

  // Handle Experience/workHistory
  const experience = parsedData.Experience || parsedData.workHistory;
  if (experience && Array.isArray(experience)) {
    const expText = experience.map((exp: any) => {
      // Handle both old format (CompanyName, Role) and new format (company, title)
      const company = exp.CompanyName || exp.company || 'Unknown Company';
      const role = exp.Role || exp.title || 'Unknown Role';
      const location = exp.Location || exp.location || '';
      const startDate = exp.StartDate || exp.period?.start || '';
      const endDate = exp.EndDate || exp.period?.end || (exp.period?.isCurrent ? 'Present' : '');
      const responsibilities = exp.Responsibilities || exp.responsibilities || [];
      const achievements = exp.achievements || [];
      
      let text = `${company} - ${role}`;
      if (location) text += ` (${location})`;
      text += ` (${startDate} to ${endDate})\n`;
      
      if (responsibilities.length > 0) {
        text += responsibilities.join('\n');
      }
      if (achievements.length > 0) {
        text += '\n' + achievements.join('\n');
      }
      
      return text;
    }).join('\n\n');
    
    sections.push(`Experience:\n${expText}`);
  }

  // Handle Education
  const education = parsedData.Education || parsedData.education;
  if (education && Array.isArray(education)) {
    const eduText = education.map((edu: any) => {
      // Handle both formats
      const institution = edu.Institution || edu.institution || 'Unknown Institution';
      const degree = edu.Degree || edu.field?.type || '';
      const fieldOfStudy = edu.FieldOfStudy || edu.field?.course || '';
      const output = edu.output || '';
      
      let text = `${institution}`;
      if (degree) text += ` - ${degree}`;
      if (fieldOfStudy) text += ` in ${fieldOfStudy}`;
      if (output) text += `\n${output}`;
      
      return text;
    }).join('\n');
    
    sections.push(`Education:\n${eduText}`);
  }

  // Handle Skills
  const skills = parsedData.Skills || parsedData.skills;
  if (skills && Array.isArray(skills)) {
    // Handle two formats: string array OR object array
    if (typeof skills[0] === 'string') {
      sections.push(`Skills:\n${skills.join(', ')}`);
    } else {
      // New format: array of skill objects with field and tools
      const skillsText = skills.map((skill: any) => {
        if (skill.field) {
          const tools = skill.tools?.map((t: any) => t.name).join(', ') || '';
          return `${skill.field}: ${tools}`;
        }
        return '';
      }).filter(Boolean).join('\n');
      
      if (skillsText) {
        sections.push(`Skills:\n${skillsText}`);
      }
    }
  }

  // Handle Projects
  const projects = parsedData.Projects || parsedData.projects;
  if (projects && Array.isArray(projects)) {
    const projText = projects.map((proj: any) => {
      const name = proj.ProjectName || proj.title || 'Unnamed Project';
      const role = proj.role || '';
      const techStack = proj.techStack || [];
      const description = proj.Responsibilities || proj.description || [];
      const problemStatement = proj.problemStatement || '';
      
      let text = name;
      if (role) text += ` (${role})`;
      text += '\n';
      
      if (problemStatement) text += `Problem: ${problemStatement}\n`;
      if (techStack.length > 0) text += `Tech Stack: ${techStack.join(', ')}\n`;
      
      if (Array.isArray(description)) {
        text += description.join('\n');
      } else if (description) {
        text += description;
      }
      
      return text;
    }).join('\n\n');
    
    sections.push(`Projects:\n${projText}`);
  }

  // Handle Certifications
  const certifications = parsedData.certifications;
  if (certifications && Array.isArray(certifications) && certifications.length > 0) {
    const certsText = certifications.map((cert: any) => 
      `${cert.name} - ${cert.issuer} (${cert.date || 'N/A'})`
    ).join('\n');
    sections.push(`Certifications:\n${certsText}`);
  }

  // Handle Publications
  const publications = parsedData.publications;
  if (publications && Array.isArray(publications) && publications.length > 0) {
    const pubsText = publications.map((pub: any) =>
      `${pub.title} (${pub.type}) - ${pub.platform} (${pub.date || 'N/A'})`
    ).join('\n');
    sections.push(`Publications:\n${pubsText}`);
  }

  // Handle Activities/Affiliations
  const activities = parsedData.Activities || parsedData.affiliations;
  if (activities && Array.isArray(activities) && activities.length > 0) {
    if (typeof activities[0] === 'string') {
      sections.push(`Activities:\n${activities.join('\n')}`);
    } else {
      const actText = activities.map((act: any) =>
        `${act.organization || act} - ${act.role || ''}`
      ).join('\n');
      sections.push(`Activities:\n${actText}`);
    }
  }

  // Handle Interests
  const interests = parsedData.Interests || parsedData.interests;
  if (interests && Array.isArray(interests) && interests.length > 0) {
    if (typeof interests[0] === 'string') {
      sections.push(`Interests:\n${interests.join(', ')}`);
    } else {
      const intText = interests.map((int: any) =>
        int.activity || int
      ).join(', ');
      sections.push(`Interests:\n${intText}`);
    }
  }

  // Handle Awards
  const awards = parsedData.awards;
  if (awards && Array.isArray(awards) && awards.length > 0) {
    const awardsText = awards.map((award: any) =>
      `${award.name} - ${award.issuingBody} (${award.date || 'N/A'})`
    ).join('\n');
    sections.push(`Awards:\n${awardsText}`);
  }

  // Handle Additional Information
  const additionalInfo = parsedData.AdditionalInformation || parsedData.metaDetails;
  if (additionalInfo) {
    if (typeof additionalInfo === 'string') {
      sections.push(`Additional Information:\n${additionalInfo}`);
    } else if (additionalInfo.name || additionalInfo.email) {
      // It's metaDetails object
      const details = [];
      if (additionalInfo.name) details.push(`Name: ${additionalInfo.name}`);
      if (additionalInfo.email) details.push(`Email: ${additionalInfo.email}`);
      if (additionalInfo.phone_no) details.push(`Phone: ${additionalInfo.phone_no}`);
      if (additionalInfo.linkedin) details.push(`LinkedIn: ${additionalInfo.linkedin}`);
      if (additionalInfo.github_profile) details.push(`GitHub: ${additionalInfo.github_profile}`);
      if (details.length > 0) {
        sections.push(`Contact Information:\n${details.join('\n')}`);
      }
    }
  }

  return sections.join('\n\n');
}
