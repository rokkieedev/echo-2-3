import { useState, useEffect } from 'react';
import { FileText, Download, ExternalLink, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ExamTypeSelector from '@/components/ExamTypeSelector';
import { supabase } from '@/integrations/supabase/client';

export default function Assignments() {
  const [examType, setExamType] = useState<'JEE' | 'NEET'>('JEE');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, [examType]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'Physics': return 'bg-blue-500';
      case 'Chemistry': return 'bg-green-500';
      case 'Mathematics': return 'bg-purple-500';
      case 'Biology': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    return `Due in ${diffDays} days`;
  };

  const handleDownload = (assignment: any) => {
    if (assignment.isExternal) {
      window.open(assignment.downloadUrl, '_blank');
    } else {
      console.log('Downloading:', assignment.title);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 gradient-accent bg-clip-text text-transparent">
          Assignments
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Practice problems and homework assignments to strengthen your conceptual understanding
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-card text-center">
          <CardContent className="p-4">
            <FileText className="h-6 w-6 mx-auto mb-2 text-accent" />
            <div className="text-2xl font-bold">{assignments.length}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="shadow-card text-center">
          <CardContent className="p-4">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-success" />
            <div className="text-2xl font-bold">{assignments.filter(a => {
              const dueDate = new Date(a.due_date);
              const now = new Date();
              const diffTime = dueDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays >= 0 && diffDays <= 7;
            }).length}</div>
            <div className="text-sm text-muted-foreground">This Week</div>
          </CardContent>
        </Card>
        <Card className="shadow-card text-center">
          <CardContent className="p-4">
            <User className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">1</div>
            <div className="text-sm text-muted-foreground">Instructors</div>
          </CardContent>
        </Card>
        <Card className="shadow-card text-center">
          <CardContent className="p-4">
            <Download className="h-6 w-6 mx-auto mb-2 text-warning" />
            <div className="text-2xl font-bold">{assignments.length * 15}</div>
            <div className="text-sm text-muted-foreground">Downloads</div>
          </CardContent>
        </Card>
      </div>

      <ExamTypeSelector 
        type="assignments" 
        onTypeSelect={setExamType} 
        selectedType={examType} 
      />

      {/* Assignments Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      ) : assignments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="border-accent/20 hover:border-primary/20 transition-colors shadow-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight">{assignment.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {assignment.subject}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={getSubjectColor(assignment.subject)}
                  >
                    {assignment.subject}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignment.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {assignment.description}
                    </p>
                  )}
                  
                  {assignment.due_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className={
                        formatDueDate(assignment.due_date) === 'Due Today' ? 'text-red-600 font-semibold' :
                        formatDueDate(assignment.due_date) === 'Overdue' ? 'text-red-500' :
                        'text-muted-foreground'
                      }>
                        {formatDueDate(assignment.due_date)}
                      </span>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => window.open(assignment.file_url, '_blank')} 
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Assignment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No assignments available</h3>
          <p>Assignments will appear here once an admin uploads them.</p>
        </div>
      )}

      {/* Call to Action */}
      <div className="text-center mt-12">
        <Card className="max-w-2xl mx-auto shadow-card">
          <CardHeader>
            <CardTitle>Need Help with Assignments?</CardTitle>
            <CardDescription>
              Contact our instructors or join study groups for collaborative problem-solving
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline">Join Discussion Group</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}