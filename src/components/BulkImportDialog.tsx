import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Question {
  question: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  subject: string;
  question_type: 'MCQ' | 'NUMERICAL';
  image_url?: string;
}

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (questions: Question[]) => Promise<void>;
  testId: string;
}

export default function BulkImportDialog({ open, onOpenChange, onImport, testId }: BulkImportDialogProps) {
  const [importData, setImportData] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<'input' | 'preview' | 'complete'>('input');

  const sampleCSV = `question,options,correct_answer,explanation,subject,question_type,image_url
"What is the derivative of x²?","""A) 2x"",""B) x"",""C) 2"",""D) x²""",A,The derivative of x² using power rule is 2x,Mathematics,MCQ,
"Find the integral of 2x dx","","x² + C","Integration of 2x gives x² + constant",Mathematics,NUMERICAL,"https://example.com/image.jpg"`;

  const sampleJSON = `[
  {
    "question": "What is the derivative of x²?",
    "options": ["A) 2x", "B) x", "C) 2", "D) x²"],
    "correct_answer": "A",
    "explanation": "The derivative of x² using power rule is 2x",
    "subject": "Mathematics",
    "question_type": "MCQ",
    "image_url": ""
  },
  {
    "question": "Find the integral of 2x dx",
    "correct_answer": "x² + C",
    "explanation": "Integration of 2x gives x² + constant",
    "subject": "Mathematics", 
    "question_type": "NUMERICAL",
    "image_url": "https://example.com/image.jpg"
  }
]`;

  const parseData = () => {
    try {
      setErrors([]);
      const trimmedData = importData.trim();
      
      if (!trimmedData) {
        setErrors(['Please provide data to import']);
        return;
      }

      let questions: Question[] = [];

      // Try parsing as JSON first
      if (trimmedData.startsWith('[') || trimmedData.startsWith('{')) {
        const jsonData = JSON.parse(trimmedData);
        questions = Array.isArray(jsonData) ? jsonData : [jsonData];
      } else {
        // Parse as CSV
        const lines = trimmedData.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split('","').map(v => v.replace(/"/g, '').trim());
          const question: any = {};
          
          headers.forEach((header, index) => {
            if (values[index]) {
              if (header === 'options' && values[index]) {
                question[header] = values[index].split('""').map((opt: string) => opt.replace(/"/g, '').trim()).filter((opt: string) => opt);
              } else {
                question[header] = values[index];
              }
            }
          });
          
          if (question.question) {
            questions.push(question);
          }
        }
      }

      // Validate questions
      const validationErrors: string[] = [];
      const validatedQuestions: Question[] = [];

      questions.forEach((q, index) => {
        const questionErrors: string[] = [];
        
        if (!q.question) questionErrors.push(`Row ${index + 1}: Missing question`);
        if (!q.correct_answer) questionErrors.push(`Row ${index + 1}: Missing correct answer`);
        if (!q.subject) questionErrors.push(`Row ${index + 1}: Missing subject`);
        if (!q.question_type || !['MCQ', 'NUMERICAL'].includes(q.question_type)) {
          questionErrors.push(`Row ${index + 1}: Invalid question type (must be MCQ or NUMERICAL)`);
        }
        
        if (q.question_type === 'MCQ' && (!q.options || !Array.isArray(q.options) || q.options.length < 2)) {
          questionErrors.push(`Row ${index + 1}: MCQ questions must have at least 2 options`);
        }

        if (questionErrors.length === 0) {
          validatedQuestions.push({
            question: q.question,
            options: q.question_type === 'MCQ' ? q.options : undefined,
            correct_answer: q.correct_answer,
            explanation: q.explanation || '',
            subject: q.subject,
            question_type: q.question_type,
            image_url: q.image_url || undefined,
          });
        } else {
          validationErrors.push(...questionErrors);
        }
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      if (validatedQuestions.length === 0) {
        setErrors(['No valid questions found in the data']);
        return;
      }

      if (validatedQuestions.length < 25 || validatedQuestions.length > 75) {
        setErrors([`Question count must be between 25-75. Found: ${validatedQuestions.length}`]);
        return;
      }

      setParsedQuestions(validatedQuestions);
      setStep('preview');
    } catch (error) {
      setErrors([`Parse error: ${error instanceof Error ? error.message : 'Invalid format'}`]);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      await onImport(parsedQuestions);
      setStep('complete');
    } catch (error) {
      setErrors([`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsImporting(false);
    }
  };

  const resetDialog = () => {
    setImportData('');
    setParsedQuestions([]);
    setErrors([]);
    setStep('input');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import Questions
          </DialogTitle>
          <DialogDescription>
            Import 25-75 questions at once using CSV or JSON format
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            {/* Format Examples */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">CSV Format</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {sampleCSV}
                  </pre>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">JSON Format</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {sampleJSON.substring(0, 300)}...
                  </pre>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-data">Import Data</Label>
              <Textarea
                id="import-data"
                placeholder="Paste your CSV or JSON data here..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={parseData} disabled={!importData.trim()}>
                <FileText className="h-4 w-4 mr-2" />
                Parse & Preview
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="font-semibold">
                {parsedQuestions.length} questions ready for import
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {Array.from(new Set(parsedQuestions.map(q => q.subject))).map(subject => (
                <Badge key={subject} variant="secondary">{subject}</Badge>
              ))}
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {parsedQuestions.slice(0, 5).map((q, index) => (
                <Card key={index} className="border-l-4 border-primary">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-xs">
                        {q.question_type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {q.subject}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">{q.question}</p>
                    {q.options && (
                      <div className="text-xs text-muted-foreground">
                        Options: {q.options.join(', ')}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Answer: {q.correct_answer}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {parsedQuestions.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  ... and {parsedQuestions.length - 5} more questions
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Import Successful!</h3>
            <p className="text-muted-foreground">
              {parsedQuestions.length} questions have been imported to your test.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'input' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? 'Importing...' : `Import ${parsedQuestions.length} Questions`}
              </Button>
            </>
          )}
          
          {step === 'complete' && (
            <Button onClick={resetDialog}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}