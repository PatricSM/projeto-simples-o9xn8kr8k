import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HospitalViewContextType {
  hospitalContext: {
    hospitalId: string;
    hospitalName: string;
  } | null;
  setHospitalContext: (context: { hospitalId: string; hospitalName: string } | null) => void;
  isViewingAsHospital: boolean;
}

const HospitalViewContext = createContext<HospitalViewContextType | undefined>(undefined);

export function HospitalViewProvider({ children }: { children: ReactNode }) {
  const [hospitalContext, setHospitalContext] = useState<{
    hospitalId: string;
    hospitalName: string;
  } | null>(null);

  const isViewingAsHospital = hospitalContext !== null;

  return (
    <HospitalViewContext.Provider
      value={{
        hospitalContext,
        setHospitalContext,
        isViewingAsHospital,
      }}
    >
      {children}
    </HospitalViewContext.Provider>
  );
}

export function useHospitalView() {
  const context = useContext(HospitalViewContext);
  if (context === undefined) {
    throw new Error('useHospitalView must be used within a HospitalViewProvider');
  }
  return context;
}