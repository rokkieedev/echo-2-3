import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PercentileCalculator } from '@/utils/percentileCalculator';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Timer
} from 'lucide-react';

interface TestInterfaceProps {
  testId: string;
  testTitle: string;
  anonUserId: string;
  onComplete: (result: any & { attemptId: string }) => void;
}

interface Question {
  id: string;
  question: string;
  options: string[] | null;
  subject: string;
  question_type: 'mcq' | 'numerical';
  order_number: number;
  image_url?: string;
  correct_answer?: string;
}

interface Response {
  questionId: string;
  answer: string;
  timeSpent: number;
  markedForReview: boolean;
}

export default function TestInterface({ testId, testTitle, anonUserId, onComplete }: TestInterfaceProps) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, Response>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(10800); // 3 hours default
  const [testDuration, setTestDuration] = useState(180);
  const [startTime] = useState(Date.now());
  const [attemptId, setAttemptId] = useState<string>('');
  const [tabSwitches, setTabSwitches] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    initializeTest();
  }, [testId]);

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.hidden) {
        setTabSwitches((prev) => {
          const next = prev + 1;
          if (next === 1) {
            toast({ title: 'Warning', description: 'Do not switch tabs during the test. Next time will auto-submit.', variant: 'destructive' });
          } else if (next >= 2) {
            supabase.from('test_attempts').update({ session_data: { violation: 'tab_switch_auto_submit' } }).eq('id', attemptId).then(() => {
              handleSubmitTest();
            });
          }
          return next;
        });
      }
    };
    const handleBlur = () => handleVisibility();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [attemptId, handleSubmitTest, toast]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const initializeTest = async () => {
    try {
      // Fetch test details and questions
      const [testRes, questionsRes] = await Promise.all([
        supabase.from('tests').select('*').eq('id', testId).single(),
        supabase.from('test_questions').select('id,question,options,subject,question_type,order_number,image_url,correct_answer').eq('test_id', testId).order('order_number')
      ]);

      if (testRes.error) throw testRes.error;
      if (questionsRes.error) throw questionsRes.error;

      const formattedQuestions = (questionsRes.data || []).map(q => ({
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        subject: q.subject,
        question_type: q.question_type as 'mcq' | 'numerical',
        order_number: q.order_number,
        image_url: q.image_url,
        correct_answer: q.correct_answer
      }));

      setQuestions(formattedQuestions);
      setTestDuration(testRes.data.duration);
      setTimeRemaining(testRes.data.duration * 60); // Convert to seconds

      // Create test attempt
      const { data: attempt, error: attemptError } = await supabase
        .from('test_attempts')
        .insert({
          test_id: testId,
          anon_user_id: anonUserId,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (attemptError) throw attemptError;
      setAttemptId(attempt.id);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load test",
        variant: "destructive",
      });
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  };

  const updateResponse = (questionId: string, answer: string, markedForReview = false) => {
    const currentTime = Date.now();
    const existingResponse = responses.get(questionId);
    const timeSpent = existingResponse ? existingResponse.timeSpent : 0;

    setResponses(prev => new Map(prev.set(questionId, {
      questionId,
      answer,
      timeSpent: timeSpent + 1, // Simplified time tracking
      markedForReview
    })));
  };

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleSubmitTest = useCallback(async () => {
    try {
      const endTime = Date.now();
      const totalDuration = Math.floor((endTime - startTime) / 1000);

      // Calculate score using correct answers
      let correctAnswers = 0;
      const subjectScores: Record<string, { correct: number; total: number }> = {};

      questions.forEach(question => {
        const response = responses.get(question.id);
        if (!subjectScores[question.subject]) {
          subjectScores[question.subject] = { correct: 0, total: 0 };
        }
        subjectScores[question.subject].total++;

        const isCorrect = response?.answer && question.correct_answer
          ? String(response.answer).trim() === String(question.correct_answer).trim()
          : false;
        if (isCorrect) {
          correctAnswers++;
          subjectScores[question.subject].correct++;
        }
      });

      const totalQuestions = questions.length;
      const score = Math.round((correctAnswers / Math.max(1, totalQuestions)) * 300);

      // Calculate percentile from dataset (mains/advanced)
      const testInfo = await supabase.from('tests').select('test_type').eq('id', testId).single();
      const exam = testInfo.data?.test_type === 'JEE' ? 'mains' as const : 'mains' as const;
      const p = await PercentileCalculator.calculatePercentile(Math.round(score), exam);
      const r = PercentileCalculator.calculatePredictedRank(p, exam);

      const { error: updateError } = await supabase
        .from('test_attempts')
        .update({
          submitted_at: new Date().toISOString(),
          duration_seconds: totalDuration,
          score,
          percentile: p,
          predicted_rank: r,
          per_subject_scores: subjectScores
        })
        .eq('id', attemptId);

      if (updateError) throw updateError;

      // Save individual responses
      const responseData = Array.from(responses.values()).map(response => ({
        attempt_id: attemptId,
        question_id: response.questionId,
        response_value: { answer: response.answer },
        time_spent_seconds: response.timeSpent,
        marked_for_review: response.markedForReview
      }));

      if (responseData.length > 0) {
        const { error: responsesError } = await supabase
          .from('test_responses')
          .insert(responseData);

        if (responsesError) throw responsesError;
      }

      onComplete({
        attemptId,
        score,
        percentile: p,
        predictedRank: r,
        totalQuestions,
        correctAnswers,
        subjectScores,
        duration: totalDuration
      });

    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [questions, responses, attemptId, startTime, anonUserId, onComplete, toast]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading test...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Questions Found</h3>
            <p className="text-muted-foreground mb-4">This test doesn't have any questions yet.</p>
            <Button onClick={() => navigate('/tests')}>Back to Tests</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = responses.get(currentQuestion.id);
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold">{testTitle}</h1>
              <Badge variant="secondary">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Timer className="h-4 w-4" />
                <span className={timeRemaining < 600 ? "text-red-500 font-semibold" : ""}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <Button onClick={handleSubmitTest} variant="destructive" size="sm">
                Submit Test
              </Button>
            </div>
          </div>
          
          <Progress value={progress} className="mt-2" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentQuestion.subject}</Badge>
                    <Badge variant={currentQuestion.question_type === 'mcq' ? 'default' : 'secondary'}>
                      {currentQuestion.question_type === 'mcq' ? 'Multiple Choice' : 'Numerical'}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateResponse(currentQuestion.id, currentResponse?.answer || '', true)}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Mark for Review
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose max-w-none">
                  <p className="text-lg">{currentQuestion.question}</p>
                  {currentQuestion.image_url && (
                    <img
                      src={currentQuestion.image_url}
                      alt="Question image"
                      className="question-img rounded-lg border mx-auto"
                    />
                  )}
                </div>

                {/* Answer Options */}
                {currentQuestion.question_type === 'mcq' ? (
                  <RadioGroup
                    value={currentResponse?.answer || ''}
                    onValueChange={(value) => updateResponse(currentQuestion.id, value)}
                  >
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted">
                        <RadioGroupItem value={String.fromCharCode(65 + index)} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="numerical-answer">Enter your answer:</Label>
                    <Input
                      id="numerical-answer"
                      type="number"
                      step="any"
                      placeholder="Enter numerical answer"
                      value={currentResponse?.answer || ''}
                      onChange={(e) => updateResponse(currentQuestion.id, e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => updateResponse(currentQuestion.id, '')}
                    >
                      Clear Response
                    </Button>
                    {currentResponse?.answer && (
                      <Button
                        variant="outline"
                        onClick={() => updateResponse(currentQuestion.id, currentResponse.answer, true)}
                      >
                        Save & Mark for Review
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-sm">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => {
                    const response = responses.get(questions[index].id);
                    const isAnswered = response?.answer;
                    const isMarkedForReview = response?.markedForReview;
                    const isCurrent = index === currentQuestionIndex;

                    return (
                      <Button
                        key={index}
                        variant={isCurrent ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-8 p-0 text-xs ${
                          isAnswered && !isCurrent ? 'bg-green-100 border-green-500' : ''
                        } ${
                          isMarkedForReview && !isCurrent ? 'bg-yellow-100 border-yellow-500' : ''
                        }`}
                        onClick={() => navigateToQuestion(index)}
                      >
                        {index + 1}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-500 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded"></div>
                    <span>Marked for Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-background border border-border rounded"></div>
                    <span>Not Answered</span>
                  </div>
                </div>

                <Button onClick={handleSubmitTest} className="w-full mt-4" variant="destructive">
                  Submit Test
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
