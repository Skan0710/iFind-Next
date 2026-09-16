'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface SkillGapAnalyzerProps {
  analysisId: string;
}

interface GapAnalysisResult {
  matchedSkills: string[];
  missingSkills: string[];
  skillMatchScore: number;
  totalRequired: number;
  totalMatched: number;
  recommendations?: Array<{
    skill: string;
    priority: 'high' | 'medium' | 'low';
    estimatedWeeks: number;
    resources: string[];
  }>;
}

export function SkillGapAnalyzer({ analysisId }: SkillGapAnalyzerProps) {
  const [skills, setSkills] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapAnalysisResult | null>(null);

  const addSkill = () => {
    if (inputValue.trim() && !skills.includes(inputValue.trim())) {
      setSkills([...skills, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const analyzeGap = async () => {
    if (skills.length === 0) {
      toast.error('Please add at least one skill');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/analyzer/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          requiredSkills: skills,
        }),
      });

      if (!res.ok) throw new Error('Failed to analyze skill gap');

      const data = await res.json();
      setResult(data.data);
      toast.success('Skill gap analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze skill gap');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Skill Gap Analyzer</CardTitle>
          <CardDescription>
            Compare your skills against job requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Enter Required Skills (press Enter or click Add)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., React, Node.js, AWS"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addSkill();
                  }
                }}
              />
              <Button
                onClick={addSkill}
                size="sm"
                variant="outline"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {skills.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                Selected Skills ({skills.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={analyzeGap}
            disabled={skills.length === 0 || loading}
            className="w-full"
          >
            {loading ? 'Analyzing...' : 'Analyze Gap'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Match Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Match Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium">Overall Match</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {result.skillMatchScore}%
                    </p>
                  </div>
                  <ProgressBar value={result.skillMatchScore} />
                  <p className="text-xs text-gray-600 mt-2">
                    You have {result.totalMatched} of {result.totalRequired} required skills
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Matched Skills */}
          {result.matchedSkills.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700">
                  ✓ Skills You Have ({result.matchedSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.matchedSkills.map((skill) => (
                    <Badge key={skill} variant="outline" className="border-green-300 bg-green-100">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Missing Skills */}
          {result.missingSkills.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-700">
                  ✗ Skills to Develop ({result.missingSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.missingSkills.map((skill) => (
                    <div key={skill} className="p-3 bg-white border border-orange-200 rounded">
                      <p className="font-medium text-sm">{skill}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Learning Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Learning Recommendations</CardTitle>
                <CardDescription>
                  Suggested path to close skill gaps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.recommendations.map((rec) => (
                    <div key={rec.skill} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{rec.skill}</h4>
                        <Badge
                          variant={
                            rec.priority === 'high'
                              ? 'destructive'
                              : rec.priority === 'medium'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Estimated time: {rec.estimatedWeeks} weeks
                      </p>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700">
                          Recommended Resources:
                        </p>
                        {rec.resources.map((resource, idx) => (
                          <p key={idx} className="text-xs text-gray-600 ml-2">
                            • {resource}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
