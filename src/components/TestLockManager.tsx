import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getLockStatus, formatDateTime, TestWithLock } from '@/utils/testLock';

export default function TestLockManager() {
  const [tests, setTests] = useState<TestWithLock[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    const { data, error } = await supabase.from('tests').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: 'Failed to load tests', variant: 'destructive' });
      return;
    }
    setTests((data || []) as any);
  };

  const updateLock = async (t: TestWithLock) => {
    setSavingId(t.id);
    try {
      const payload: Record<string, any> = {};
      if (typeof t.is_locked !== 'undefined') payload.is_locked = !!t.is_locked;
      if (typeof t.access_start_at !== 'undefined') payload.access_start_at = t.access_start_at || null;
      if (typeof t.access_end_at !== 'undefined') payload.access_end_at = t.access_end_at || null;

      if (Object.keys(payload).length === 0) return;

      const { error } = await supabase.from('tests').update(payload).eq('id', t.id);
      if (error) throw error;
      toast({ title: 'Updated', description: 'Lock settings saved' });
      await loadTests();
    } catch (e: any) {
      toast({
        title: 'Update Failed',
        description: 'Ensure columns exist on tests: is_locked boolean, access_start_at timestamptz, access_end_at timestamptz.',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  };

  const setField = (id: string, field: keyof TestWithLock, value: any) => {
    setTests(prev => prev.map(t => (t.id === id ? { ...t, [field]: value } : t)));
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Test Lock & Schedule</CardTitle>
        <CardDescription>Control when each test is accessible</CardDescription>
      </CardHeader>
      <CardContent>
        {tests.length === 0 ? (
          <div className="text-sm text-muted-foreground">No tests</div>
        ) : (
          <div className="space-y-4">
            {tests.map((t) => {
              const status = getLockStatus(t);
              const startVal = t.access_start_at ? new Date(t.access_start_at) : null;
              const endVal = t.access_end_at ? new Date(t.access_end_at) : null;
              return (
                <div key={t.id} className="border rounded p-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{t.title || t.id}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.open ? 'secondary' : 'destructive'}>{status.open ? 'Open' : status.reason || 'Locked'}</Badge>
                      {endVal && status.open && (
                        <Badge variant="outline" className="text-xs">Closes {formatDateTime(endVal)}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1">
                      <Label>Start</Label>
                      <Input
                        type="datetime-local"
                        value={startVal ? new Date(startVal.getTime() - startVal.getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''}
                        onChange={(e) => setField(t.id, 'access_start_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>End</Label>
                      <Input
                        type="datetime-local"
                        value={endVal ? new Date(endVal.getTime() - endVal.getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''}
                        onChange={(e) => setField(t.id, 'access_end_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Lock Now</Label>
                      <div className="flex items-center h-10 px-2 border rounded">
                        <Switch checked={!!t.is_locked} onCheckedChange={(v) => setField(t.id, 'is_locked', v)} />
                        <span className="ml-2 text-sm">{t.is_locked ? 'Locked' : 'Unlocked'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>&nbsp;</Label>
                      <Button onClick={() => updateLock(t)} disabled={savingId === t.id}>Save</Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
