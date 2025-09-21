import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Calendar, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Notice {
  id: string;
  title: string;
  message: string;
  test_type: 'JEE' | 'NEET' | null;
  test_date: string | null;
  created_at: string;
}

export default function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('tests')
        .select('id,title,test_type,created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error) {
        const mapped: Notice[] = (data || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          message: 'New test published',
          test_type: t.test_type,
          test_date: t.created_at,
          created_at: t.created_at,
        }));
        setNotices(mapped);
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel('tests-notices')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tests' }, (payload) => {
        const t: any = payload.new;
        setNotices(prev => [{
          id: t.id,
          title: t.title,
          message: 'New test published',
          test_type: t.test_type,
          test_date: t.created_at,
          created_at: t.created_at,
        }, ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tests' }, (payload) => {
        const t: any = payload.old;
        setNotices(prev => prev.filter(n => n.id !== t.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Notice Board
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Notice Board
        </CardTitle>
        <CardDescription>Latest announcements and test schedules</CardDescription>
      </CardHeader>
      <CardContent>
        {notices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No notices at the moment</p>
            <p className="text-sm">Check back later for updates!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div key={notice.id} className="border-l-4 border-primary bg-secondary/50 p-4 rounded-r-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">{notice.title}</h4>
                  <div className="flex gap-2">
                    {notice.test_type && (
                      <Badge variant="secondary" className="text-xs">
                        {notice.test_type}
                      </Badge>
                    )}
                    {notice.test_date && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(notice.test_date).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{notice.message}</p>
                <div className="text-xs text-muted-foreground">
                  {new Date(notice.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
