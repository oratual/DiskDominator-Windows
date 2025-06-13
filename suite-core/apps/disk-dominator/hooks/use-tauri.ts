import { useEffect, useState } from 'react';

// Check if we're running in Tauri
export const useTauri = () => {
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    setIsTauri(typeof window !== 'undefined' && '__TAURI__' in window);
  }, []);

  return isTauri;
};

// Tauri API wrapper - SOLO DATOS REALES, NO MOCKS!
export const invoke = async <T = any>(
  cmd: string,
  args?: Record<string, any>
): Promise<T> => {
  if (typeof window !== 'undefined' && '__TAURI__' in window && window.__TAURI__) {
    const { invoke } = window.__TAURI__.tauri;
    return invoke<T>(cmd, args);
  }
  
  // NO MÁS MOCKS! Si no hay Tauri, ERROR!
  throw new Error(`TAURI NO DISPONIBLE! Ejecuta la aplicación con 'cargo tauri dev' para obtener datos REALES. Comando intentado: ${cmd}`);
};