import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  FileText, 
  ClipboardList, 
  TrendingUp, 
  Users, 
  Calendar,
  Award
} from 'lucide-react';
import { useISTClock } from '@/hooks/useISTClock';
import { supabase } from '@/integrations/supabase/client';
import NoticeBoard from './NoticeBoard';

export default function Dashboard() {
  const currentTime = useISTClock();
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalAssignments: 0,
    totalTests: 0,
    totalUsers: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [booksRes, assignmentsRes, testsRes] = await Promise.all([
        supabase.from('books').select('id', { count: 'exact' }),
        supabase.from('assignments').select('id', { count: 'exact' }),
        supabase.from('tests').select('id', { count: 'exact' })
      ]);

      setStats({
        totalBooks: booksRes.count || 0,
        totalAssignments: assignmentsRes.count || 0,
        totalTests: testsRes.count || 0,
        totalUsers: 0 // No user tracking needed
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-hero bg-clip-text text-transparent">
                IIT JEE ECHO
              </h1>
              <p className="text-muted-foreground text-sm">Excellence through Practice</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {currentTime.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <span>•</span>
            <div>{currentTime.toLocaleTimeString('en-IN')}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-accent/20 hover:border-primary/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalBooks}</p>
                      <p className="text-sm text-muted-foreground">Books Available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/20 hover:border-primary/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalAssignments}</p>
                      <p className="text-sm text-muted-foreground">Assignments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/20 hover:border-primary/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <ClipboardList className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalTests}</p>
                      <p className="text-sm text-muted-foreground">Practice Tests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/20 hover:border-primary/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                      <p className="text-sm text-muted-foreground">Active Students</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Access your study materials and tests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                    <a href="/books">
                      <BookOpen className="h-6 w-6" />
                      <span>Browse Books</span>
                      <Badge variant="secondary" className="text-xs">{stats.totalBooks} Available</Badge>
                    </a>
                  </Button>
                  
                  <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                    <a href="/assignments">
                      <FileText className="h-6 w-6" />
                      <span>View Assignments</span>
                      <Badge variant="secondary" className="text-xs">{stats.totalAssignments} Active</Badge>
                    </a>
                  </Button>
                  
                  <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                    <a href="/tests">
                      <ClipboardList className="h-6 w-6" />
                      <span>Take Tests</span>
                      <Badge variant="secondary" className="text-xs">{stats.totalTests} Available</Badge>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

          {/* Notice Board */}
          <NoticeBoard />
        </div>
      </div>
    </div>
  );
};