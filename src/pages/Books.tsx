import { useState, useEffect } from 'react';
import { BookOpen, Download, Star, Calendar, FileText, Filter, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ExamTypeSelector from '@/components/ExamTypeSelector';
import { supabase } from '@/integrations/supabase/client';

export default function Books() {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [examType, setExamType] = useState<'JEE' | 'NEET'>('JEE');
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, [examType]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentBooks = books;
  const allowedSubjects = examType === 'JEE'
    ? new Set(['Physics', 'Chemistry', 'Mathematics', 'General'])
    : new Set(['Physics', 'Chemistry', 'Biology', 'General']);

  const filteredBooks = currentBooks.filter(book => {
    const matchesExam = allowedSubjects.has(book.subject);
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = subjectFilter === 'all' || book.subject === subjectFilter;
    return matchesExam && matchesSearch && matchesSubject;
  });

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'Physics': return 'text-blue-600';
      case 'Chemistry': return 'text-green-600';
      case 'Mathematics': return 'text-purple-600';
      case 'Biology': return 'text-emerald-600';
      default: return 'text-gray-600';
    }
  };

  const subjects = examType === 'JEE' 
    ? ['all', 'Physics', 'Chemistry', 'Mathematics']
    : ['all', 'Physics', 'Chemistry', 'Biology'];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 gradient-hero bg-clip-text text-transparent">
          Study Books
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Comprehensive collection of books and study materials for JEE and NEET preparation
        </p>
      </div>

      {/* Exam Type Selector */}
      <ExamTypeSelector 
        type="books" 
        onTypeSelect={setExamType} 
        selectedType={examType} 
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Input
            placeholder="Search books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="transition-fast focus:shadow-glow"
          />
        </div>
        
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map(subject => (
              <SelectItem key={subject} value={subject}>
                {subject === 'all' ? 'All Subjects' : subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

         {/* Stats Overview */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <Card className="shadow-card text-center">
             <CardContent className="p-4">
               <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
               <div className="text-2xl font-bold">{books.length}</div>
               <div className="text-sm text-muted-foreground">Total Books</div>
             </CardContent>
           </Card>
           <Card className="shadow-card text-center">
             <CardContent className="p-4">
               <Star className="h-6 w-6 mx-auto mb-2 text-accent" />
               <div className="text-2xl font-bold">{books.length > 0 ? '4.5' : '0'}</div>
               <div className="text-sm text-muted-foreground">Avg Rating</div>
             </CardContent>
           </Card>
           <Card className="shadow-card text-center">
             <CardContent className="p-4">
               <Download className="h-6 w-6 mx-auto mb-2 text-success" />
               <div className="text-2xl font-bold">{books.length * 10}</div>
               <div className="text-sm text-muted-foreground">Downloads</div>
             </CardContent>
           </Card>
           <Card className="shadow-card text-center">
             <CardContent className="p-4">
               <User className="h-6 w-6 mx-auto mb-2 text-warning" />
               <div className="text-2xl font-bold">{new Set(books.map(b => b.author)).size}</div>
               <div className="text-sm text-muted-foreground">Authors</div>
             </CardContent>
           </Card>
         </div>

       {/* Books Grid */}
       {loading ? (
         <div className="text-center py-12">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
           <p className="text-muted-foreground">Loading books...</p>
         </div>
       ) : filteredBooks.length > 0 ? (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {filteredBooks.map((book) => (
             <Card key={book.id} className="border-accent/20 hover:border-primary/20 transition-colors shadow-card">
               <CardHeader>
                 <div className="flex items-start justify-between">
                   <div className="flex-1">
                     <CardTitle className="text-lg leading-tight">{book.title}</CardTitle>
                     {book.author && (
                       <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                         <User className="h-3 w-3" />
                         {book.author}
                       </p>
                     )}
                   </div>
                   <Badge variant="secondary" className={getSubjectColor(book.subject)}>
                     {book.subject}
                   </Badge>
                 </div>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   {book.description && (
                     <p className="text-sm text-muted-foreground line-clamp-2">
                       {book.description}
                     </p>
                   )}
                   
                   <div className="flex items-center justify-between text-sm">
                     <div className="flex items-center gap-1">
                       <Star className="h-4 w-4 text-accent fill-current" />
                       <span>{book.rating || '4.5'}</span>
                     </div>
                     <Badge variant="outline">PDF</Badge>
                   </div>
                   
                   <Button 
                     onClick={() => window.open(book.file_url, '_blank')} 
                     className="w-full"
                   >
                     <Download className="h-4 w-4 mr-2" />
                     Download
                   </Button>
                 </div>
               </CardContent>
             </Card>
           ))}
         </div>
       ) : (
         <div className="text-center py-12 text-muted-foreground">
           <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
           <h3 className="text-lg font-semibold mb-2">No books available</h3>
           <p>Books will appear here once an admin uploads them.</p>
         </div>
       )}
    </div>
  );
}
