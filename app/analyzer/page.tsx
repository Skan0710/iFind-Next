'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import {
  AlertCircle,
  TrendingUp,
  Zap,
  ArrowRight,
  Loader,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { AnalysisResults } from '@/components/analyzer/AnalysisResults';
import { SkillGapAnalyzer } from '@/components/analyzer/SkillGapAnalyzer';
import { AnalysisResult, ResumeAnalyzerMetrics } from '@/types/analyzer';

export default function AnalyzerPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [metrics, setMetrics] = useState<ResumeAnalyzerMetrics | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchData();
    checkResume();
  }, []);

  const checkResume = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setHasResume(!!data.user?.resume?.parsedData);
        setUserName(data.user?.name || '');
      }
    } catch (error) {
      console.error('Error checking resume:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch analyses
      const analysisRes = await fetch('/api/analyzer/results');
      if (analysisRes.ok) {
        const data = await analysisRes.json();
        setAnalyses(data.data);
        if (data.data.length > 0) {
          setSelectedAnalysis(data.data[0]);
        }
      }

      // Fetch metrics
      const metricsRes = await fetch('/api/analyzer/metrics');
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load analyzer data');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      const res = await fetch('/api/analyzer/analyze', {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const data = await res.json();
      toast.success('Resume analysis complete!');

      // Refresh data
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze resume');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading analyzer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Resume Analyzer</h1>
        <p className="text-gray-600">
          Get comprehensive analysis of your resume and find matching internships
        </p>
      </div>

      {/* Action Card */}
      {!hasResume ? (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="w-5 h-5" />
              Resume Required
            </CardTitle>
            <CardDescription className="text-orange-800">
              Please upload your resume first to use the Resume Analyzer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard?tab=profile">
              <Button variant="outline" size="lg" className="border-orange-600 text-orange-600 hover:bg-orange-100">
                Go to Profile to Upload Resume
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Ready to Analyze Your Resume?
            </CardTitle>
            <CardDescription>
              {userName && `Hi ${userName}! `}Your resume is ready. Get detailed analysis, skill recommendations, and matching internship opportunities based on your uploaded resume data.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              onClick={runAnalysis}
              disabled={analyzing}
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Your Resume...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Analyze My Resume
                </>
              )}
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Metrics Overview */}
      {metrics && metrics.totalAnalyses > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {metrics.totalAnalyses}
                </p>
                <p className="text-sm text-gray-600 mt-1">Total Analyses</p>
              </div>
            </CardContent>
          </Card>

          {[
            { label: 'Overall', value: metrics.averageScores.overall },
            { label: 'ATS', value: metrics.averageScores.ats },
            { label: 'Readability', value: metrics.averageScores.readability },
            { label: 'Content', value: metrics.averageScores.content },
          ].map((score) => (
            <Card key={score.label}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {score.value}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Avg {score.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Analyses List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Analyses</CardTitle>
              <CardDescription>
                {analyses.length} analysis{analyses.length !== 1 ? 'es' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyses.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    No analyses yet. Click the button above to start.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {analyses.map((analysis) => (
                    <button
                      key={analysis._id}
                      onClick={() => setSelectedAnalysis(analysis)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedAnalysis?._id === analysis._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            Analysis
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(analysis.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className="ml-2">
                          {analysis.scores.overall}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Skills */}
          {metrics && metrics.topSkills.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Top Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.topSkills.slice(0, 5).map((skill) => (
                    <div key={skill.skill} className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{skill.skill}</span>
                        <span className="text-gray-600">{skill.count}x</span>
                      </div>
                      <ProgressBar value={(skill.count / metrics.totalAnalyses) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Analysis Details */}
        <div className="lg:col-span-2">
          {selectedAnalysis ? (
            <div className="space-y-4">
              <AnalysisResults analysis={selectedAnalysis} />

              {/* Skill Gap Analyzer */}
              <Card>
                <CardHeader>
                  <CardTitle>Compare with Job Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkillGapAnalyzer analysisId={selectedAnalysis._id!} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-600 mb-2">
                  No Analysis Selected
                </p>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Analyze your resume to see detailed insights and recommendations
                </p>
                <Button onClick={runAnalysis} disabled={analyzing}>
                  {analyzing ? 'Analyzing...' : 'Start Analysis'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
