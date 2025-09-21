import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const useISTClock = () => {
  const [time, setTime] = useState(() => 
    dayjs().tz('Asia/Kolkata').toDate()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(dayjs().tz('Asia/Kolkata').toDate());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return time;
};

export const useSessionTimer = () => {
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    // Get or set session start time
    let sessionStart = sessionStorage.getItem('sessionStart');
    if (!sessionStart) {
      sessionStart = Date.now().toString();
      sessionStorage.setItem('sessionStart', sessionStart);
    }

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - parseInt(sessionStart!)) / 1000);
      setSessionTime(elapsed);
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return formatTime(sessionTime);
};