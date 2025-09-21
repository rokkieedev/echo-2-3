import { useState } from 'react';
import { Search, Menu, X, Book, FileText, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useISTClock, useSessionTimer } from '@/hooks/useISTClock';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onSearch: (query: string) => void;
}

export const Header = ({ onSearch }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const istTime = useISTClock();
  const sessionTime = useSessionTimer();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const navigation = [
    { name: 'Dashboard', path: '/', icon: null },
    { name: 'Books', path: '/books', icon: Book },
    { name: 'Assignments', path: '/assignments', icon: FileText },
    { name: 'Tests', path: '/tests', icon: PenTool },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b shadow-card bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center">
        {/* Left Side - Brand & Clock */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/78b5e606-3ea4-4586-b0f6-8b8d624eba9b.png" 
              alt="IIT Genius Logo" 
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="hidden font-bold sm:inline-block text-lg">IIT JEE ECHO</span>
          </Link>
          
          {/* IST Clock & Session Timer */}
          <div className="hidden md:flex flex-col text-xs text-muted-foreground">
            <div className="ist-clock font-semibold">{istTime.toLocaleTimeString('en-IN')}</div>
            <div className="opacity-75">Time: {sessionTime}</div>
          </div>
        </div>

        {/* Center - Navigation (Desktop) */}
        <nav className="hidden md:flex items-center space-x-1 mx-6">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button 
                  variant={isActive ? "secondary" : "ghost"} 
                  size="sm"
                  className="transition-fast hover:shadow-glow"
                >
                  {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right Side - Search & Controls */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search books, tests..."
                className="pl-8 md:w-[300px] transition-fast focus:shadow-glow"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <ThemeToggle />

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-card/95 backdrop-blur">
          <div className="container py-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search books, tests..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            {/* Mobile Navigation */}
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive ? "secondary" : "ghost"} 
                      className="w-full justify-start"
                    >
                      {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Clock */}
            <div className="pt-2 border-t text-sm text-muted-foreground">
              <div className="ist-clock font-semibold">{istTime.toLocaleTimeString('en-IN')}</div>
              <div className="opacity-75">Session: {sessionTime}</div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};