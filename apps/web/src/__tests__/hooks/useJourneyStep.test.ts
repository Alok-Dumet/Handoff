import { renderHook, act } from '@testing-library/react';
import { useJourneyStep } from '@handoff/hooks';

const mockSessionStorage: Record<string, string> = {};

beforeEach(() => {
  Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: (key: string) => mockSessionStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockSessionStorage[key] = value; },
      removeItem: (key: string) => { delete mockSessionStorage[key]; },
    },
    writable: true,
  });
});

describe('useJourneyStep', () => {
  it('starts at step 0', () => {
    const { result } = renderHook(() => useJourneyStep());
    expect(result.current.currentStep).toBe(0);
  });

  it('goToNext increments the step', () => {
    const { result } = renderHook(() => useJourneyStep());
    act(() => result.current.goToNext());
    expect(result.current.currentStep).toBe(1);
    act(() => result.current.goToNext());
    expect(result.current.currentStep).toBe(2);
  });

  it('goToPrev decrements the step', () => {
    const { result } = renderHook(() => useJourneyStep());
    act(() => result.current.goToNext());
    act(() => result.current.goToNext());
    act(() => result.current.goToPrev());
    expect(result.current.currentStep).toBe(1);
  });

  it('does not go below 0', () => {
    const { result } = renderHook(() => useJourneyStep());
    act(() => result.current.goToPrev());
    expect(result.current.currentStep).toBe(0);
  });

  it('does not go above max step (3)', () => {
    const { result } = renderHook(() => useJourneyStep());
    act(() => result.current.goToStep(3));
    act(() => result.current.goToNext());
    expect(result.current.currentStep).toBe(3);
  });

  it('goToStep sets an arbitrary valid step', () => {
    const { result } = renderHook(() => useJourneyStep());
    act(() => result.current.goToStep(2));
    expect(result.current.currentStep).toBe(2);
  });

  it('goToStep ignores invalid step values', () => {
    const { result } = renderHook(() => useJourneyStep());
    act(() => result.current.goToStep(5));
    expect(result.current.currentStep).toBe(0);
    act(() => result.current.goToStep(-1));
    expect(result.current.currentStep).toBe(0);
  });
});
