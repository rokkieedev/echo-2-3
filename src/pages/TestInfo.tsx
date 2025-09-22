import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, ListChecks, Layers, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLockStatus } from '@/utils/testLock';

interface TestRow {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  test_type: 'JEE' | 'NEET' | string;
  created_at: string;
}

interface QuestionRow {
  id: string;
  subject: string;
  question_type: 'mcq' | 'numerical' | string;
}

export default function TestInfo() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<TestRow | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!testId) return;
      setLoading(true);
      try {
        const [testRes, qRes] = await Promise.all([
          supabase.from('tests').select('*').eq('id', testId).single(),
          supabase.from('test_questions').select('id,subject,question_type').eq('test_id', testId)
        ]);
        if (testRes.error) throw testRes.error;
        if (qRes.error) throw qRes.error;
        setTest(testRes.data as unknown as TestRow);
        setQuestions((qRes.data || []) as unknown as QuestionRow[]);
      } catch (e) {
        navigate('/tests');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [testId, navigate]);

  const subjects = useMemo(() => Array.from(new Set(questions.map(q => q.subject))), [questions]);
  const questionTypes = useMemo(() => Array.from(new Set(questions.map(q => q.question_type))), [questions]);

  const markingScheme = useMemo(() => {
    const parts: string[] = [];
    if (questionTypes.includes('mcq')) parts.push('MCQ: +4 for correct, -1 for incorrect');
    if (questionTypes.includes('numerical')) parts.push('Numerical: +4 for correct, 0 for incorrect');
    if (parts.length === 0) parts.push('Scoring as per question type');
    return parts;
  }, [questionTypes]);

  const handleStart = () => {
    if (!testId) return;
    const anonKey = `anonUserId:${testId}`;
    const anonUserId = sessionStorage.getItem(anonKey) || crypto.randomUUID();
    sessionStorage.setItem(anonKey, anonUserId);
    navigate(`/tests/${testId}/start`);
  };

  if (loading || !test) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center text-muted-foreground">Loading test info...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{test.title}</CardTitle>
              <CardDescription>{test.description}</CardDescription>
            </div>
            <Badge variant="secondary">{test.test_type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /><span>Subjects</span></div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              {subjects.length > 0 ? subjects.map(s => (
                <Badge key={s} variant="outline">{s}</Badge>
              )) : <span className="text-muted-foreground">Not specified</span>}
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>Total duration</span></div>
            <div className="md:col-span-2">{test.duration} minutes</div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2"><Layers className="h-4 w-4" /><span>Marking scheme</span></div>
            <div className="md:col-span-2 space-y-1">
              {markingScheme.map((m, i) => (<div key={i}>{m}</div>))}
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2"><ListChecks className="h-4 w-4" /><span>Number of questions</span></div>
            <div className="md:col-span-2">{questions.length}</div>
          </div>

          <div className="pt-2">
            <Button className="w-full md:w-auto" onClick={handleStart}>Start Test</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
