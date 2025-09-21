import { useState, useEffect } from 'react';
import { useISTClock, useSessionTimer } from '@/hooks/useISTClock';
import { Progress } from '@/components/ui/progress';

interface SecurityGateProps {
  onComplete: () => void;
}

export const SecurityGate = ({ onComplete }: SecurityGateProps) => {
  const [progress, setProgress] = useState(0);
  const istTime = useISTClock();
  const sessionTime = useSessionTimer();

  useEffect(() => {
    // Check if user has already seen the gate this session
    if (sessionStorage.getItem('seenSecurityGate') === 'true') {
      onComplete();
      return;
    }

    const startTime = Date.now();
    const duration = 5000; // 5 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
        sessionStorage.setItem('seenSecurityGate', 'true');
        onComplete();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-hero relative overflow-hidden" data-testid="security-gate">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Clock and Session Timer */}
      <div className="absolute top-6 left-6 text-white/90 z-10">
        <div className="ist-clock text-lg font-semibold mb-1" data-testid="ist-clock">
          {istTime.toLocaleTimeString('en-IN')}
        </div>
        <div className="text-sm opacity-75" data-testid="session-timer">
          Time on site: {sessionTime}
        </div>
      </div>

      {/* Main Content */}
      <div className="text-center text-white z-10 max-w-2xl px-6">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
            IIT JEE ECHO
          </h1>
          <p className="text-xl md:text-2xl opacity-90 font-light">
            Excellence in Engineering Education
          </p>
        </div>

        <div className="mb-8">
          <p className="text-lg opacity-75 mb-6">
            Initializing secure connection...
          </p>
          <div className="w-full max-w-md mx-auto">
            <Progress 
              value={progress} 
              className="h-2 bg-white/20"
            />
          </div>
        </div>

        <div className="text-sm opacity-60">
          Verifying educational resources and test environments
        </div>
      </div>

      {/* Bottom Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
};