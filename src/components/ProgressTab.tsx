import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  BookOpen,
  BarChart3,
  Trophy,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PercentileCalculator } from '@/utils/percentileCalculator';

interface TestAttempt {
  id: string;
  test_id: string;
  score: number;
  percentile: number;
  predicted_rank: number;
  submitted_at: string;
  duration_seconds: number;
  per_subject_scores: any;
  tests: {
    title: string;
    test_type: string;
  };
}

interface ProgressTabProps {
  onViewFullAnalysis?: (attempt: TestAttempt) => void;
}

export default function ProgressTab({ onViewFullAnalysis }: ProgressTabProps) {
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTests: 0,
    averageScore: 0,
    bestPercentile: 0,
    improvementTrend: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  const fetchUserProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select(`
          id,
          test_id,
          score,
          percentile,
          predicted_rank,
          submitted_at,
          duration_seconds,
          per_subject_scores,
          tests!inner(title, test_type)
        `)
        .eq('anon_user_id', user?.id)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setAttempts(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (attempts: TestAttempt[]) => {
    if (attempts.length === 0) {
      setStats({ totalTests: 0, averageScore: 0, bestPercentile: 0, improvementTrend: 0 });
      return;
    }

    const totalTests = attempts.length;
    const averageScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalTests;
    const bestPercentile = Math.max(...attempts.map(attempt => attempt.percentile));
    
    // Calculate improvement trend (compare first and last 3 attempts)
    let improvementTrend = 0;
    if (totalTests >= 3) {
      const recent = attempts.slice(0, 3);
      const older = attempts.slice(-3);
      const recentAvg = recent.reduce((sum, attempt) => sum + attempt.percentile, 0) / recent.length;
      const olderAvg = older.reduce((sum, attempt) => sum + attempt.percentile, 0) / older.length;
      improvementTrend = recentAvg - olderAvg;
    }

    setStats({ totalTests, averageScore, bestPercentile, improvementTrend });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getSubjectPerformance = (perSubjectScores: any) => {
    if (!perSubjectScores) return [];
    
    return Object.entries(perSubjectScores).map(([subject, data]: [string, any]) => ({
      subject,
      score: data.score || 0,
      total: data.total || 0,
      percentage: data.total > 0 ? (data.score / data.total) * 100 : 0
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Tests Attempted Yet</h3>
          <p className="text-muted-foreground mb-6">
            Attempt your first test to see your progress and performance analytics here.
          </p>
          <Button>
            Browse Tests
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Tests Taken</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.totalTests}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">Avg Score</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.averageScore.toFixed(0)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Best Percentile</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.bestPercentile.toFixed(1)}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${stats.improvementTrend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <span className="text-sm font-medium text-muted-foreground">Trend</span>
            </div>
            <div className={`text-2xl font-bold mt-2 ${stats.improvementTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.improvementTrend >= 0 ? '+' : ''}{stats.improvementTrend.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Performance
          </CardTitle>
          <CardDescription>Your latest test attempts and scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attempts.map((attempt) => {
              const subjectScores = getSubjectPerformance(attempt.per_subject_scores);
              const performance = PercentileCalculator.getPerformanceCategory(attempt.percentile);
              
              return (
                <div key={attempt.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{attempt.tests.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attempt.submitted_at).toLocaleDateString('en-IN')} • 
                        {formatDuration(attempt.duration_seconds)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {attempt.tests.test_type}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Rank: {attempt.predicted_rank.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-2xl font-bold text-primary">{attempt.score}</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{attempt.percentile}%</div>
                      <div className="text-xs text-muted-foreground">Percentile</div>
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${performance.color}`}>
                        {performance.category}
                      </div>
                      <div className="text-xs text-muted-foreground">Performance</div>
                    </div>
                    <div className="flex justify-end">
                      {onViewFullAnalysis && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onViewFullAnalysis(attempt)}
                        >
                          View Analysis <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {subjectScores.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Subject-wise Performance</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {subjectScores.map((subject) => (
                          <div key={subject.subject} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{subject.subject}</span>
                              <span>{subject.score}/{subject.total}</span>
                            </div>
                            <Progress value={subject.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}