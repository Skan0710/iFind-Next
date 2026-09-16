'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Briefcase, 
  GraduationCap, 
  Code, 
  FolderGit2, 
  Award,
  User,
  Calendar
} from 'lucide-react';

interface ResumeData {
  // Old format (PascalCase) - for backward compatibility
  Summary?: string;
  Education?: Array<{
    Institution: string;
    Degree: string;
    FieldOfStudy: string;
    StartDate?: string;
    EndDate?: string;
    Achievements?: string[];
  }>;
  Skills?: string[];
  Projects?: Array<{
    ProjectName: string;
    StartDate?: string;
    EndDate?: string;
    Responsibilities?: string[];
  }>;
  Experience?: Array<{
    CompanyName: string;
    Role: string;
    Location?: string;
    StartDate?: string;
    EndDate?: string;
    Responsibilities?: string[];
  }>;
  Activities?: string[];
  Interests?: string[];
  AdditionalInformation?: string;
  
  // New format (camelCase) - from resumeParser
  summary?: string;
  workHistory?: Array<{
    title: string;
    company: string;
    location?: string;
    type?: string;
    period?: { start?: string; end?: string; isCurrent?: boolean };
    responsibilities?: string[];
    achievements?: string[];
  }>;
  education?: Array<{
    institution: string;
    field?: { type?: string; course?: string };
    period?: { start?: string; end?: string; isCurrent?: boolean };
    output?: string;
  }>;
  skills?: Array<{
    field: string;
    yearsOfExperience?: number;
    lastUsed?: string;
    tools?: Array<{ name: string; score?: number }>;
  }> | string[];
  projects?: Array<{
    title: string;
    role?: string;
    links?: { repo?: string; live?: string; demo?: string };
    techStack?: string[];
    problemStatement?: string;
    metrics?: string[];
    technicalChallenges?: string[];
    description?: string[];
    architecture?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    skillsEarned?: string[];
    type?: string;
    date?: string;
  }>;
  publications?: Array<{
    title: string;
    platform?: string;
    type?: string;
    link?: string;
    keywords?: string[];
    date?: string;
  }>;
  affiliations?: Array<{
    organization: string;
    role?: string;
    type?: string;
    impact?: string[];
    period?: { start?: string; end?: string; isCurrent?: boolean };
  }>;
  awards?: Array<{
    name: string;
    issuingBody?: string;
    date?: string;
    justification?: string;
  }>;
  interests?: Array<{
    activity: string;
    description?: string;
    commitmentMetric?: string;
  }> | string[];
  languages?: Array<{
    lang: string;
    proficiency?: string;
    score?: string;
  }>;
  metaDetails?: {
    name?: string;
    phone_no?: string;
    email?: string;
    github_profile?: string;
    linkedin?: string;
    address?: { city?: string; country?: string; postal_code?: string };
    extra_links?: Array<{ name: string; link: string }>;
  };
}

interface ResumeDataDisplayProps {
  resumeData: ResumeData;
}

export function ResumeDataDisplay({ resumeData }: ResumeDataDisplayProps) {
  // Helper to get summary (handle both formats)
  const summary = resumeData.Summary || resumeData.summary;
  
  // Helper to get education (handle both formats)
  const education = resumeData.Education || resumeData.education;
  
  // Helper to get skills (handle both formats)
  const skills = resumeData.Skills || resumeData.skills;
  
  // Helper to get experience (handle both formats)
  const experience = resumeData.Experience || resumeData.workHistory;
  
  // Helper to get projects (handle both formats)
  const projects = resumeData.Projects || resumeData.projects;
  
  // Helper to get activities (handle both formats)
  const activities = resumeData.Activities || resumeData.affiliations;
  
  // Helper to get interests (handle both formats)
  const interests = resumeData.Interests || resumeData.interests;
  
  // Helper to get additional info (handle both formats)
  const additionalInfo = resumeData.AdditionalInformation || resumeData.metaDetails;
  
  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              Professional Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              {summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="w-5 h-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {education.map((edu: any, idx: number) => {
              // Handle both formats
              const institution = edu.Institution || edu.institution;
              const degree = edu.Degree || edu.field?.type || '';
              const fieldOfStudy = edu.FieldOfStudy || edu.field?.course || '';
              const startDate = edu.StartDate || edu.period?.start || '';
              const endDate = edu.EndDate || edu.period?.end || (edu.period?.isCurrent ? 'Present' : '');
              const achievements = edu.Achievements || [];
              const output = edu.output || '';
              
              return (
                <div key={idx} className="pb-4 last:pb-0 border-b last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-base">{institution}</h4>
                      <p className="text-sm text-gray-700">
                        {degree} {fieldOfStudy && `in ${fieldOfStudy}`}
                      </p>
                      {output && <p className="text-xs text-gray-600 mt-1">{output}</p>}
                    </div>
                    {(startDate || endDate) && (
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {startDate} - {endDate || 'Present'}
                      </div>
                    )}
                  </div>
                  {achievements.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {achievements.map((achievement: string, i: number) => (
                        <li key={i} className="text-sm text-gray-600">
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Code className="w-5 h-5" />
              Technical Skills
            </CardTitle>
            <CardDescription>
              {skills.length} skill{skills.length !== 1 ? 's' : ''} identified
            </CardDescription>
          </CardHeader>
          <CardContent>
            {typeof skills[0] === 'string' ? (
              // Old format: array of strings
              <div className="flex flex-wrap gap-2">
                {(skills as string[]).map((skill, idx) => (
                  <Badge key={idx} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              // New format: array of skill objects
              <div className="space-y-4">
                {(skills as any[]).map((skillGroup: any, idx: number) => (
                  <div key={idx}>
                    <h4 className="font-semibold text-sm mb-2">{skillGroup.field}</h4>
                    <div className="flex flex-wrap gap-2">
                      {skillGroup.tools?.map((tool: any, toolIdx: number) => (
                        <Badge key={toolIdx} variant="secondary">
                          {tool.name}
                          {tool.score && <span className="ml-1 opacity-70">({tool.score})</span>}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="w-5 h-5" />
              Work Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {experience.map((exp: any, idx: number) => {
              // Handle both formats
              const company = exp.CompanyName || exp.company;
              const role = exp.Role || exp.title;
              const location = exp.Location || exp.location;
              const startDate = exp.StartDate || exp.period?.start || '';
              const endDate = exp.EndDate || exp.period?.end || (exp.period?.isCurrent ? 'Present' : '');
              const responsibilities = exp.Responsibilities || exp.responsibilities || [];
              const achievements = exp.achievements || [];
              
              return (
                <div key={idx} className="pb-4 last:pb-0 border-b last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-base">{role}</h4>
                      <p className="text-sm text-gray-700">{company}</p>
                      {location && (
                        <p className="text-xs text-gray-600">{location}</p>
                      )}
                    </div>
                    {(startDate || endDate) && (
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {startDate} - {endDate || 'Present'}
                      </div>
                    )}
                  </div>
                  {responsibilities.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {responsibilities.map((resp: string, i: number) => (
                        <li key={i} className="text-sm text-gray-600">
                          {resp}
                        </li>
                      ))}
                    </ul>
                  )}
                  {achievements.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-green-700 mb-1">Achievements:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {achievements.map((ach: string, i: number) => (
                          <li key={i} className="text-sm text-gray-600">
                            {ach}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderGit2 className="w-5 h-5" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.map((project: any, idx: number) => {
              // Handle both formats
              const projectName = project.ProjectName || project.title;
              const role = project.role;
              const startDate = project.StartDate || project.period?.start || '';
              const endDate = project.EndDate || project.period?.end || '';
              const responsibilities = project.Responsibilities || project.description || [];
              const techStack = project.techStack || [];
              const problemStatement = project.problemStatement;
              
              return (
                <div key={idx} className="pb-4 last:pb-0 border-b last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-base">{projectName}</h4>
                      {role && <p className="text-sm text-gray-700">{role}</p>}
                    </div>
                    {(startDate || endDate) && (
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {startDate} - {endDate || 'Present'}
                      </div>
                    )}
                  </div>
                  {problemStatement && (
                    <p className="text-sm text-gray-700 mb-2 italic">{problemStatement}</p>
                  )}
                  {techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {techStack.map((tech: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {Array.isArray(responsibilities) && responsibilities.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {responsibilities.map((resp: string, i: number) => (
                        <li key={i} className="text-sm text-gray-600">
                          {resp}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Certifications, Publications, Awards - Only in new format */}
      {resumeData.certifications && resumeData.certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="w-5 h-5" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resumeData.certifications.map((cert, idx) => (
              <div key={idx} className="pb-2 border-b last:border-0">
                <p className="font-semibold text-sm">{cert.name}</p>
                <p className="text-xs text-gray-600">{cert.issuer} • {cert.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Activities & Interests */}
      <div className="grid gap-6 md:grid-cols-2">
        {activities && activities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="w-5 h-5" />
                Activities & Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {typeof activities[0] === 'string' ? (
                <ul className="list-disc list-inside space-y-1">
                  {(activities as string[]).map((activity, idx) => (
                    <li key={idx} className="text-sm text-gray-600">
                      {activity}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-2">
                  {(activities as any[]).map((activity, idx) => (
                    <div key={idx} className="pb-2 border-b last:border-0">
                      <p className="font-semibold text-sm">{activity.organization}</p>
                      <p className="text-xs text-gray-600">{activity.role}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {interests && interests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interests</CardTitle>
            </CardHeader>
            <CardContent>
              {typeof interests[0] === 'string' ? (
                <div className="flex flex-wrap gap-2">
                  {(interests as string[]).map((interest, idx) => (
                    <Badge key={idx} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(interests as any[]).map((interest, idx) => (
                    <Badge key={idx} variant="outline">
                      {interest.activity}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Information */}
      {additionalInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            {typeof additionalInfo === 'string' ? (
              <p className="text-sm text-gray-700 leading-relaxed">
                {additionalInfo}
              </p>
            ) : (
              <div className="grid gap-2 text-sm">
                {additionalInfo.name && <p><span className="font-semibold">Name:</span> {additionalInfo.name}</p>}
                {additionalInfo.email && <p><span className="font-semibold">Email:</span> {additionalInfo.email}</p>}
                {additionalInfo.phone_no && <p><span className="font-semibold">Phone:</span> {additionalInfo.phone_no}</p>}
                {additionalInfo.linkedin && <p><span className="font-semibold">LinkedIn:</span> <a href={additionalInfo.linkedin} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{additionalInfo.linkedin}</a></p>}
                {additionalInfo.github_profile && <p><span className="font-semibold">GitHub:</span> <a href={additionalInfo.github_profile} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{additionalInfo.github_profile}</a></p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
