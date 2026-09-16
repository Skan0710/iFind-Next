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
import { Badge } from '@/components/ui/Badge';
import { 
  Map, 
  Target, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Loader,
  ChevronRight,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface RoadmapPhase {
  phase: string;
  duration: string;
  focus: string;
  skills: string[];
  resources: Array<{
    type: string;
    title: string;
    description: string;
  }>;
  milestones: string[];
}

interface LearningRoadmapProps {
  missingSkills: Array<{
    skill: string;
    category: string;
    importance: string;
  }>;
  currentSkills: string[];
}

export function LearningRoadmap({ missingSkills, currentSkills }: LearningRoadmapProps) {
  const [roadmap, setRoadmap] = useState<RoadmapPhase[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateRoadmap = async () => {
    try {
      setGenerating(true);
      const res = await fetch('/api/analyzer/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missingSkills,
          currentSkills,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate roadmap');
      }

      const data = await res.json();
      setRoadmap(data.roadmap);
      toast.success('Learning roadmap generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate roadmap');
    } finally {
      setGenerating(false);
    }
  };

  const getPriorityColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & CTA */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Map className="w-5 h-5" />
            Personalized Learning Roadmap
          </CardTitle>
          <CardDescription className="text-purple-800">
            Get a structured learning path to acquire the skills you need for your target internships
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!roadmap ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm">Skills to Develop ({missingSkills.length}):</h4>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.slice(0, 10).map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className={getPriorityColor(skill.importance)}
                    >
                      {skill.skill}
                    </Badge>
                  ))}
                  {missingSkills.length > 10 && (
                    <Badge variant="secondary">
                      +{missingSkills.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                onClick={generateRoadmap}
                disabled={generating || missingSkills.length === 0}
                size="lg"
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Generating Your Roadmap...
                  </>
                ) : (
                  <>
                    <Map className="w-4 h-4 mr-2" />
                    Generate Learning Roadmap
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setRoadmap(null)}
              variant="outline"
              size="sm"
            >
              Generate New Roadmap
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Roadmap Display */}
      {roadmap && (
        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Your Learning Journey
              </CardTitle>
              <CardDescription>
                A {roadmap.length}-phase roadmap tailored to your current skills and goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{roadmap.length}</p>
                  <p className="text-sm text-gray-600 mt-1">Learning Phases</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">
                    {roadmap.reduce((acc, phase) => acc + phase.skills.length, 0)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Skills to Learn</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">
                    {roadmap.reduce((acc, phase) => acc + phase.milestones.length, 0)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Milestones</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phases */}
          {roadmap.map((phase, phaseIdx) => (
            <Card key={phaseIdx} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {phaseIdx + 1}
                      </div>
                      {phase.phase}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {phase.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {phase.focus}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-blue-50">
                    Phase {phaseIdx + 1}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Skills */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Skills to Master
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {phase.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Learning Resources
                  </h4>
                  <div className="space-y-2">
                    {phase.resources.map((resource, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="text-xs">
                            {resource.type}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{resource.title}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {resource.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Key Milestones
                  </h4>
                  <ul className="space-y-2">
                    {phase.milestones.map((milestone, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">{milestone}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Phase Connector */}
                {phaseIdx < roadmap.length - 1 && (
                  <div className="flex items-center justify-center pt-4">
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Action CTA */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Ready to Start Learning?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Follow this roadmap step by step to build the skills employers are looking for
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline">
                    Download Roadmap
                  </Button>
                  <Button>
                    Track My Progress
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
