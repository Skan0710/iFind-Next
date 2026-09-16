/**
 * Rule-based resume parser - NO AI REQUIRED!
 * Extracts resume data using regex patterns and text analysis.
 * 100% FREE and UNLIMITED parsing.
 */

import pdf from "pdf-parse";

interface ResumeData {
  summary: string | null;
  workHistory: Array<{
    title: string;
    company: string;
    location: string;
    type: "job" | "internship" | "volunteer" | "co-op";
    period: {
      start: string;
      end: string | null;
      isCurrent: boolean;
    };
    responsibilities: string[];
    achievements: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location: string;
    year: string;
    gpa: string | null;
    major: string | null;
  }>;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    tools: string[];
  };
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    link: string | null;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string | null;
  }>;
  contact: {
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    github: string | null;
    portfolio: string | null;
  };
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}

function extractPhones(text: string): string[] {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  return text.match(phoneRegex) || [];
}

function extractURLs(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

function extractLinkedIn(text: string): string | null {
  const linkedinRegex = /(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
  const match = text.match(linkedinRegex);
  return match ? match[0] : null;
}

function extractGitHub(text: string): string | null {
  const githubRegex = /(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+/i;
  const match = text.match(githubRegex);
  return match ? match[0] : null;
}

function extractSkills(text: string): { technical: string[]; soft: string[]; languages: string[]; tools: string[] } {
  const lowerText = text.toLowerCase();
  
  // Common technical skills
  const technicalKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php',
    'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
    'spring', 'mongodb', 'postgresql', 'mysql', 'redis', 'sql', 'nosql',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd',
    'machine learning', 'deep learning', 'ai', 'data science', 'tensorflow', 'pytorch',
    'rest api', 'graphql', 'microservices', 'agile', 'scrum', 'git', 'next.js', 'tailwind'
  ];

  const softKeywords = [
    'leadership', 'communication', 'teamwork', 'problem-solving', 'critical thinking',
    'time management', 'adaptability', 'collaboration', 'creativity', 'analytical'
  ];

  const languageKeywords = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'hindi', 'arabic'];

  const technical = technicalKeywords.filter(skill => lowerText.includes(skill));
  const soft = softKeywords.filter(skill => lowerText.includes(skill));
  const languages = languageKeywords.filter(lang => lowerText.includes(lang));

  return { technical, soft, languages, tools: [] };
}

function extractEducation(text: string): Array<{ degree: string; institution: string; location: string; year: string; gpa: string | null; major: string | null }> {
  const education: Array<any> = [];
  const lines = text.split('\n');

  const degreeKeywords = ['bachelor', 'master', 'phd', 'b.s.', 'b.a.', 'm.s.', 'm.a.', 'b.tech', 'm.tech', 'bsc', 'msc'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (degreeKeywords.some(keyword => line.includes(keyword))) {
      const yearMatch = lines[i].match(/\b(19|20)\d{2}\b/);
      const gpaMatch = lines[i].match(/gpa[:\s]+(\d\.\d+)/i);
      
      education.push({
        degree: lines[i].trim(),
        institution: lines[i + 1]?.trim() || "Unknown Institution",
        location: "",
        year: yearMatch ? yearMatch[0] : "",
        gpa: gpaMatch ? gpaMatch[1] : null,
        major: null
      });
    }
  }

  return education.length > 0 ? education : [{
    degree: "Degree information not found",
    institution: "Institution not found",
    location: "",
    year: "",
    gpa: null,
    major: null
  }];
}

function extractWorkHistory(text: string): Array<any> {
  const workHistory: Array<any> = [];
  const lines = text.split('\n');

  const jobKeywords = ['intern', 'developer', 'engineer', 'analyst', 'manager', 'associate', 'coordinator', 'assistant'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (jobKeywords.some(keyword => line.includes(keyword))) {
      const dateMatch = lines[i].match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}/gi);
      
      workHistory.push({
        title: lines[i].trim(),
        company: lines[i + 1]?.trim() || "Company not specified",
        location: "",
        type: line.includes('intern') ? 'internship' : 'job',
        period: {
          start: dateMatch?.[0] || "",
          end: dateMatch?.[1] || null,
          isCurrent: line.includes('present') || line.includes('current')
        },
        responsibilities: [],
        achievements: []
      });
    }
  }

  return workHistory;
}

function extractProjects(text: string): Array<any> {
  const projects: Array<any> = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (line.includes('project') && !line.includes('projects:')) {
      projects.push({
        name: lines[i].trim(),
        description: lines[i + 1]?.trim() || "",
        technologies: [],
        link: null
      });
    }
  }

  return projects;
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

export async function parseResumeRuleBased(pdfBuffer: Buffer): Promise<ResumeData> {
  console.log("[Rule-Based Parser] Starting PDF extraction...");
  
  // Extract text from PDF
  const data = await pdf(pdfBuffer);
  const text = data.text;
  
  console.log("[Rule-Based Parser] Extracted text length:", text.length);

  // Extract all components
  const emails = extractEmails(text);
  const phones = extractPhones(text);
  const linkedin = extractLinkedIn(text);
  const github = extractGitHub(text);
  
  const skills = extractSkills(text);
  const education = extractEducation(text);
  const workHistory = extractWorkHistory(text);
  const projects = extractProjects(text);

  const result: ResumeData = {
    summary: text.substring(0, 300) + "...", // First 300 chars as summary
    workHistory,
    education,
    skills,
    projects,
    certifications: [],
    contact: {
      email: emails[0] || null,
      phone: phones[0] || null,
      linkedin,
      github,
      portfolio: null
    }
  };

  console.log("[Rule-Based Parser] ✅ Parsing complete!");
  console.log("[Rule-Based Parser] Found:", {
    email: !!result.contact.email,
    phone: !!result.contact.phone,
    education: education.length,
    work: workHistory.length,
    skills: skills.technical.length
  });

  return result;
}
