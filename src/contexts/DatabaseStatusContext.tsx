/// <reference types="vite/client" />
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { doc, getDocFromServer } from 'firebase/firestore';
import { AlertTriangle } from 'lucide-react';

interface DatabaseStatusContextType {
  isConfigured: boolean;
  checking: boolean;
  error: string | null;
}

const DatabaseStatusContext = createContext<DatabaseStatusContextType>({
  isConfigured: true,
  checking: true,
  error: null,
});

export const DatabaseStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConfigured, setIsConfigured] = useState(true);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkDatabase() {
      try {
        // Simple call to check if the database exists and is accessible
        await getDocFromServer(doc(db, '_connection_test', 'check'));
        setIsConfigured(true);
      } catch (err: any) {
        // "Database (default) not found" or similar errors mean it's not configured
        if (err?.code === 'not-found' || err?.message?.includes('Database') && err?.message?.includes('not found')) {
          console.warn("Firestore Database not found. Please create it in the Firebase Console.");
          setIsConfigured(false);
          setError("O banco de dados ainda não foi configurado. Configure o Firestore no Firebase Console.");
        } else if (err?.code === 'permission-denied') {
          // Permission denied means it exists but we can't read this specific test path, which is fine
          setIsConfigured(true);
        } else {
          // Other errors might be connectivity issues, we'll assume it's configured but unreachable
          console.error("Firestore check error:", err);
          setIsConfigured(true); 
        }
      } finally {
        setChecking(false);
      }
    }

    checkDatabase();
  }, []);

  return (
    <DatabaseStatusContext.Provider value={{ isConfigured, checking, error }}>
      {!isConfigured && !checking && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-3 shadow-lg flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top duration-500">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            {error || "O banco de dados Firestore ainda não foi configurado."}
          </p>
          <a 
            href={`https://console.firebase.google.com/project/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/firestore`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline font-bold whitespace-nowrap hover:text-white/80 transition-colors"
          >
            Configurar Agora
          </a>
        </div>
      )}
      {children}
    </DatabaseStatusContext.Provider>
  );
};

export const useDatabaseStatus = () => useContext(DatabaseStatusContext);
