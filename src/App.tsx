import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { SecurityGate } from "@/components/SecurityGate";
import { Header } from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import Books from "./pages/Books";
import Assignments from "./pages/Assignments";
import Tests from "./pages/Tests";
import TestInfo from "./pages/TestInfo";
import TestStart from "./pages/TestStart";
import TestAnalysis from "./pages/TestAnalysis";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSecurityGate, setShowSecurityGate] = useState(
    sessionStorage.getItem('seenSecurityGate') !== 'true'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const handleSecurityGateComplete = () => {
    setShowSecurityGate(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (showSecurityGate) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="jee-echo-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <SecurityGate onComplete={handleSecurityGateComplete} />
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="jee-echo-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Header onSearch={handleSearch} />
              <main>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/books" element={<Books />} />
                  <Route path="/assignments" element={<Assignments />} />
                  <Route path="/tests" element={<Tests />} />
                  <Route path="/tests/:testId" element={<TestInfo />} />
                  <Route path="/tests/:testId/start" element={<TestStart />} />
                  <Route path="/tests/:testId/analysis/:attemptId" element={<TestAnalysis />} />
                  <Route path="/admin/auth" element={<AdminAuth />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
