import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useCustomAdminAuth } from '@/hooks/useCustomAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import TestCreationDialog from '@/components/TestCreationDialog';
import AccessCodeManager from '@/components/AccessCodeManager';
import BooksDialog from '@/components/BooksDialog';
import AssignmentsDialog from '@/components/AssignmentsDialog';
import { 
  Settings, 
  LogOut, 
  FileText, 
  BookOpen, 
  TestTube, 
  Users, 
  BarChart3,
  Key,
  Plus,
  Download,
  Trash2
} from 'lucide-react';

interface AdminStats {
  totalTests: number;
  totalBooks: number;
  totalAssignments: number;
  totalAttempts: number;
  activeCodes: number;
}

function ViolationsPanel() {
  const [items, setItems] = useState<Array<{ id: string; anon_user_id: string; test_id: string; submitted_at: string | null; title?: string }>>([]);
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('test_attempts')
        .select('id,anon_user_id,test_id,submitted_at,session_data')
        .contains('session_data', { violation: 'tab_switch_auto_submit' })
        .order('submitted_at', { ascending: false })
        .limit(50);
      const ids = (data || []).map(d => d.test_id);
      const { data: tests } = ids.length ? await supabase.from('tests').select('id,title').in('id', ids) : { data: [] as any[] };
      const titleMap = new Map((tests || []).map(t => [t.id, t.title] as const));
      setItems((data || []).map(d => ({ id: d.id, anon_user_id: d.anon_user_id, test_id: d.test_id, submitted_at: d.submitted_at, title: titleMap.get(d.test_id) })));
    };
    load();
  }, []);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Auto-submitted due to tab switching</CardTitle>
        <CardDescription>Recent attempts locked after repeated tab switching</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No violations logged.</div>
        ) : (
          <div className="space-y-2">
            {items.map(i => (
              <div key={i.id} className="flex items-center justify-between border rounded p-2 text-sm">
                <div>
                  <div className="font-medium">{i.title || i.test_id}</div>
                  <div className="text-xs text-muted-foreground">Attempt: {i.id} • Student: {i.anon_user_id}</div>
                </div>
                <div className="text-xs text-muted-foreground">{i.submitted_at ? new Date(i.submitted_at).toLocaleString() : '—'}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { isAuthenticated, loading, signOut } = useCustomAdminAuth();
  const [showTestCreation, setShowTestCreation] = useState(false);
  const [showAccessCodeManager, setShowAccessCodeManager] = useState(false);
  const [showBooksDialog, setShowBooksDialog] = useState(false);
  const [showAssignmentsDialog, setShowAssignmentsDialog] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalTests: 0,
    totalBooks: 0,
    totalAssignments: 0,
    totalAttempts: 0,
    activeCodes: 0,
  });
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [recentBooks, setRecentBooks] = useState<any[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);

  // Redirect if not authenticated as admin
  if (!loading && !isAuthenticated) {
    return <Navigate to="/admin/auth" replace />;
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [tests, books, assignments, attempts, codes, testsList, booksList, assignmentsList] = await Promise.all([
          supabase.from('tests').select('id', { count: 'exact' }),
          supabase.from('books').select('id', { count: 'exact' }),
          supabase.from('assignments').select('id', { count: 'exact' }),
          supabase.from('test_attempts').select('id', { count: 'exact' }),
          supabase.from('access_codes').select('id', { count: 'exact' }).eq('is_active', true),
          supabase.from('tests').select('id,title,created_at').order('created_at', { ascending: false }).limit(10),
          supabase.from('books').select('id,title,created_at').order('created_at', { ascending: false }).limit(10),
          supabase.from('assignments').select('id,title,created_at').order('created_at', { ascending: false }).limit(10),
        ]);

        setStats({
          totalTests: tests.count || 0,
          totalBooks: books.count || 0,
          totalAssignments: assignments.count || 0,
          totalAttempts: attempts.count || 0,
          activeCodes: codes.count || 0,
        });
        setRecentTests(testsList.data || []);
        setRecentBooks(booksList.data || []);
        setRecentAssignments(assignmentsList.data || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">IIT JEE ECHO Management Panel</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-3 py-1">
              <Settings className="h-3 w-3 mr-1" />
              Admin
            </Badge>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Tests', value: stats.totalTests, icon: TestTube, color: 'text-blue-600' },
            { label: 'Books', value: stats.totalBooks, icon: BookOpen, color: 'text-green-600' },
            { label: 'Assignments', value: stats.totalAssignments, icon: FileText, color: 'text-purple-600' },
            { label: 'Attempts', value: stats.totalAttempts, icon: Users, color: 'text-orange-600' },
            { label: 'Active Codes', value: stats.activeCodes, icon: Key, color: 'text-red-600' },
          ].map((stat, index) => (
            <Card key={index} className="shadow-card">
              <CardContent className="p-4 text-center">
                <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="codes">Access Codes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Test Management</CardTitle>
                  <CardDescription>Create and manage comprehensive test series</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowAccessCodeManager(true)} variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Manage Access Codes
                  </Button>
                  <Button size="sm" onClick={() => setShowTestCreation(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Test
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Test Creation Center</h3>
                  <p className="mb-4">Create comprehensive JEE/NEET tests with questions, marking schemes, and access codes.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                    <Button onClick={() => setShowTestCreation(true)} variant="outline">
                      Create Test & Questions
                    </Button>
                    <Button onClick={() => setShowAccessCodeManager(true)} variant="outline">
                      Generate Access Codes
                    </Button>
                  </div>
                </div>
                <div className="mt-6 text-left">
                  <h4 className="font-semibold mb-2">Recent Tests</h4>
                  <div className="space-y-2">
                    {recentTests.length === 0 && (
                      <div className="text-sm text-muted-foreground">No tests yet</div>
                    )}
                    {recentTests.map(t => (
                      <div key={t.id} className="flex items-center justify-between border rounded p-2">
                        <div className="text-sm">
                          <div className="font-medium">{t.title}</div>
                          <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteTest(t.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Books
                    </CardTitle>
                    <CardDescription>Manage educational books</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setShowBooksDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Book
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    {stats.totalBooks} books uploaded
                  </div>
                  <div className="mt-4 space-y-2">
                    {recentBooks.length === 0 && <div className="text-sm text-muted-foreground">No books</div>}
                    {recentBooks.map(b => (
                      <div key={b.id} className="flex items-center justify-between border rounded p-2">
                        <div className="text-sm">
                          <div className="font-medium">{b.title}</div>
                          <div className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteBook(b.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Assignments
                    </CardTitle>
                    <CardDescription>Manage assignments</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setShowAssignmentsDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Assignment
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    {stats.totalAssignments} assignments available
                  </div>
                  <div className="mt-4 space-y-2">
                    {recentAssignments.length === 0 && <div className="text-sm text-muted-foreground">No assignments</div>}
                    {recentAssignments.map(a => (
                      <div key={a.id} className="flex items-center justify-between border rounded p-2">
                        <div className="text-sm">
                          <div className="font-medium">{a.title}</div>
                          <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteAssignment(a.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="codes" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Access Codes
                  </CardTitle>
                  <CardDescription>Generate and manage test access codes</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm" onClick={() => setShowAccessCodeManager(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Codes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Access code management functionality will be implemented here.
                  <br />
                  Features: Generate codes, set expiry, track usage, export lists.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <ViolationsPanel />
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics Dashboard
                </CardTitle>
                <CardDescription>Test performance and usage statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Analytics dashboard will show:
                  <br />
                  • Test attempt statistics
                  <br />
                  • Performance insights
                  <br />
                  • User engagement metrics
                  <br />
                  • Download reports
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <TestCreationDialog
          isOpen={showTestCreation}
          onClose={() => setShowTestCreation(false)}
          onSuccess={() => {
            fetchStats();
          }}
        />
        
        <AccessCodeManager
          isOpen={showAccessCodeManager}
          onClose={() => setShowAccessCodeManager(false)}
        />
        
        <BooksDialog
          isOpen={showBooksDialog}
          onClose={() => setShowBooksDialog(false)}
          onSuccess={fetchStats}
        />
        
        <AssignmentsDialog
          isOpen={showAssignmentsDialog}
          onClose={() => setShowAssignmentsDialog(false)}
          onSuccess={fetchStats}
        />
      </div>
    </div>
  );

  async function fetchStats() {
    try {
      const [tests, books, assignments, attempts, codes] = await Promise.all([
        supabase.from('tests').select('id', { count: 'exact' }),
        supabase.from('books').select('id', { count: 'exact' }),
        supabase.from('assignments').select('id', { count: 'exact' }),
        supabase.from('test_attempts').select('id', { count: 'exact' }),
        supabase.from('access_codes').select('id', { count: 'exact' }).eq('is_active', true),
      ]);

      setStats({
        totalTests: tests.count || 0,
        totalBooks: books.count || 0,
        totalAssignments: assignments.count || 0,
        totalAttempts: attempts.count || 0,
        activeCodes: codes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function handleDeleteTest(id: string) {
    if (!confirm('Delete this test and all related data?')) return;
    const attemptsIds = (await supabase.from('test_attempts').select('id').eq('test_id', id)).data?.map(r => r.id) || [];
    if (attemptsIds.length > 0) {
      await supabase.from('test_responses').delete().in('attempt_id', attemptsIds);
    }
    await supabase.from('test_attempts').delete().eq('test_id', id);
    await supabase.from('test_questions').delete().eq('test_id', id);
    await supabase.from('access_codes').delete().eq('test_id', id);
    await supabase.from('tests').delete().eq('id', id);
    // Refresh lists
    const { data: newTests } = await supabase.from('tests').select('id,title,created_at').order('created_at', { ascending: false }).limit(10);
    setRecentTests(newTests || []);
    await fetchStats();
  }

  async function handleDeleteBook(id: string) {
    if (!confirm('Delete this book?')) return;
    await supabase.from('books').delete().eq('id', id);
    const { data: newBooks } = await supabase.from('books').select('id,title,created_at').order('created_at', { ascending: false }).limit(10);
    setRecentBooks(newBooks || []);
    await fetchStats();
  }

  async function handleDeleteAssignment(id: string) {
    if (!confirm('Delete this assignment?')) return;
    await supabase.from('assignments').delete().eq('id', id);
    const { data: newAssignments } = await supabase.from('assignments').select('id,title,created_at').order('created_at', { ascending: false }).limit(10);
    setRecentAssignments(newAssignments || []);
    await fetchStats();
  }
}
