import React, { createContext, useContext, useState, useEffect } from 'react';
import { EmpresaConfig } from '@/types/database';
import { EmpresaService, DEFAULT_EMPRESA_CONFIG } from '@/lib/storage';

interface EmpresaContextType {
  empresa: EmpresaConfig;
  config: EmpresaConfig;
  updateEmpresa: (newConfig: EmpresaConfig) => void;
  resetEmpresa: () => void;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const [empresa, setEmpresa] = useState<EmpresaConfig>(() => EmpresaService.get());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<EmpresaConfig>;
      if (customEvent.detail) {
        setEmpresa(customEvent.detail);
      } else {
        setEmpresa(EmpresaService.get());
      }
    };
    window.addEventListener('empresa-config-changed', handleUpdate);
    return () => window.removeEventListener('empresa-config-changed', handleUpdate);
  }, []);

  const updateEmpresa = (newConfig: EmpresaConfig) => {
    EmpresaService.save(newConfig);
    setEmpresa(newConfig);
  };

  const resetEmpresa = () => {
    EmpresaService.save(DEFAULT_EMPRESA_CONFIG);
    setEmpresa(DEFAULT_EMPRESA_CONFIG);
  };

  return (
    <EmpresaContext.Provider value={{ empresa, config: empresa, updateEmpresa, resetEmpresa }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa(): EmpresaContextType {
  const context = useContext(EmpresaContext);
  if (!context) {
    const current = EmpresaService.get();
    return {
      empresa: current,
      config: current,
      updateEmpresa: (cfg) => EmpresaService.save(cfg),
      resetEmpresa: () => EmpresaService.save(DEFAULT_EMPRESA_CONFIG),
    };
  }
  return context;
}
