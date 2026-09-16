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
}

interface ResumeDataDisplayProps {
  resumeData: ResumeData;
}

export function ResumeDataDisplay({ resumeData }: ResumeDataDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      {resumeData.Summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              Professional Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              {resumeData.Summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {resumeData.Education && resumeData.Education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="w-5 h-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumeData.Education.map((edu, idx) => (
              <div key={idx} className="pb-4 last:pb-0 border-b last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-base">{edu.Institution}</h4>
                    <p className="text-sm text-gray-700">
                      {edu.Degree} {edu.FieldOfStudy && `in ${edu.FieldOfStudy}`}
                    </p>
                  </div>
                  {(edu.StartDate || edu.EndDate) && (
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {edu.StartDate} - {edu.EndDate || 'Present'}
                    </div>
                  )}
                </div>
                {edu.Achievements && edu.Achievements.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {edu.Achievements.map((achievement, i) => (
                      <li key={i} className="text-sm text-gray-600">
                        {achievement}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {resumeData.Skills && resumeData.Skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Code className="w-5 h-5" />
              Technical Skills
            </CardTitle>
            <CardDescription>
              {resumeData.Skills.length} skills identified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {resumeData.Skills.map((skill, idx) => (
                <Badge key={idx} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {resumeData.Experience && resumeData.Experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="w-5 h-5" />
              Work Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumeData.Experience.map((exp, idx) => (
              <div key={idx} className="pb-4 last:pb-0 border-b last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-base">{exp.Role}</h4>
                    <p className="text-sm text-gray-700">{exp.CompanyName}</p>
                    {exp.Location && (
                      <p className="text-xs text-gray-600">{exp.Location}</p>
                    )}
                  </div>
                  {(exp.StartDate || exp.EndDate) && (
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {exp.StartDate} - {exp.EndDate || 'Present'}
                    </div>
                  )}
                </div>
                {exp.Responsibilities && exp.Responsibilities.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {exp.Responsibilities.map((resp, i) => (
                      <li key={i} className="text-sm text-gray-600">
                        {resp}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      {resumeData.Projects && resumeData.Projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderGit2 className="w-5 h-5" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumeData.Projects.map((project, idx) => (
              <div key={idx} className="pb-4 last:pb-0 border-b last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-base">{project.ProjectName}</h4>
                  {(project.StartDate || project.EndDate) && (
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {project.StartDate} - {project.EndDate || 'Present'}
                    </div>
                  )}
                </div>
                {project.Responsibilities && project.Responsibilities.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {project.Responsibilities.map((resp, i) => (
                      <li key={i} className="text-sm text-gray-600">
                        {resp}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Activities & Interests */}
      <div className="grid gap-6 md:grid-cols-2">
        {resumeData.Activities && resumeData.Activities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="w-5 h-5" />
                Activities & Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {resumeData.Activities.map((activity, idx) => (
                  <li key={idx} className="text-sm text-gray-600">
                    {activity}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {resumeData.Interests && resumeData.Interests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {resumeData.Interests.map((interest, idx) => (
                  <Badge key={idx} variant="outline">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Information */}
      {resumeData.AdditionalInformation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              {resumeData.AdditionalInformation}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
