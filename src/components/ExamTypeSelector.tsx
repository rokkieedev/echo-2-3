import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, PenTool } from 'lucide-react';

interface ExamTypeSelectorProps {
  type: 'books' | 'assignments' | 'tests';
  onTypeSelect: (examType: 'JEE' | 'NEET') => void;
  selectedType: 'JEE' | 'NEET';
}

export default function ExamTypeSelector({ type, onTypeSelect, selectedType }: ExamTypeSelectorProps) {
  const getIcon = () => {
    switch (type) {
      case 'books': return BookOpen;
      case 'assignments': return FileText;
      case 'tests': return PenTool;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'books': return 'Books';
      case 'assignments': return 'Assignments';
      case 'tests': return 'Tests';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'books': return 'Select exam type to view relevant study materials';
      case 'assignments': return 'Choose your exam focus to see targeted practice';
      case 'tests': return 'Pick your exam type for mock tests and assessments';
    }
  };

  const Icon = getIcon();

  return (
    <Card className="shadow-card mb-6">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl">{getTitle()}</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center gap-4">
          <Button
            variant={selectedType === 'JEE' ? 'default' : 'outline'}
            onClick={() => onTypeSelect('JEE')}
            className="px-8 py-2 transition-smooth hover:shadow-glow"
          >
            <Badge variant="outline" className="mr-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Engineering
            </Badge>
            JEE
          </Button>
          <Button
            variant={selectedType === 'NEET' ? 'default' : 'outline'}
            onClick={() => onTypeSelect('NEET')}
            className="px-8 py-2 transition-smooth hover:shadow-glow"
          >
            <Badge variant="outline" className="mr-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Medical
            </Badge>
            NEET
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}