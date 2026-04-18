'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface CheckinFormData {
  fullName: string;
  dateOfBirth: string;
  documentNumber: string;
  emailConfirmation: string;
}

interface JourneyState {
  currentStep: number;
  selectedVehicleId: string | null;
  biometricConsented: boolean | null;
  formData: CheckinFormData;
}

interface JourneyContextValue extends JourneyState {
  setCurrentStep: (step: number) => void;
  setSelectedVehicleId: (id: string | null) => void;
  setBiometricConsented: (consented: boolean) => void;
  setCheckinFormData: (data: CheckinFormData) => void;
  sessionToken: string | null;
  setSessionToken: (token: string) => void;
}

const STORAGE_KEY = 'handoff-journey-state';

const defaultCheckinFormData: CheckinFormData = {
  fullName: '',
  dateOfBirth: '',
  documentNumber: '',
  emailConfirmation: '',
};

const defaultState: JourneyState = {
  currentStep: 0,
  selectedVehicleId: null,
  biometricConsented: null,
  formData: defaultCheckinFormData,
};

function loadState(): JourneyState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultState;
    }

    const parsed = JSON.parse(stored) as Partial<JourneyState>;
    return {
      ...defaultState,
      ...parsed,
      formData: {
        ...defaultCheckinFormData,
        ...parsed.formData,
      },
    };
  } catch {
    return defaultState;
  }
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<JourneyState>(defaultState);
  const [sessionToken, setSessionTokenState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, hydrated]);

  const setCurrentStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const setSelectedVehicleId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedVehicleId: id }));
  }, []);

  const setBiometricConsented = useCallback((consented: boolean) => {
    setState((prev) => ({ ...prev, biometricConsented: consented }));
  }, []);

  const setCheckinFormData = useCallback((data: CheckinFormData) => {
    setState((prev) => ({ ...prev, formData: data }));
  }, []);

  const setSessionToken = useCallback((token: string) => {
    setSessionTokenState(token);
  }, []);

  return (
    <JourneyContext.Provider
      value={{
        ...state,
        setCurrentStep,
        setSelectedVehicleId,
        setBiometricConsented,
        setCheckinFormData,
        sessionToken,
        setSessionToken,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  return context;
}
