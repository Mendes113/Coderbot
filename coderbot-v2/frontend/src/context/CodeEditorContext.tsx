import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  useEditorPreferences, 
  EditorPreferences,
  EditorMode,
  EditorTheme 
} from '@/hooks/useEditorPreferences';

export const CODE_SERVER_URL = '';

/**
 * Code Editor Context Interface
 */
interface CodeEditorContextType {
  // Legacy visibility control
  editorVisible: boolean;
  setEditorVisible: (v: boolean) => void;
  
  // Editor preferences
  editorPreferences: EditorPreferences;
  isSimpleMode: boolean;
  isAdvancedMode: boolean;
  editorTheme: 'light' | 'dark';
  
  // Preference actions
  updatePreference: <K extends keyof EditorPreferences>(
    key: K,
    value: EditorPreferences[K]
  ) => Promise<void>;
  savePreferences: (prefs: Partial<EditorPreferences>) => Promise<void>;
  toggleMode: () => Promise<void>;
  resetPreferences: () => Promise<void>;
  
  // Loading states
  isLoadingPreferences: boolean;
  isSyncingPreferences: boolean;
}

const CodeEditorContext = createContext<CodeEditorContextType | undefined>(undefined);

/**
 * Provider for Code Editor Context with preferences management
 */
export const CodeEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [editorVisible, setEditorVisible] = useState(false);
  
  const {
    preferences,
    isLoading,
    isSyncing,
    isSimpleMode,
    isAdvancedMode,
    actualTheme,
    updatePreference,
    savePreferences,
    toggleMode,
    resetPreferences,
  } = useEditorPreferences();

  const value: CodeEditorContextType = {
    editorVisible,
    setEditorVisible,
    editorPreferences: preferences,
    isSimpleMode,
    isAdvancedMode,
    editorTheme: actualTheme,
    updatePreference,
    savePreferences,
    toggleMode,
    resetPreferences,
    isLoadingPreferences: isLoading,
    isSyncingPreferences: isSyncing,
  };

  return (
    <CodeEditorContext.Provider value={value}>
      {children}
    </CodeEditorContext.Provider>
  );
};

/**
 * Hook to use Code Editor Context
 */
export const useCodeEditor = () => {
  const context = useContext(CodeEditorContext);
  
  if (context === undefined) {
    throw new Error('useCodeEditor must be used within a CodeEditorProvider');
  }
  
  return context;
}; 