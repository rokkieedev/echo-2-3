import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import TestInterface from '@/components/TestInterface';
import { useToast } from '@/hooks/use-toast';
import { getLockStatus } from '@/utils/testLock';

export default function TestStart() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [anonUserId, setAnonUserId] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      if (!testId) return navigate('/tests');
      const studentId = localStorage.getItem('studentId');
      const anonKey = studentId ? `student:${studentId}` : `anonUserId:${testId}`;
      const stored = studentId || sessionStorage.getItem(anonKey) || crypto.randomUUID();
      if (!studentId) sessionStorage.setItem(anonKey, stored);
      setAnonUserId(stored);
      const { data, error } = await supabase.from('tests').select('*').eq('id', testId).single();
      if (error || !data) return navigate('/tests');
      const status = getLockStatus(data as any);
      if (!status.open) {
        toast({ title: 'Test Locked', description: status.reason || 'Not accessible now', variant: 'destructive' });
        navigate('/tests');
        return;
      }
      setTitle(data.title as string);
    };
    init();
  }, [testId, navigate, toast]);

  if (!testId || !anonUserId) return null;

  return (
    <TestInterface
      testId={testId}
      testTitle={title}
      anonUserId={anonUserId}
      onComplete={(result) => navigate(`/tests/${testId}/analysis/${result.attemptId}`)}
    />
  );
}
