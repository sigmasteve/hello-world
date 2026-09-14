import React, { createContext, useContext, useEffect, useState } from 'react';
import { mockProvider } from './mockProvider';
import { resolveHealthProvider } from './index';
import type { HealthProvider } from './types';

const HealthProviderContext = createContext<HealthProvider>(mockProvider);

export function HealthDataProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<HealthProvider>(mockProvider);

  useEffect(() => {
    let cancelled = false;
    resolveHealthProvider().then((p) => {
      if (!cancelled) setProvider(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <HealthProviderContext.Provider value={provider}>{children}</HealthProviderContext.Provider>;
}

export function useHealthProvider(): HealthProvider {
  return useContext(HealthProviderContext);
}
