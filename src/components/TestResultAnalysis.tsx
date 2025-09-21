import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  BookOpen,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronRight,
  Download
} from 'lucide-react';

interface TestResult {
  testId: string;
  testTitle: string;
  totalMarks: number;
  scoredMarks: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  percentile: number;
  predictedRank: number;
  timeTaken: number; // in minutes
  maxTime: number; // in minutes
  subjectWiseResults: SubjectResult[];
  questionAnalysis: QuestionResult[];
}

interface SubjectResult {
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  marks: number;
  maxMarks: number;
  accuracy: number;
  avgTimePerQuestion: number; // in seconds
}

interface QuestionResult {
  questionId: string;
  questionText: string;
  imageUrl?: string;
  subject: string;
  correctAnswer: string;
  userAnswer?: string;
  isCorrect: boolean;
  isSkipped: boolean;
  timeTaken: number; // in seconds
  explanation?: string;
}

interface TestResultAnalysisProps {
  result: TestResult;
  onClose: () => void;
}

export default function TestResultAnalysis({ result, onClose }: TestResultAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'questions'>('overview');

  const calculatePercentile = (score: number, totalMarks: number): number => {
    // Mock percentile calculation based on JEE/NEET patterns
    const percentage = (score / totalMarks) * 100;
    
    // Rough percentile mapping based on historical data
    if (percentage >= 95) return 99.9;
    if (percentage >= 90) return 99.0;
    if (percentage >= 85) return 97.0;
    if (percentage >= 80) return 95.0;
    if (percentage >= 75) return 90.0;
    if (percentage >= 70) return 85.0;
    if (percentage >= 65) return 80.0;
    if (percentage >= 60) return 75.0;
    if (percentage >= 55) return 70.0;
    if (percentage >= 50) return 60.0;
    if (percentage >= 45) return 50.0;
    if (percentage >= 40) return 40.0;
    if (percentage >= 35) return 30.0;
    if (percentage >= 30) return 20.0;
    return Math.max(percentage / 2, 1);
  };

  const calculatePredictedRank = (percentile: number): number => {
    // Based on JEE Main appearing candidates (~12 lakh)
    const totalCandidates = 1200000;
    return Math.round(totalCandidates * (100 - percentile) / 100);
  };

  const getStrengthsAndWeaknesses = () => {
    const sortedSubjects = [...result.subjectWiseResults].sort((a, b) => b.accuracy - a.accuracy);
    const strongest = sortedSubjects[0];
    const weakest = sortedSubjects[sortedSubjects.length - 1];
    
    return { strongest, weakest };
  };

  const getTimeEfficiency = () => {
    const timePercentage = (result.timeTaken / result.maxTime) * 100;
    if (timePercentage < 70) return { rating: 'Fast', color: 'text-green-600', advice: 'Good speed! Consider double-checking answers.' };
    if (timePercentage < 90) return { rating: 'Optimal', color: 'text-blue-600', advice: 'Well-balanced time management.' };
    if (timePercentage < 100) return { rating: 'Slow', color: 'text-orange-600', advice: 'Practice time management techniques.' };
    return { rating: 'Very Slow', color: 'text-red-600', advice: 'Focus on speed and accuracy balance.' };
  };

  const { strongest, weakest } = getStrengthsAndWeaknesses();
  const timeEfficiency = getTimeEfficiency();
  const overallAccuracy = (result.correctAnswers / result.totalQuestions) * 100;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-hero bg-clip-text text-transparent">
            Test Result Analysis
          </h1>
          <p className="text-muted-foreground">{result.testTitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: Trophy },
          { id: 'analysis', label: 'Analysis', icon: TrendingUp },
          { id: 'questions', label: 'Questions', icon: BookOpen },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id as any)}
            className="flex-1"
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Score Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Score Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{result.scoredMarks}/{result.totalMarks}</div>
                  <div className="text-sm text-muted-foreground">Total Score</div>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold text-success">{result.percentile.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Percentile</div>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold text-warning">{result.predictedRank.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Predicted AIR</div>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold text-accent">{overallAccuracy.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-600">{result.correctAnswers}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <X className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-600">{result.incorrectAnswers}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Incorrect</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-600">{result.skippedQuestions}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Quick Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Strongest Subject</span>
                  <Badge variant="secondary">{strongest?.subject}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {strongest?.accuracy.toFixed(1)}% accuracy
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Needs Work</span>
                  <Badge variant="outline">{weakest?.subject}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {weakest?.accuracy.toFixed(1)}% accuracy
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Time Efficiency</span>
                  <Badge className={timeEfficiency.color}>{timeEfficiency.rating}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {timeEfficiency.advice}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Subject-wise Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Performance</CardTitle>
              <CardDescription>Detailed breakdown of your performance in each subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {result.subjectWiseResults.map((subject, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{subject.subject}</h3>
                      <Badge variant="outline">
                        {subject.marks}/{subject.maxMarks} marks
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Accuracy</div>
                        <div className="font-semibold">{subject.accuracy.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Correct/Total</div>
                        <div className="font-semibold">{subject.correctAnswers}/{subject.totalQuestions}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg. Time</div>
                        <div className="font-semibold">{Math.round(subject.avgTimePerQuestion)}s</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Efficiency</div>
                        <div className="font-semibold">
                          {subject.avgTimePerQuestion < 60 ? 'Good' : 
                           subject.avgTimePerQuestion < 90 ? 'Average' : 'Slow'}
                        </div>
                      </div>
                    </div>

                    <Progress value={subject.accuracy} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Management Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Time Used</span>
                    <span className="font-semibold">{result.timeTaken} minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Available Time</span>
                    <span className="font-semibold">{result.maxTime} minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Time Efficiency</span>
                    <span className={`font-semibold ${timeEfficiency.color}`}>
                      {timeEfficiency.rating}
                    </span>
                  </div>
                  <Progress 
                    value={(result.timeTaken / result.maxTime) * 100} 
                    className="h-3" 
                  />
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Recommendations</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• {timeEfficiency.advice}</li>
                    <li>• Average time per question: {Math.round((result.timeTaken * 60) / result.totalQuestions)}s</li>
                    <li>• Focus on {weakest?.subject} to improve overall score</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <Card>
          <CardHeader>
            <CardTitle>Question-by-Question Analysis</CardTitle>
            <CardDescription>Review each question with explanations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {result.questionAnalysis.map((question, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  question.isCorrect ? 'bg-green-50 border-green-200' :
                  question.isSkipped ? 'bg-orange-50 border-orange-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Q{index + 1}</span>
                      <Badge variant="outline" className="text-xs">{question.subject}</Badge>
                      {question.isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {question.isSkipped && <AlertCircle className="h-4 w-4 text-orange-600" />}
                      {!question.isCorrect && !question.isSkipped && <X className="h-4 w-4 text-red-600" />}
                    </div>
                    <span className="text-sm text-muted-foreground">{question.timeTaken}s</span>
                  </div>
                  
                  <p className="text-sm mb-2">{question.questionText}</p>
                  
                  {question.imageUrl && (
                    <img
                      src={question.imageUrl}
                      alt="Question diagram"
                      className="question-img mb-3 rounded border mx-auto"
                    />
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Correct Answer: </span>
                      <span className="font-semibold text-green-600">{question.correctAnswer}</span>
                    </div>
                    {question.userAnswer && (
                      <div>
                        <span className="text-muted-foreground">Your Answer: </span>
                        <span className={`font-semibold ${
                          question.isCorrect ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {question.userAnswer}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {question.explanation && (
                    <div className="mt-3 p-3 bg-background rounded border">
                      <span className="font-semibold text-sm">Explanation: </span>
                      <p className="text-sm text-muted-foreground">{question.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
