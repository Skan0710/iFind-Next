'use client';

import { useState, useEffect, useRef } from 'react';
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
  Upload,
  FileText,
  Sparkles,
  Zap,
  ArrowRight,
  Loader,
  CheckCircle,
  Download,
  ExternalLink,
  Trash2,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { AnalysisResults } from '@/components/analyzer/AnalysisResults';
import { SkillGapAnalyzer } from '@/components/analyzer/SkillGapAnalyzer';
import { AnalysisResult, ResumeAnalyzerMetrics } from '@/types/analyzer';
import type { User } from '@/types';

type UploadPhase = 'idle' | 'uploading' | 'extracting';

export default function AnalyzerPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [metrics, setMetrics] = useState<ResumeAnalyzerMetrics | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const [deleting, setDeleting] = useState(false);
  const [reextracting, setReextracting] = useState(false);
  const [dragging, setDragging] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const hasResume = !!user?.resume?.driveViewLink;
  const hasExtractedData = !!user?.resume?.parsedData;
  const isUploading = uploadPhase !== 'idle';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch user data
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const data = await userRes.json();
        setUser(data.user);
      }

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

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB.');
      return;
    }

    // Phase 1: Upload
    setUploadPhase('uploading');
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch('/api/user/resume', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');

      toast.success('Resume uploaded!');
      
      // Refresh user data to show the uploaded resume
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      setUploadPhase('idle');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    // Phase 2: Extract data
    setUploadPhase('extracting');
    try {
      const res = await fetch('/api/user/resume/reextract', {
        method: 'POST',
        credentials: 'include',
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Extraction failed');

      toast.success('Resume data extracted successfully!');
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Extraction failed - you can retry with Re-extract');
    } finally {
      setUploadPhase('idle');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remove your resume? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/user/resume', {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Resume removed.');
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete resume');
    } finally {
      setDeleting(false);
    }
  };

  const handleReextract = async () => {
    if (!user?.resume?.driveFileId) return;
    setReextracting(true);
    try {
      const res = await fetch('/api/user/resume/reextract', {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Resume file not found. Please re-upload your resume.');
        } else {
          throw new Error(json.error || 'Re-extraction failed');
        }
        return;
      }
      toast.success('Resume data re-extracted successfully!');
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Re-extraction failed');
    } finally {
      setReextracting(false);
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
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze resume');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Resume Analyzer</h1>
              <p className="text-gray-600 mt-1">
                Upload, extract, and analyze your resume for better job matching
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Resume Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Your Resume
              </CardTitle>
              <CardDescription>
                Upload your resume in PDF format for AI-powered analysis and job matching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Zone */}
              {!hasResume && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !isUploading && fileRef.current?.click()}
                  className={[
                    'relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer',
                    isUploading ? 'pointer-events-none opacity-70' : '',
                    dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50',
                  ].join(' ')}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />

                  {uploadPhase === 'uploading' && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <Upload className="h-8 w-8 text-blue-600 animate-bounce" />
                      </div>
                      <p className="text-lg font-medium text-blue-600">Uploading resume…</p>
                      <p className="text-sm text-gray-500">Saving your file securely</p>
                    </div>
                  )}

                  {uploadPhase === 'extracting' && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-purple-600 animate-pulse" />
                      </div>
                      <p className="text-lg font-medium text-purple-600">Extracting data from resume…</p>
                      <p className="text-sm text-gray-500">AI is reading your resume</p>
                    </div>
                  )}

                  {uploadPhase === 'idle' && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          Drag & drop your resume here
                        </p>
                        <p className="text-sm text-gray-500 mt-1">or click to browse — PDF only, max 5MB</p>
                      </div>
                      <Button size="lg">Choose File</Button>
                    </div>
                  )}
                </div>
              )}

              {/* Current Resume */}
              {hasResume && user?.resume && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-900">Resume.pdf</p>
                        <p className="text-sm text-green-700">
                          Uploaded {user.resume.uploadedAt && new Date(user.resume.uploadedAt).toLocaleDateString()}
                        </p>
                        {uploadPhase === 'extracting' && (
                          <div className="flex items-center gap-2 mt-2">
                            <Loader className="h-4 w-4 text-purple-500 animate-spin" />
                            <span className="text-sm text-purple-600 font-medium">Extracting data…</span>
                          </div>
                        )}
                        {hasExtractedData && uploadPhase === 'idle' && (
                          <div className="flex items-center gap-2 mt-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600 font-medium">Data extracted</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50" style={{ height: 480 }}>
                    <iframe
                      src={user.resume.driveViewLink!}
                      className="w-full h-full"
                      title="Resume Preview"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <a href={user.resume.driveViewLink!} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open PDF
                      </Button>
                    </a>
                    {user.resume.driveFileId && (
                      <a href={`/api/user/resume/download/${user.resume.driveFileId}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileRef.current?.click()}
                      disabled={isUploading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Replace
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReextract}
                      loading={reextracting}
                      disabled={reextracting || isUploading}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {reextracting ? 'Extracting…' : 'Re-extract Data'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDelete}
                      loading={deleting}
                      disabled={isUploading}
                      className="ml-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Section */}
          {hasExtractedData && (
            <>
              {/* Action Card */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Ready to Analyze Your Resume?
                  </CardTitle>
                  <CardDescription>
                    {user?.name && `Hi ${user.name}! `}Your resume data is extracted. Get detailed analysis, skill recommendations, and matching internship opportunities.
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
                </CardContent>
              </Card>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
