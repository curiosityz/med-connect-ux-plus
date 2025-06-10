"use client";

import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

export function AnimatedCounter({ end, duration = 2000, suffix = "", prefix = "" }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max((endTime - now) / duration, 0);
      const progress = Math.min(1 - remaining, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(end * easeOutCubic));

      if (progress === 1) {
        clearInterval(timer);
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [end, duration]);

  return (
    <span>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}
