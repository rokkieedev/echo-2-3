import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  FileText, 
  ClipboardList, 
  TrendingUp, 
  Users, 
  Calendar,
  Award
} from 'lucide-react';
import { useISTClock } from '@/hooks/useISTClock';
import { supabase } from '@/integrations/supabase/client';
import NoticeBoard from './NoticeBoard';

export default function Dashboard() {
  const currentTime = useISTClock();
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalAssignments: 0,
    totalTests: 0,
    totalUsers: 0
  });
  const [student, setStudent] = useState<{ id: string; name: string; institute?: string } | null>(null);
  const [personal, setPersonal] = useState({
    lastAttempt: null as null | { testTitle: string; date: string; score: number; percentile: number },
    nextTest: null as null | { title: string; date: string },
    avgScore: 0,
    strongAreas: [] as string[],
    weakAreas: [] as string[],
    recommendations: ''
  });

  useEffect(() => {
    fetchStats();
    const id = localStorage.getItem('studentId');
    const name = localStorage.getItem('studentName');
    const institute = localStorage.getItem('studentInstitute') || undefined;
    if (id && name) setStudent({ id, name, institute });
  }, []);

  useEffect(() => {
    if (student) fetchPersonalized(student.id);
  }, [student]);

  const fetchStats = async () => {
    try {
      const [booksRes, assignmentsRes, testsRes] = await Promise.all([
        supabase.from('books').select('id', { count: 'exact' }),
        supabase.from('assignments').select('id', { count: 'exact' }),
        supabase.from('tests').select('id', { count: 'exact' })
      ]);

      setStats({
        totalBooks: booksRes.count || 0,
        totalAssignments: assignmentsRes.count || 0,
        totalTests: testsRes.count || 0,
        totalUsers: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPersonalized = async (studentId: string) => {
    try {
      const { data: attempts } = await supabase
        .from('test_attempts')
        .select('id,test_id,score,percentile,submitted_at,per_subject_scores')
        .eq('anon_user_id', studentId)
        .order('submitted_at', { ascending: false })
        .limit(10);

      if (!attempts || attempts.length === 0) {
        setPersonal({
          lastAttempt: null,
          nextTest: null,
          avgScore: 0,
          strongAreas: [],
          weakAreas: [],
          recommendations: 'Start a test to see insights.'
        });
        return;
      }

      const testIds = attempts.map(a => a.test_id);
      const { data: tests } = await supabase.from('tests').select('id,title').in('id', testIds);
      const titleMap = new Map(tests?.map(t => [t.id, t.title] as const));

      const last = attempts[0];
      const lastAttempt = {
        testTitle: titleMap.get(last.test_id) || 'Test',
        date: last.submitted_at || '',
        score: Math.round(last.score || 0),
        percentile: Math.round((last.percentile || 0) * 10) / 10,
      };

      const avgScore = Math.round((attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length) * 10) / 10;

      const subjectAgg: Record<string, { correct: number; total: number }> = {};
      attempts.forEach(a => {
        const per = a.per_subject_scores as any as Record<string, { correct: number; total: number }> | null;
        if (per) Object.entries(per).forEach(([subj, val]) => {
          if (!subjectAgg[subj]) subjectAgg[subj] = { correct: 0, total: 0 };
          subjectAgg[subj].correct += val.correct;
          subjectAgg[subj].total += val.total;
        });
      });
      const subjectRates = Object.entries(subjectAgg).map(([s, v]) => ({ s, rate: v.total ? v.correct / v.total : 0 }));
      subjectRates.sort((a, b) => b.rate - a.rate);
      const strongAreas = subjectRates.filter(x => x.rate >= 0.7).map(x => x.s);
      const weakAreas = subjectRates.filter(x => x.rate < 0.5).map(x => x.s);
      const recommendations = weakAreas.length > 0 ? `Focus on ${weakAreas.join(', ')} and practice timed sets.` : 'Keep up the good work. Attempt mixed practice sets.';

      setPersonal({ lastAttempt, nextTest: null, avgScore, strongAreas, weakAreas, recommendations });
    } catch (e) {
      console.error(e);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-hero bg-clip-text text-transparent">
                IIT JEE ECHO
              </h1>
              <p className="text-muted-foreground text-sm">Excellence through Practice</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {currentTime.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <span>•</span>
            <div>{currentTime.toLocaleTimeString('en-IN')}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">

            {student && (
              <Card>
                <CardHeader>
                  <CardTitle>Welcome, {student.name}</CardTitle>
                  <CardDescription>{student.institute ? `Institute: ${student.institute}` : 'Personalized dashboard'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded">
                      <div className="text-xs text-muted-foreground">Last Attempt</div>
                      {personal.lastAttempt ? (
                        <div>
                          <div className="font-medium">{personal.lastAttempt.testTitle}</div>
                          <div className="text-xs text-muted-foreground">{new Date(personal.lastAttempt.date).toLocaleString()}</div>
                          <div className="mt-1 text-sm">Score: {personal.lastAttempt.score} • {personal.lastAttempt.percentile}%</div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No attempts yet</div>
                      )}
                    </div>
                    <div className="p-4 border rounded">
                      <div className="text-xs text-muted-foreground">Next Scheduled Test</div>
                      <div className="text-sm">No upcoming tests scheduled</div>
                    </div>
                    <div className="p-4 border rounded">
                      <div className="text-xs text-muted-foreground">Average Score</div>
                      <div className="text-2xl font-bold">{personal.avgScore}</div>
                    </div>
                    <div className="p-4 border rounded">
                      <div className="text-xs text-muted-foreground">Recommendations</div>
                      <div className="text-sm">{personal.recommendations}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded">
                      <div className="text-sm font-medium mb-2">Strong Areas</div>
                      <div className="flex flex-wrap gap-2">
                        {personal.strongAreas.length ? personal.strongAreas.map(s => (<Badge key={s} variant="secondary">{s}</Badge>)) : <span className="text-sm text-muted-foreground">—</span>}
                      </div>
                    </div>
                    <div className="p-4 border rounded">
                      <div className="text-sm font-medium mb-2">Weak Areas</div>
                      <div className="flex flex-wrap gap-2">
                        {personal.weakAreas.length ? personal.weakAreas.map(s => (<Badge key={s} variant="destructive">{s}</Badge>)) : <span className="text-sm text-muted-foreground">—</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-accent/20 hover:border-primary/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalBooks}</p>
                      <p className="text-sm text-muted-foreground">Books Available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/20 hover:border-primary/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalAssignments}</p>
                      <p className="text-sm text-muted-foreground">Assignments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/20 hover:border-primary/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <ClipboardList className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalTests}</p>
                      <p className="text-sm text-muted-foreground">Practice Tests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/20 hover:border-primary/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                      <p className="text-sm text-muted-foreground">Active Students</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Access your study materials and tests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                    <a href="/books">
                      <BookOpen className="h-6 w-6" />
                      <span>Browse Books</span>
                      <Badge variant="secondary" className="text-xs">{stats.totalBooks} Available</Badge>
                    </a>
                  </Button>
                  
                  <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                    <a href="/assignments">
                      <FileText className="h-6 w-6" />
                      <span>View Assignments</span>
                      <Badge variant="secondary" className="text-xs">{stats.totalAssignments} Active</Badge>
                    </a>
                  </Button>
                  
                  <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                    <a href="/tests">
                      <ClipboardList className="h-6 w-6" />
                      <span>Take Tests</span>
                      <Badge variant="secondary" className="text-xs">{stats.totalTests} Available</Badge>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

          {/* Notice Board */}
          <NoticeBoard />
        </div>
      </div>
    </div>
  );
};
