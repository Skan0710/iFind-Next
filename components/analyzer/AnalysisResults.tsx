'use client';

import { AnalysisResult } from '@/types/analyzer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Lightbulb,
  Zap,
} from 'lucide-react';

interface AnalysisResultsProps {
  analysis: AnalysisResult;
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <Tabs defaultValue="scores" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="scores">Scores</TabsTrigger>
        <TabsTrigger value="skills">Skills</TabsTrigger>
        <TabsTrigger value="recommendations">Tips</TabsTrigger>
        <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
      </TabsList>

      {/* Scores Tab */}
      <TabsContent value="scores" className="space-y-4">
        <div className="grid gap-4">
          {/* Overall Score */}
          <Card className={getScoreBg(analysis.scores.overall)}>
            <CardHeader>
              <CardTitle className="text-lg">Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-4xl font-bold ${getScoreColor(analysis.scores.overall)}`}>
                    {analysis.scores.overall}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Resume quality assessment
                  </p>
                </div>
                <Progress
                  value={analysis.scores.overall}
                  className="w-32 h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Individual Scores */}
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { label: 'ATS Score', value: analysis.scores.ats },
              { label: 'Readability', value: analysis.scores.readability },
              { label: 'Format', value: analysis.scores.format },
              { label: 'Content', value: analysis.scores.content },
            ].map((score) => (
              <Card key={score.label}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">{score.label}</p>
                      <p className={`font-bold ${getScoreColor(score.value)}`}>
                        {score.value}
                      </p>
                    </div>
                    <Progress value={score.value} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* Skills Tab */}
      <TabsContent value="skills" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Extracted Skills</CardTitle>
            <CardDescription>
              {analysis.extractedSkills.length} skills identified from your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['technical', 'soft', 'language', 'tool'].map((category) => {
                const skillsInCategory = analysis.extractedSkills.filter(
                  (s) => s.category === category
                );
                if (skillsInCategory.length === 0) return null;

                return (
                  <div key={category}>
                    <h4 className="text-sm font-semibold mb-2 capitalize">
                      {category} Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {skillsInCategory.map((skill) => (
                        <Badge
                          key={skill.name}
                          variant="outline"
                          className="capitalize"
                        >
                          {skill.name}
                          <span className="ml-1 text-xs opacity-70">
                            ({skill.proficiency[0].toUpperCase()})
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Recommendations Tab */}
      <TabsContent value="recommendations" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Recommendations
            </CardTitle>
            <CardDescription>
              How to improve your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-3">
                  <Zap className="w-5 h-5 mt-0.5 text-yellow-600 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Missing Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Skills to Develop
            </CardTitle>
            <CardDescription>
              Skills commonly required in job market
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.missingSkills.slice(0, 5).map((skill, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium text-sm">{skill.skill}</p>
                    <p className="text-xs text-gray-600">
                      {skill.category} • Importance: {skill.importance}
                    </p>
                  </div>
                  <Badge
                    variant={
                      skill.importance === 'high'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {skill.importance}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Opportunities Tab */}
      <TabsContent value="opportunities" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Matched Internship Opportunities
            </CardTitle>
            <CardDescription>
              Internships that match your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!analysis.matchedInternships || analysis.matchedInternships.length === 0 ? (
              <p className="text-sm text-gray-600">
                No matched internships found. Try uploading a more complete resume.
              </p>
            ) : (
              <div className="space-y-4">
                {analysis.matchedInternships.map((match) => (
                  <div
                    key={match.internshipId}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-sm">
                            Match Score: {match.matchScore}%
                          </p>
                          <Progress
                            value={match.matchScore}
                            className="w-24 h-1.5"
                          />
                        </div>
                        <p className="text-sm text-gray-700">
                          {match.matchAnalysis}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                      <div>
                        <p className="font-medium mb-1">Matched Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {match.matchedSkills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-xs"
                            >
                              ✓ {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {match.missingSkills.length > 0 && (
                        <div>
                          <p className="font-medium mb-1">Missing Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {match.missingSkills.map((skill) => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="text-xs"
                              >
                                ✗ {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
