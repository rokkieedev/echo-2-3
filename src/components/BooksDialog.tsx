import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, BookOpen } from 'lucide-react';

interface BooksDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BooksDialog({ isOpen, onClose, onSuccess }: BooksDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [bookData, setBookData] = useState({
    title: '',
    subject: '',
    author: '',
    description: '',
    telegram_link: ''
  });

  const resetForm = () => {
    setBookData({
      title: '',
      subject: '',
      author: '',
      description: '',
      telegram_link: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookData.title || !bookData.subject) {
      toast({
        title: "Incomplete Information",
        description: "Please provide at least title and subject.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('books')
        .insert({
          title: bookData.title,
          subject: bookData.subject,
          author: bookData.author,
          description: bookData.description,
          file_url: bookData.telegram_link
        });

      if (error) throw error;

      toast({
        title: "Book Added",
        description: `"${bookData.title}" has been added successfully.`,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Failed to Add Book",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Add New Book
          </DialogTitle>
          <DialogDescription>
            Add educational books to the library
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter book title"
              value={bookData.title}
              onChange={(e) => setBookData({ ...bookData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select value={bookData.subject} onValueChange={(value) => setBookData({ ...bookData, subject: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Biology">Biology</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              placeholder="Enter author name"
              value={bookData.author}
              onChange={(e) => setBookData({ ...bookData, author: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the book"
              value={bookData.description}
              onChange={(e) => setBookData({ ...bookData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram_link">Telegram Link</Label>
            <Input
              id="telegram_link"
              placeholder="https://t.me/..."
              value={bookData.telegram_link}
              onChange={(e) => setBookData({ ...bookData, telegram_link: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </div>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Book
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}