"use client";

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
  type TransitionStartFunction,
} from "react";

const SelectionContext = createContext<{
  updating: boolean;
  update: TransitionStartFunction;
}>({
  updating: false,
  update: (callback) => {
    void callback();
  },
});

export function RentalSelection({ children }: { children: ReactNode }) {
  const [updating, update] = useTransition();
  return (
    <SelectionContext.Provider value={{ updating, update }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useRentalSelection() {
  return useContext(SelectionContext);
}
