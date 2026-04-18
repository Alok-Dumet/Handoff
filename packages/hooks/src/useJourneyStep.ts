import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'handoff-journey-step';
const MAX_STEP = 3;

export function useJourneyStep() {
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, String(currentStep));
    }
  }, [currentStep]);

  const goToNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, MAX_STEP));
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step <= MAX_STEP) {
      setCurrentStep(step);
    }
  }, []);

  return { currentStep, goToNext, goToPrev, goToStep };
}
