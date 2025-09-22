import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, Lock } from 'lucide-react';

import { getLockStatus } from '@/utils/testLock';

interface AccessCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (testData: any) => void;
  testId: string | null;
}

export default function AccessCodeDialog({ isOpen, onClose, onSuccess, testId }: AccessCodeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessCode.trim()) {
      toast({
        title: "Access Code Required",
        description: "Please enter an access code.",
        variant: "destructive",
      });
      return;
    }

    if (!testId) {
      toast({
        title: "Select a Test",
        description: "Please choose a test to unlock.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check lock window before consuming code
      const { data: testRow, error: testErr } = await supabase.from('tests').select('*').eq('id', testId).single();
      if (testErr) throw testErr;
      const status = getLockStatus(testRow || {});
      if (!status.open) {
        toast({ title: 'Test Locked', description: status.reason || 'Not accessible now', variant: 'destructive' });
        return;
      }

      // Generate anonymous user ID for this session
      const anonUserId = crypto.randomUUID();

      // Use the access code
      const { data, error } = await supabase.rpc('use_access_code', {
        input_code: accessCode.trim().toUpperCase(),
        anon_user_id: anonUserId
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; test_id?: string; test_title?: string; message?: string };

      if (result?.success) {
        // Double-check code is for the selected test
        if (result.test_id && result.test_id !== testId) {
          toast({ title: 'Wrong Test', description: 'Code does not match selected test', variant: 'destructive' });
          return;
        }
        toast({
          title: "Access Granted",
          description: `Welcome to ${result.test_title}`,
        });

        onSuccess({
          testId: result.test_id || testId,
          testTitle: result.test_title,
          anonUserId
        });
        onClose();
        setAccessCode('');
      } else {
        toast({
          title: "Access Denied",
          description: result?.message || "Invalid or expired access code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Access Failed",
        description: error.message || "Failed to verify access code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Enter Access Code
          </DialogTitle>
          <DialogDescription>
            Enter your unique access code to unlock the test
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access-code">Access Code</Label>
                <Input
                  id="access-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg tracking-wider"
                  maxLength={6}
                  required
                />
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>This code can only be used once</span>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Verifying..." : "Unlock Test"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
