import { useState, useRef, useEffect } from 'react';
import { PenTool, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import ExamTypeSelector from '@/components/ExamTypeSelector';
import AccessCodeDialog from '@/components/AccessCodeDialog';
import { useNavigate } from 'react-router-dom';

export default function Tests() {
  const navigate = useNavigate();
  const [examType, setExamType] = useState<'JEE' | 'NEET'>('JEE');
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTests();
  }, [examType]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('test_type', examType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCodeSuccess = (testData: any) => {
    const { testId, anonUserId } = testData;
    sessionStorage.setItem(`anonUserId:${testId}`, anonUserId);
    navigate(`/tests/${testId}`);
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 gradient-hero bg-clip-text text-transparent">
          Test Series
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Practice with mock tests and assessments designed to match JEE and NEET patterns
        </p>
      </div>

      <ExamTypeSelector 
        type="tests" 
        onTypeSelect={setExamType} 
        selectedType={examType} 
      />


      {/* Available Tests Display */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tests...</p>
        </div>
      ) : tests.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Card key={test.id} className="border-accent/20 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    <CardDescription className="mt-1">{test.description}</CardDescription>
                  </div>
                  <Badge variant="secondary">{test.test_type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{test.duration} minutes</span>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Access Code Required
                    </Badge>
                  </div>
                  
                  <Button 
                    onClick={() => setShowAccessDialog(true)} 
                    className="w-full"
                    variant="outline"
                  >
                    Unlock Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <PenTool className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No tests available</h3>
          <p>Tests will appear here once an admin creates them for {examType}.</p>
        </div>
      )}

      <AccessCodeDialog
        isOpen={showAccessDialog}
        onClose={() => setShowAccessDialog(false)}
        onSuccess={handleAccessCodeSuccess}
      />
    </div>
  );
}
