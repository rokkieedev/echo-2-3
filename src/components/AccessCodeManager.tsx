import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, Copy, Download, Trash2 } from 'lucide-react';

interface AccessCodeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Test {
  id: string;
  title: string;
  test_type: string;
}

interface AccessCode {
  id: string;
  code: string;
  test_id: string;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
  test: {
    title: string;
  };
}

export default function AccessCodeManager({ isOpen, onClose }: AccessCodeManagerProps) {
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [codeCount, setCodeCount] = useState(1);
  const [expiryDays, setExpiryDays] = useState(30);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchTests();
      fetchCodes();
    }
  }, [isOpen]);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('id, title, test_type')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch tests",
        variant: "destructive",
      });
    }
  };

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('access_codes')
        .select(`
          id,
          code,
          test_id,
          expires_at,
          used_at,
          created_at,
          tests!inner (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map the response to match our interface
      const mappedCodes = (data || []).map(code => ({
        ...code,
        test: code.tests
      }));
      setCodes(mappedCodes);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch access codes",
        variant: "destructive",
      });
    }
  };

  const generateCodes = async () => {
    if (!selectedTestId) {
      toast({
        title: "No Test Selected",
        description: "Please select a test to generate codes for.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const codes = [];
      for (let i = 0; i < codeCount; i++) {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        codes.push({
          code,
          test_id: selectedTestId,
          expires_at: expiryDays > 0 ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : null,
          is_active: true,
          created_by_admin: true
        });
      }

      const { error } = await supabase
        .from('access_codes')
        .insert(codes);

      if (error) throw error;

      toast({
        title: "Codes Generated",
        description: `${codeCount} access codes generated successfully.`,
      });

      fetchCodes();
      setSelectedTestId('');
      setCodeCount(1);
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Access code copied to clipboard",
    });
  };

  const deleteCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('access_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Code Deleted",
        description: "Access code deleted successfully.",
      });

      fetchCodes();
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportCodes = () => {
    const csvContent = [
      ['Code', 'Test', 'Status', 'Created', 'Expires', 'Used'],
      ...codes.map(code => [
        code.code,
        code.test?.title || 'Unknown',
        code.used_at ? 'Used' : 'Active',
        new Date(code.created_at).toLocaleDateString(),
        code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never',
        code.used_at ? new Date(code.used_at).toLocaleDateString() : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'access_codes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Access Code Manager
          </DialogTitle>
          <DialogDescription>
            Generate and manage one-time access codes for tests
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Code Generation */}
          <Card>
            <CardHeader>
              <CardTitle>Generate New Codes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Test</Label>
                  <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a test" />
                    </SelectTrigger>
                    <SelectContent>
                      {tests.map(test => (
                        <SelectItem key={test.id} value={test.id}>
                          {test.title} ({test.test_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Number of Codes</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={codeCount}
                    onChange={(e) => setCodeCount(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Expiry (Days)</Label>
                <Input
                  type="number"
                  min="0"
                  max="365"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value) || 30)}
                  placeholder="0 = Never expires"
                />
              </div>

              <Button onClick={generateCodes} disabled={loading} className="w-full">
                {loading ? "Generating..." : "Generate Codes"}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Codes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Existing Access Codes</CardTitle>
                <CardDescription>{codes.length} codes total</CardDescription>
              </div>
              <Button variant="outline" onClick={exportCodes}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {codes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No access codes generated yet
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {codes.map(code => (
                    <div key={code.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {code.code}
                        </code>
                        <div className="text-sm">
                          <div className="font-medium">{code.test?.title || 'Unknown Test'}</div>
                          <div className="text-muted-foreground">
                            Created: {new Date(code.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={code.used_at ? "secondary" : "default"}>
                          {code.used_at ? "Used" : "Active"}
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => copyCode(code.code)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteCode(code.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
