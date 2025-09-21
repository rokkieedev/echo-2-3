import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import TestInterface from '@/components/TestInterface';

export default function TestStart() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [anonUserId, setAnonUserId] = useState('');

  useEffect(() => {
    const init = async () => {
      if (!testId) return navigate('/tests');
      const anonKey = `anonUserId:${testId}`;
      const stored = sessionStorage.getItem(anonKey) || crypto.randomUUID();
      sessionStorage.setItem(anonKey, stored);
      setAnonUserId(stored);
      const { data, error } = await supabase.from('tests').select('title').eq('id', testId).single();
      if (error) return navigate('/tests');
      setTitle(data.title);
    };
    init();
  }, [testId, navigate]);

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
