// hooks/useCodePersistence.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { pb, getCurrentUser, isAuthenticated, type CodeSnippetRecord } from '@/lib/pocketbase';
import { toast } from 'react-hot-toast';

interface UseCodePersistenceOptions {
  autoSave?: boolean;           // Salvamento automático habilitado
  autoSaveDelay?: number;       // Delay para auto-save (ms)
  onSaveSuccess?: () => void;   // Callback de sucesso
  onSaveError?: (error: Error) => void;  // Callback de erro
}

interface UseCodePersistenceReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  saveCode: (code: string, language: string, fileName: string, title?: string) => Promise<void>;
  loadCode: () => Promise<void>;
  deleteCode: (id: string) => Promise<void>;
  savedSnippets: CodeSnippetRecord[];
  currentSnippetId: string | null;
  triggerAutoSave: (code: string, language: string, fileName: string) => void;
}

const COLLECTION_NAME = 'code_snippets';
const LOCAL_STORAGE_KEY = 'coderbot_code_backup';

export function useCodePersistence(options: UseCodePersistenceOptions = {}): UseCodePersistenceReturn {
  const {
    autoSave = true,
    autoSaveDelay = 3000,
    onSaveSuccess,
    onSaveError
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSnippets, setSavedSnippets] = useState<CodeSnippetRecord[]>([]);
  const [currentSnippetId, setCurrentSnippetId] = useState<string | null>(null);
  
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCodeRef = useRef<string>('');
  const lastLanguageRef = useRef<string>('');
  const lastFileNameRef = useRef<string>('');

  // Carregar códigos salvos do usuário
  const loadCode = useCallback(async () => {
    if (!isAuthenticated()) {
      // Se não autenticado, tentar carregar do localStorage
      try {
        const backup = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (backup) {
          const data = JSON.parse(backup);
          lastCodeRef.current = data.code || '';
          lastLanguageRef.current = data.language || 'javascript';
          lastFileNameRef.current = data.fileName || 'untitled';
        }
      } catch (error) {
        console.error('Erro ao carregar backup local:', error);
      }
      return;
    }

    try {
      const user = getCurrentUser();
      if (!user) return;

      const records = await pb.collection(COLLECTION_NAME).getFullList<CodeSnippetRecord>({
        filter: `user = "${user.id}"`,
        sort: '-lastModified',
      });

      setSavedSnippets(records);

      // Carregar o mais recente
      if (records.length > 0) {
        const latest = records[0];
        setCurrentSnippetId(latest.id);
        lastCodeRef.current = latest.code;
        lastLanguageRef.current = latest.language;
        lastFileNameRef.current = latest.fileName;
        setLastSaved(new Date(latest.lastModified));
      }
    } catch (error) {
      console.error('Erro ao carregar códigos salvos:', error);
      if (onSaveError) {
        onSaveError(error as Error);
      }
    }
  }, [onSaveError]);

  // Salvar código
  const saveCode = useCallback(async (
    code: string,
    language: string,
    fileName: string,
    title?: string
  ) => {
    setIsSaving(true);
    setHasUnsavedChanges(false);

    // Salvar backup local independentemente da autenticação
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        code,
        language,
        fileName,
        lastModified: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Erro ao salvar backup local:', error);
    }

    if (!isAuthenticated()) {
      setIsSaving(false);
      setLastSaved(new Date());
      toast.success('Código salvo localmente');
      return;
    }

    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const data = {
        user: user.id,
        code,
        language,
        fileName,
        title: title || `${fileName} - ${new Date().toLocaleString('pt-BR')}`,
        lastModified: new Date().toISOString(),
      };

      let record: CodeSnippetRecord;

      if (currentSnippetId) {
        // Atualizar existente
        record = await pb.collection(COLLECTION_NAME).update<CodeSnippetRecord>(currentSnippetId, data);
      } else {
        // Criar novo
        record = await pb.collection(COLLECTION_NAME).create<CodeSnippetRecord>(data);
        setCurrentSnippetId(record.id);
      }

      setLastSaved(new Date(record.lastModified));
      
      // Atualizar lista
      await loadCode();

      if (onSaveSuccess) {
        onSaveSuccess();
      }

      toast.success('Código salvo com sucesso!', {
        icon: '💾',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao salvar código:', error);
      toast.error('Erro ao salvar código no servidor');
      
      if (onSaveError) {
        onSaveError(error as Error);
      }
    } finally {
      setIsSaving(false);
    }
  }, [currentSnippetId, loadCode, onSaveSuccess, onSaveError]);

  // Deletar código
  const deleteCode = useCallback(async (id: string) => {
    if (!isAuthenticated()) {
      toast.error('Você precisa estar autenticado');
      return;
    }

    try {
      await pb.collection(COLLECTION_NAME).delete(id);
      
      if (id === currentSnippetId) {
        setCurrentSnippetId(null);
        lastCodeRef.current = '';
      }

      await loadCode();
      toast.success('Código deletado!');
    } catch (error) {
      console.error('Erro ao deletar código:', error);
      toast.error('Erro ao deletar código');
    }
  }, [currentSnippetId, loadCode]);

  // Auto-save quando código muda
  const triggerAutoSave = useCallback((code: string, language: string, fileName: string) => {
    if (!autoSave) return;

    // Verificar se realmente mudou
    if (
      code === lastCodeRef.current &&
      language === lastLanguageRef.current &&
      fileName === lastFileNameRef.current
    ) {
      return;
    }

    setHasUnsavedChanges(true);
    lastCodeRef.current = code;
    lastLanguageRef.current = language;
    lastFileNameRef.current = fileName;

    // Limpar timer anterior
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Criar novo timer
    autoSaveTimerRef.current = setTimeout(() => {
      saveCode(code, language, fileName);
    }, autoSaveDelay);
  }, [autoSave, autoSaveDelay, saveCode]);

  // Carregar ao montar
  useEffect(() => {
    loadCode();
  }, [loadCode]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveCode,
    loadCode,
    deleteCode,
    savedSnippets,
    currentSnippetId,
    triggerAutoSave,
  };
}
