'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader, TrendingUp, ArrowRight } from 'lucide-react';
import { ResumeAnalyzerMetrics } from '@/types/analyzer';

export function AnalyzerMetricsCard() {
  const [metrics, setMetrics] = useState<ResumeAnalyzerMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/analyzer/metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-64">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.totalAnalyses === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Resume Analysis
          </CardTitle>
          <CardDescription>
            Analyze your resume to get insights and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            No analyses yet. Start by uploading your resume and running a comprehensive analysis.
          </p>
          <Link href="/analyzer">
            <Button className="w-full">
              Go to Resume Analyzer
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Resume Analysis Summary
          </div>
          <Badge variant="outline">{metrics.totalAnalyses} analyses</Badge>
        </CardTitle>
        <CardDescription>
          Your resume performance metrics and insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Average Scores */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Average Scores</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: 'Overall',
                value: metrics.averageScores.overall,
                color: 'bg-blue-600',
              },
              {
                label: 'ATS',
                value: metrics.averageScores.ats,
                color: 'bg-purple-600',
              },
              {
                label: 'Readability',
                value: metrics.averageScores.readability,
                color: 'bg-green-600',
              },
              {
                label: 'Content',
                value: metrics.averageScores.content,
                color: 'bg-orange-600',
              },
            ].map((score) => (
              <div key={score.label} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-gray-700">{score.label}</span>
                  <span className={`font-bold ${score.color} text-white px-2 py-0.5 rounded text-xs`}>
                    {score.value}
                  </span>
                </div>
                <Progress value={score.value} />
              </div>
            ))}
          </div>
        </div>

        {/* Top Skills */}
        {metrics.topSkills.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Top Skills</h4>
            <div className="flex flex-wrap gap-1">
              {metrics.topSkills.slice(0, 5).map((skill) => (
                <Badge key={skill.skill} variant="secondary" className="text-xs">
                  {skill.skill} <span className="ml-1 opacity-70">×{skill.count}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Skills by Category */}
        {Object.values(metrics.skillDistribution).some((v) => v > 0) && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Skill Distribution</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Technical', value: metrics.skillDistribution.technical },
                { label: 'Soft', value: metrics.skillDistribution.soft },
                { label: 'Languages', value: metrics.skillDistribution.language },
                { label: 'Tools', value: metrics.skillDistribution.tool },
              ].map(
                (cat) =>
                  cat.value > 0 && (
                    <div
                      key={cat.label}
                      className="bg-gray-50 rounded p-2 text-center"
                    >
                      <p className="font-medium text-gray-700">{cat.value}</p>
                      <p className="text-gray-600">{cat.label}</p>
                    </div>
                  )
              )}
            </div>
          </div>
        )}

        {/* Common Missing Skills */}
        {metrics.commonMissingSkills.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Most Common Missing Skills</h4>
            <div className="space-y-1">
              {metrics.commonMissingSkills.slice(0, 3).map((skill) => (
                <div
                  key={skill.skill}
                  className="flex justify-between items-center text-xs bg-orange-50 p-2 rounded"
                >
                  <span>{skill.skill}</span>
                  <Badge variant="outline" className="text-xs">
                    {skill.frequency}x
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Link href="/analyzer" className="block pt-2">
          <Button variant="outline" className="w-full">
            View Full Analysis
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
