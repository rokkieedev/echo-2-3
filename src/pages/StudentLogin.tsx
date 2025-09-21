import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const DUMMY_STUDENT = {
  id: 'STU20250001',
  name: 'Test Student',
  password: '48271935',
  institute: 'Demo Institute',
};

export default function StudentLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // If already logged in, skip
    const existing = localStorage.getItem('studentId');
    if (existing) navigate('/dashboard');
  }, [navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const id = (form.elements.namedItem('studentId') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value.trim();

    if (id === DUMMY_STUDENT.id && password === DUMMY_STUDENT.password) {
      localStorage.setItem('studentId', DUMMY_STUDENT.id);
      localStorage.setItem('studentName', DUMMY_STUDENT.name);
      localStorage.setItem('studentInstitute', DUMMY_STUDENT.institute);
      toast({ title: 'Logged in', description: `Welcome, ${DUMMY_STUDENT.name}` });
      navigate('/dashboard');
      return;
    }

    toast({ title: 'Invalid credentials', description: 'Please check Student ID or Password', variant: 'destructive' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Student Login</CardTitle>
          <CardDescription>Use your Student ID and 8-digit password</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 rounded border text-sm">
            <div className="font-medium mb-1">Dummy for testing</div>
            <div>ID: <span className="font-mono">{DUMMY_STUDENT.id}</span></div>
            <div>Password: <span className="font-mono">{DUMMY_STUDENT.password}</span></div>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input id="studentId" name="studentId" placeholder="e.g. STU20250001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" inputMode="numeric" pattern="\\d{8}" placeholder="8-digit password" required />
            </div>
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
