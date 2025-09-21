import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { PercentileCalculator } from '@/utils/percentileCalculator';
import { BarChart3, Clock, Trophy, ArrowLeft, PieChart as PieIcon, BarChart as BarIcon, FileDown } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';

interface Attempt {
  id: string;
  test_id: string;
  score: number | null;
  duration_seconds: number | null;
  per_subject_scores: Record<string, { correct: number; total: number }> | null;
}

interface TestRow { id: string; title: string; test_type: 'JEE' | 'NEET' | string; duration: number; }

interface ResponseRow { question_id: string; time_spent_seconds: number | null; marked_for_review: boolean | null; response_value: any; }
interface QuestionRow { id: string; subject: string; correct_answer: string; question_type: 'mcq' | 'numerical' | string; explanation: string | null; }

export default function TestAnalysis() {
  const { testId, attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [test, setTest] = useState<TestRow | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [percentile, setPercentile] = useState<number>(0);
  const [rank, setRank] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      if (!testId || !attemptId) return navigate('/tests');
      setLoading(true);
      try {
        const [attemptRes, testRes, respRes, qRes] = await Promise.all([
          supabase.from('test_attempts').select('*').eq('id', attemptId).single(),
          supabase.from('tests').select('id,title,test_type,duration').eq('id', testId).single(),
          supabase.from('test_responses').select('question_id,time_spent_seconds,marked_for_review,response_value').eq('attempt_id', attemptId),
          supabase.from('test_questions').select('id,subject,correct_answer,question_type,explanation').eq('test_id', testId),
        ]);
        if (attemptRes.error) throw attemptRes.error;
        if (testRes.error) throw testRes.error;
        if (respRes.error) throw respRes.error;
        if (qRes.error) throw qRes.error;
        setAttempt(attemptRes.data as Attempt);
        setTest(testRes.data as TestRow);
        setResponses(respRes.data as ResponseRow[]);
        setQuestions(qRes.data as QuestionRow[]);
      } catch {
        navigate('/tests');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [testId, attemptId, navigate]);

  useEffect(() => {
    const calc = async () => {
      if (!attempt || !test) return;
      const exam = test.test_type === 'JEE' ? 'mains' as const : 'mains' as const;
      const p = await PercentileCalculator.calculatePercentile(Math.round(attempt.score || 0), exam);
      setPercentile(p);
      const r = PercentileCalculator.calculatePredictedRank(p, exam);
      setRank(r);
    };
    calc();
  }, [attempt, test]);

  const totals = useMemo(() => {
    if (!attempt) return { score: 0, duration: 0 };
    return { score: Math.round(attempt.score || 0), duration: attempt.duration_seconds || 0 };
  }, [attempt]);

  const analysis = useMemo(() => {
    const qMap = new Map<string, QuestionRow>();
    questions.forEach(q => qMap.set(q.id, q));
    let correct = 0, attempted = 0;
    const perSubject: Record<string, { correct: number; incorrect: number; unattempted: number; total: number; score: number; max: number; accuracy: number }>= {};

    const respMap = new Map<string, ResponseRow>();
    responses.forEach(r => respMap.set(r.question_id, r));

    questions.forEach(q => {
      const r = respMap.get(q.id);
      const ans = (r?.response_value?.answer ?? '').toString().trim();
      const isAttempted = ans !== '';
      const isCorrect = isAttempted && ans.toUpperCase() === (q.correct_answer || '').toString().trim().toUpperCase();
      attempted += isAttempted ? 1 : 0;
      correct += isCorrect ? 1 : 0;
      const subj = q.subject || 'General';
      if (!perSubject[subj]) perSubject[subj] = { correct: 0, incorrect: 0, unattempted: 0, total: 0, score: 0, max: 0, accuracy: 0 };
      perSubject[subj].total += 1;
      perSubject[subj].max += 4;
      if (!isAttempted) {
        perSubject[subj].unattempted += 1;
      } else if (isCorrect) {
        perSubject[subj].correct += 1;
        perSubject[subj].score += 4;
      } else {
        perSubject[subj].incorrect += 1;
        if ((q.question_type as string) === 'mcq') perSubject[subj].score -= 1; // no negative for numerical
      }
    });
    Object.values(perSubject).forEach(s => {
      const att = s.correct + s.incorrect;
      s.accuracy = att ? Math.round((s.correct / att) * 1000) / 10 : 0;
    });

    const total = questions.length;
    const incorrect = attempted - correct;
    const unattempted = total - attempted;
    const totalPossible = total * 4;
    const overallAccuracy = attempted ? Math.round((correct / attempted) * 1000) / 10 : 0;

    return { qMap, respMap, correct, incorrect, unattempted, attempted, total, totalPossible, perSubject, overallAccuracy };
  }, [questions, responses]);

  const timeStats = useMemo(() => {
    if (responses.length === 0) return { avg: 0, perQuestion: [] as { q: number; t: number }[] };
    const perQuestion: { q: number; t: number }[] = responses.map((r, idx) => ({ q: idx + 1, t: r.time_spent_seconds || 0 }));
    const sum = perQuestion.reduce((a, b) => a + b.t, 0);
    const avg = perQuestion.length ? Math.round((sum / perQuestion.length)) : 0;
    return { avg, perQuestion };
  }, [responses]);

  if (loading || !attempt || !test) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center text-muted-foreground">Preparing your analysis...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => navigate('/tests')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tests
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <FileDown className="h-4 w-4 mr-2" /> Download Full Report (PDF)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" /> Result Summary</CardTitle>
          <CardDescription>{test.title}</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-5 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Score</div>
            <div className="text-2xl font-bold">{analysis.correct * 4 - (analysis.attempted - analysis.correct)}</div>
            <div className="text-xs text-muted-foreground">Out of {analysis.totalPossible}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Attempted</div>
            <div className="text-2xl font-bold">{analysis.attempted}</div>
            <div className="text-xs text-muted-foreground">Unattempted: {analysis.unattempted}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Overall Accuracy</div>
            <div className="text-2xl font-bold">{analysis.overallAccuracy}%</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Estimated Percentile</div>
            <div className="text-2xl font-bold">{percentile.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Estimated AIR</div>
            <div className="text-2xl font-bold">{rank.toLocaleString()}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarIcon className="h-5 w-5" /> Subject-wise Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(analysis.perSubject).length === 0 ? (
            <div className="text-sm text-muted-foreground">No subject data</div>
          ) : (
            Object.entries(analysis.perSubject).map(([subject, s]) => (
              <div key={subject} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{subject}</div>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="secondary">Correct: {s.correct}</Badge>
                    <Badge variant="destructive">Incorrect: {s.incorrect}</Badge>
                    <Badge variant="outline">Unattempted: {s.unattempted}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>Score: <strong>{s.score}</strong> / {s.max}</div>
                  <div>Accuracy: <strong>{s.accuracy}%</strong></div>
                  <div>Attempted: <strong>{s.correct + s.incorrect}</strong> / {s.total}</div>
                </div>
                <Progress value={s.total ? (s.correct / s.total) * 100 : 0} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PieIcon className="h-5 w-5" /> Overview Charts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="value" data={[
                    { name: 'Correct', value: analysis.correct },
                    { name: 'Incorrect', value: analysis.incorrect },
                    { name: 'Unattempted', value: analysis.unattempted },
                  ]} outerRadius={80} label>
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#94a3b8" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(analysis.perSubject).map(([subject, s]) => ({ subject, accuracy: s.accuracy, score: s.score }))}>
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="accuracy" fill="#3b82f6" name="Accuracy %" />
                  <Bar dataKey="score" fill="#22c55e" name="Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strong & Weak Areas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {Object.entries(analysis.perSubject).length === 0 ? (
            <div className="text-muted-foreground">Not enough data.</div>
          ) : (
            <>
              <div>
                <strong>Strong:</strong> {Object.entries(analysis.perSubject).filter(([,s]) => s.accuracy >= 80).map(([k]) => k).join(', ') || 'None'}
              </div>
              <div>
                <strong>Weak:</strong> {Object.entries(analysis.perSubject).filter(([,s]) => s.accuracy < 60).map(([k]) => k).join(', ') || 'None'}
              </div>
              <div className="text-muted-foreground">
                Recommendations: Focus more on subjects listed under Weak. Practice mixed MCQ and numerical problems, revise formulae, and analyze incorrect answers.
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Time Analysis</CardTitle>
          <CardDescription>Average time per question: {timeStats.avg}s</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {timeStats.perQuestion.slice(0, 20).map((q) => (
              <div key={q.q} className="flex items-center justify-between text-sm">
                <span>Q{q.q}</span>
                <span>{q.t}s</span>
              </div>
            ))}
            {timeStats.perQuestion.length > 20 && (
              <div className="text-xs text-muted-foreground">{timeStats.perQuestion.length - 20} more...</div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Focus on questions with unusually high time spent. Practice timed sections to improve speed.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question-level Review</CardTitle>
          <CardDescription>Answer status and explanations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {questions.map((q, idx) => {
            const r = analysis.respMap.get(q.id);
            const yourAns = (r?.response_value?.answer ?? '').toString();
            const attempted = yourAns !== '';
            const correct = attempted && yourAns.toUpperCase().trim() === (q.correct_answer||'').toString().trim().toUpperCase();
            return (
              <details key={q.id} className="border rounded p-3">
                <summary className="flex flex-wrap items-center justify-between cursor-pointer">
                  <span>Q{idx+1} • {q.subject}</span>
                  <span className={correct ? 'text-green-600' : attempted ? 'text-red-600' : 'text-muted-foreground'}>
                    {correct ? 'Correct' : attempted ? 'Incorrect' : 'Unattempted'}
                  </span>
                </summary>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                  <div>Subject: <strong>{q.subject}</strong></div>
                  <div>Your Answer: <strong>{yourAns || '-'}</strong></div>
                  <div>Correct Answer: <strong>{q.correct_answer}</strong></div>
                  <div>Status: <strong>{correct ? 'Correct' : attempted ? 'Incorrect' : 'Unattempted'}</strong></div>
                </div>
                {q.explanation && (
                  <div className="mt-2 text-muted-foreground">Explanation: {q.explanation}</div>
                )}
              </details>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
