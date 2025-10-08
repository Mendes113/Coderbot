import { useState, useEffect, useCallback } from 'react';
import { pb, getCurrentUser } from '@/integrations/pocketbase/client';

/**
 * Editor mode preferences
 */
export type EditorMode = 'simple' | 'advanced';

/**
 * Editor theme preferences
 */
export type EditorTheme = 'light' | 'dark' | 'auto';

/**
 * Editor preferences structure
 */
export interface EditorPreferences {
  editor_mode: EditorMode;
  editor_theme: EditorTheme;
  show_minimap: boolean;
  enable_lsp: boolean;
  font_size: number;
  enable_ligatures: boolean;
  show_line_numbers: boolean;
}

/**
 * Default preferences based on editor mode
 */
const getDefaultPreferences = (mode: EditorMode = 'simple'): EditorPreferences => ({
  editor_mode: mode,
  editor_theme: 'auto',
  show_minimap: mode === 'advanced',
  enable_lsp: mode === 'advanced',
  font_size: 14,
  enable_ligatures: true,
  show_line_numbers: true,
});

/**
 * Local storage key for caching preferences
 */
const STORAGE_KEY = 'coderbot_editor_preferences';

/**
 * Custom hook for managing editor preferences with PocketBase integration
 * and localStorage cache for better performance
 */
export const useEditorPreferences = () => {
  const [preferences, setPreferences] = useState<EditorPreferences>(() => {
    // Try to load from localStorage first (for better initial render performance)
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached) as EditorPreferences;
      } catch {
        return getDefaultPreferences();
      }
    }
    return getDefaultPreferences();
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Load preferences from PocketBase
   */
  const loadPreferences = useCallback(async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        setPreferences(getDefaultPreferences());
        setIsLoading(false);
        return;
      }

      // Fetch user record to get editor_preferences
      const userRecord = await pb.collection('users').getOne(user.id);
      
      if (userRecord.editor_preferences) {
        const prefs = userRecord.editor_preferences as EditorPreferences;
        setPreferences(prefs);
        // Update localStorage cache
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      } else {
        // No preferences saved yet, use defaults
        const defaults = getDefaultPreferences();
        setPreferences(defaults);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      }
    } catch (error) {
      console.error('Error loading editor preferences:', error);
      // On error, keep current state or defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save preferences to PocketBase
   */
  const savePreferences = useCallback(async (newPreferences: Partial<EditorPreferences>) => {
    try {
      const user = getCurrentUser();
      if (!user) {
        console.warn('Cannot save preferences: user not logged in');
        return;
      }

      setIsSyncing(true);

      // Merge with current preferences
      const updated = { ...preferences, ...newPreferences };

      // Save to PocketBase
      await pb.collection('users').update(user.id, {
        editor_preferences: updated,
      });

      // Update local state and cache
      setPreferences(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving editor preferences:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [preferences]);

  /**
   * Update a single preference
   */
  const updatePreference = useCallback(<K extends keyof EditorPreferences>(
    key: K,
    value: EditorPreferences[K]
  ) => {
    return savePreferences({ [key]: value });
  }, [savePreferences]);

  /**
   * Toggle between simple and advanced mode
   */
  const toggleMode = useCallback(async () => {
    const newMode: EditorMode = preferences.editor_mode === 'simple' ? 'advanced' : 'simple';
    
    // When changing mode, update related preferences
    const modePreferences: Partial<EditorPreferences> = {
      editor_mode: newMode,
      show_minimap: newMode === 'advanced',
      enable_lsp: newMode === 'advanced',
    };

    return savePreferences(modePreferences);
  }, [preferences.editor_mode, savePreferences]);

  /**
   * Reset preferences to defaults
   */
  const resetPreferences = useCallback(async () => {
    const defaults = getDefaultPreferences(preferences.editor_mode);
    return savePreferences(defaults);
  }, [preferences.editor_mode, savePreferences]);

  /**
   * Get computed values
   */
  const isSimpleMode = preferences.editor_mode === 'simple';
  const isAdvancedMode = preferences.editor_mode === 'advanced';

  /**
   * Get actual theme considering 'auto' setting
   */
  const getActualTheme = useCallback((): 'light' | 'dark' => {
    if (preferences.editor_theme !== 'auto') {
      return preferences.editor_theme;
    }

    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return 'light';
  }, [preferences.editor_theme]);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Listen for system theme changes when using 'auto'
  useEffect(() => {
    if (preferences.editor_theme !== 'auto' || typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      // Force re-render when system theme changes
      setPreferences(prev => ({ ...prev }));
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [preferences.editor_theme]);

  return {
    preferences,
    isLoading,
    isSyncing,
    isSimpleMode,
    isAdvancedMode,
    actualTheme: getActualTheme(),
    updatePreference,
    savePreferences,
    toggleMode,
    resetPreferences,
    loadPreferences,
  };
};
