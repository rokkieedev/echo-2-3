import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Upload, Trash2, Image as ImageIcon, GripVertical } from 'lucide-react';

interface TestCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  subject: string;
  question_type: 'mcq' | 'numerical';
  image_url?: string;
  image_path?: string;
}

export default function TestCreationDialog({ isOpen, onClose, onSuccess }: TestCreationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const [testData, setTestData] = useState({
    title: '',
    description: '',
    duration: 180, // 3 hours default
    test_type: 'JEE' as 'JEE' | 'NEET',
    access_start_at: '' as string | '',
    access_end_at: '' as string | '',
    is_locked: false,
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const dragItemIndex = useRef<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    subject: '',
    question_type: 'mcq',
    image_url: '',
    image_path: ''
  });

  const resetForm = () => {
    setTestData({
      title: '',
      description: '',
      duration: 180,
      test_type: 'JEE',
      access_start_at: '',
      access_end_at: '',
      is_locked: false,
    });
    setQuestions([]);
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      subject: '',
      question_type: 'mcq',
      image_url: '',
      image_path: ''
    });
    setActiveTab('basic');
  };

  const addQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.subject || !currentQuestion.correct_answer) {
      toast({
        title: "Incomplete Question",
        description: "Please fill all required fields for the question.",
        variant: "destructive",
      });
      return;
    }

    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      question: currentQuestion.question!,
      options: currentQuestion.question_type === 'mcq' ? currentQuestion.options! : [],
      correct_answer: currentQuestion.correct_answer!,
      explanation: currentQuestion.explanation || '',
      subject: currentQuestion.subject!,
      question_type: currentQuestion.question_type!,
      image_url: currentQuestion.image_url,
      image_path: currentQuestion.image_path
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      subject: '',
      question_type: 'mcq',
      image_url: '',
      image_path: ''
    });

    toast({
      title: "Question Added",
      description: `Question ${questions.length + 1} added successfully.`,
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.name.endsWith('.json')) {
          const imported = JSON.parse(content);
          if (Array.isArray(imported)) {
            const validQuestions = imported.filter(q => 
              q.question && q.subject && q.correct_answer
            ).map(q => ({
              ...q,
              id: Math.random().toString(36).substr(2, 9),
              options: q.options || [],
              explanation: q.explanation || '',
              question_type: q.question_type || 'mcq'
            }));
            
            setQuestions([...questions, ...validQuestions]);
            toast({
              title: "Questions Imported",
              description: `${validQuestions.length} questions imported successfully.`,
            });
          }
        } else if (file.name.endsWith('.csv')) {
          // Parse CSV format: question,option1,option2,option3,option4,correct_answer,explanation,subject,question_type
          const lines = content.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',');
          
          if (headers.length < 8) {
            throw new Error('Invalid CSV format. Required columns: question,option1,option2,option3,option4,correct_answer,explanation,subject,question_type');
          }
          
          const validQuestions = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            return {
              id: Math.random().toString(36).substr(2, 9),
              question: values[0],
              options: values[4] ? [values[1], values[2], values[3], values[4]] : [],
              correct_answer: values[5],
              explanation: values[6] || '',
              subject: values[7],
              question_type: (values[8] || 'mcq') as 'mcq' | 'numerical'
            };
          }).filter(q => q.question && q.subject && q.correct_answer);
          
          setQuestions([...questions, ...validQuestions]);
          toast({
            title: "Questions Imported",
            description: `${validQuestions.length} questions imported from CSV successfully.`,
          });
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid file format. Please check your file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const createTest = async () => {
    if (!testData.title || questions.length === 0) {
      toast({
        title: "Incomplete Test",
        description: "Please provide test title and at least one question.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create test
      const { data: test, error: testError } = await supabase
        .from('tests')
        .insert({
          title: testData.title,
          description: testData.description,
          duration: testData.duration,
          test_type: testData.test_type
        })
        .select()
        .single();

      if (testError) throw testError;

      // Add questions
      const questionsData = questions.map((q, index) => ({
        test_id: test.id,
        question: q.question,
        options: q.question_type === 'mcq' ? q.options : null,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        subject: q.subject,
        question_type: q.question_type,
        order_number: index + 1,
        image_url: q.image_url || null,
        image_path: q.image_path || null
      }));

      const { error: questionsError } = await supabase
        .from('test_questions')
        .insert(questionsData);

      if (questionsError) throw questionsError;

      toast({
        title: "Test Created",
        description: `"${testData.title}" created with ${questions.length} questions.`,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubjectOptions = () => {
    if (testData.test_type === 'JEE') {
      return ['Physics', 'Chemistry', 'Mathematics'];
    } else {
      return ['Physics', 'Chemistry', 'Biology'];
    }
  };

  const handleDragStart = (index: number) => {
    dragItemIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (dragItemIndex.current === null || dragItemIndex.current === index) return;
    const updated = [...questions];
    const [moved] = updated.splice(dragItemIndex.current, 1);
    updated.splice(index, 0, moved);
    setQuestions(updated);
    dragItemIndex.current = null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Test</DialogTitle>
          <DialogDescription>
            Create a comprehensive test with questions and import options
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="questions">Add Questions</TabsTrigger>
            <TabsTrigger value="import">Import Questions</TabsTrigger>
            <TabsTrigger value="review">Review & Create</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Test Title</Label>
                <Input
                  id="title"
                  placeholder="Enter test title"
                  value={testData.title}
                  onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_type">Exam Type</Label>
                <Select value={testData.test_type} onValueChange={(value: 'JEE' | 'NEET') => setTestData({ ...testData, test_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JEE">JEE</SelectItem>
                    <SelectItem value="NEET">NEET</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Test description (optional)"
                value={testData.description}
                onChange={(e) => setTestData({ ...testData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="30"
                max="300"
                value={testData.duration}
                onChange={(e) => setTestData({ ...testData, duration: parseInt(e.target.value) })}
              />
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={currentQuestion.subject} onValueChange={(value) => setCurrentQuestion({ ...currentQuestion, subject: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSubjectOptions().map(subject => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <Select value={currentQuestion.question_type} onValueChange={(value: 'mcq' | 'numerical') => setCurrentQuestion({ ...currentQuestion, question_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                        <SelectItem value="numerical">Numerical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    placeholder="Enter question text"
                    value={currentQuestion.question}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                  />
                </div>

                {currentQuestion.question_type === 'mcq' && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {currentQuestion.options?.map((option, index) => (
                      <Input
                        key={index}
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(currentQuestion.options || [])];
                          newOptions[index] = e.target.value;
                          setCurrentQuestion({ ...currentQuestion, options: newOptions });
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Input
                    placeholder={currentQuestion.question_type === 'mcq' ? "Enter correct option (A, B, C, or D)" : "Enter numerical answer"}
                    value={currentQuestion.correct_answer}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    placeholder="Explanation for the answer"
                    value={currentQuestion.explanation}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Question Image (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Image URL"
                      value={currentQuestion.image_url || ''}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, image_url: e.target.value })}
                    />
                    <input
                      ref={imageFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
                          const { error: upErr } = await supabase.storage.from('question-images').upload(path, file, { upsert: true, contentType: file.type });
                          if (upErr) throw upErr;
                          const { data: pub } = supabase.storage.from('question-images').getPublicUrl(path);
                          setCurrentQuestion((prev) => ({ ...prev, image_url: pub.publicUrl, image_path: path }));
                          toast({ title: 'Image uploaded', description: 'Image attached to question.' });
                        } catch (err: any) {
                          try {
                            const fileReader = new FileReader();
                            fileReader.onload = () => {
                              const dataUrl = String(fileReader.result || '');
                              setCurrentQuestion((prev) => ({ ...prev, image_url: dataUrl, image_path: '' }));
                              toast({ title: 'Inline image used', description: 'Stored image as data URL to avoid storage dependency.' });
                            };
                            fileReader.readAsDataURL(file);
                          } catch (inner) {
                            toast({ title: 'Upload failed', description: err.message || 'Could not upload image', variant: 'destructive' });
                          }
                        } finally {
                          if (imageFileInputRef.current) imageFileInputRef.current.value = '';
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={() => imageFileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" /> Upload
                    </Button>
                  </div>
                  {currentQuestion.image_url && (
                    <div className="flex items-center gap-2">
                      <img src={currentQuestion.image_url} alt="Question" className="h-16 w-16 object-cover rounded border" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentQuestion({ ...currentQuestion, image_url: '', image_path: '' })}>
                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    </div>
                  )}
                </div>

                <Button onClick={addQuestion} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Import Questions</CardTitle>
                  <CardDescription>
                    Import questions for comprehensive test creation (25-75 JEE, 180 NEET questions)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">JSON Format</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Upload a JSON file with question objects
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        className="hidden"
                      />
                      <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Import JSON
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">CSV Format</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Upload CSV with: question,opt1,opt2,opt3,opt4,answer,explanation,subject,type
                      </p>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileImport}
                        className="hidden"
                        id="csv-upload"
                      />
                      <Button onClick={() => document.getElementById('csv-upload')?.click()} variant="outline" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Import CSV
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="font-semibold mb-2">Test Specifications</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• JEE: 25-75 questions (Physics, Chemistry, Mathematics)</li>
                      <li>• NEET: 180 questions (45 Physics, 45 Chemistry, 90 Biology)</li>
                      <li>• Questions should include proper marking scheme and explanations</li>
                      <li>• Supports both MCQ and numerical answer types</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Title:</strong> {testData.title || 'Not set'}</p>
                  <p><strong>Type:</strong> {testData.test_type}</p>
                  <p><strong>Duration:</strong> {testData.duration} minutes</p>
                  <p><strong>Questions:</strong> {questions.length}</p>
                </div>
              </CardContent>
            </Card>

            {questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Questions ({questions.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                  {questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="flex items-center justify-between p-2 border rounded bg-background"
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" aria-hidden />
                        <Badge variant="secondary">{q.subject}</Badge>
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                        <span className="text-sm truncate max-w-md">{q.question}</span>
                        {q.image_url ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : null}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeQuestion(q.id)} aria-label="Remove question">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Button onClick={createTest} disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Test"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
