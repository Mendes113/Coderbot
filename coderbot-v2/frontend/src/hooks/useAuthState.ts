import { useState, useEffect } from 'react';
import { pb, UserRecord, getCurrentUser } from '@/integrations/pocketbase/client';

/**
 * Type guard para validar se um modelo do PocketBase é um UserRecord válido.
 * Verifica a presença de campos obrigatórios antes de fazer type assertion.
 * 
 * @param model - Modelo retornado pelo pb.authStore
 * @returns true se o modelo tem a estrutura esperada de UserRecord
 */
const isValidUserRecord = (model: any): model is UserRecord => {
  return (
    model &&
    typeof model === 'object' &&
    typeof model.id === 'string' &&
    typeof model.collectionId === 'string' &&
    typeof model.email === 'string'
  );
};

/**
 * Hook reativo que monitora mudanças no estado de autenticação do PocketBase.
 * 
 * **Problema resolvido:**
 * `getCurrentUser()` retorna um snapshot não-reativo. Se o usuário faz logout,
 * os componentes não re-renderizam automaticamente.
 * 
 * **Solução:**
 * Este hook se subscreve ao `pb.authStore.onChange()` para forçar re-render
 * sempre que o estado de autenticação mudar (login, logout, token expirado).
 * 
 * @returns currentUser - Usuário autenticado ou undefined
 * @returns isAuthenticated - Boolean indicando se há sessão válida
 * @returns isLoading - Boolean durante carregamento inicial
 * 
 * @example
 * ```tsx
 * const { currentUser, isAuthenticated, isLoading } = useAuthState();
 * 
 * if (isLoading) return <Spinner />;
 * if (!isAuthenticated) return <LoginPage />;
 * 
 * return <Dashboard user={currentUser} />;
 * ```
 */
export const useAuthState = () => {
  const [currentUser, setCurrentUser] = useState<UserRecord | undefined>(() => getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => pb.authStore.isValid);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sincronizar estado inicial
    setCurrentUser(getCurrentUser());
    setIsAuthenticated(pb.authStore.isValid);
    setIsLoading(false);

    // Subscrever a mudanças no authStore
    const unsubscribe = pb.authStore.onChange((token, model) => {
      // Desenvolvimento: log apenas em modo dev
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [useAuthState] Auth changed:', {
          hasToken: !!token,
          hasModel: !!model,
          userId: model?.id || 'none'
        });
      }

      // Validar tipo antes de atribuir
      if (model && isValidUserRecord(model)) {
        setCurrentUser(model);
        setIsAuthenticated(!!token);
      } else {
        setCurrentUser(undefined);
        setIsAuthenticated(false);
      }
    });

    // Cleanup: desinscrever quando componente desmontar
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    currentUser,
    isAuthenticated,
    isLoading
  };
};
