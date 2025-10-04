import { useEffect, useRef } from 'react';

/**
 * Hook para detectar padrões de texto digitados (ex: "vim", "emacs")
 * @param patterns Array de padrões para detectar (ex: ["vim", "emacs"])
 * @param onPatternDetected Callback com o padrão detectado
 * @param enabled Se a detecção está ativa (padrão: true)
 * @param timeWindow Tempo máximo entre teclas em ms (padrão: 1500)
 */
export const useTextPatternDetector = (
  patterns: string[],
  onPatternDetected: (pattern: string) => void,
  enabled: boolean = true,
  timeWindow: number = 1500
) => {
  const sequenceRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || patterns.length === 0) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignorar teclas especiais e modificadores
      if (event.ctrlKey || event.altKey || event.metaKey || event.key.length > 1) {
        return;
      }

      // Ignorar se estiver em um campo de texto (a menos que seja um editor especial)
      const target = event.target as HTMLElement;
      const isEditableField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Para "Vim Master", permitir detecção mesmo em campos editáveis
      // mas para outros padrões, ignorar
      if (isEditableField && !patterns.some(p => p.toLowerCase().includes('vim'))) {
        return;
      }

      // Adicionar caractere à sequência
      sequenceRef.current += event.key.toLowerCase();

      // Limpar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Verificar se algum padrão foi detectado
      for (const pattern of patterns) {
        const normalizedPattern = pattern.toLowerCase();
        if (sequenceRef.current.includes(normalizedPattern)) {
          onPatternDetected(pattern);
          sequenceRef.current = ''; // Reset após detecção
          return;
        }
      }

      // Limitar tamanho da sequência
      const maxLength = Math.max(...patterns.map(p => p.length)) + 5;
      if (sequenceRef.current.length > maxLength) {
        sequenceRef.current = sequenceRef.current.slice(-maxLength);
      }

      // Reset após período de inatividade
      timeoutRef.current = setTimeout(() => {
        sequenceRef.current = '';
      }, timeWindow);
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, patterns, onPatternDetected, timeWindow]);
};

/**
 * Hook para detectar sequência específica de comandos Vim
 * @param onDetect Callback executado quando comandos Vim são detectados
 * @param enabled Se a detecção está ativa (padrão: true)
 */
export const useVimCommandDetector = (
  onDetect: () => void,
  enabled: boolean = true
) => {
  const commandsRef = useRef<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputBufferRef = useRef<string>('');

  // Comandos Vim clássicos para detectar
  const VIM_COMMANDS = [':w', ':q', ':wq', ':q!', 'dd', 'yy', 'gg', 'ZZ', 'u', ':e'];

  useEffect(() => {
    if (!enabled) {
      console.log('⌨️ [useVimCommandDetector] Hook is DISABLED');
      return;
    }

    console.log('⌨️ [useVimCommandDetector] Hook is ENABLED and listening...');
    console.log('⌨️ [useVimCommandDetector] Valid commands:', VIM_COMMANDS);

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignorar se estiver em campos de input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      console.log('⌨️ [useVimCommandDetector] Key pressed:', event.key);
      
      // Adicionar tecla ao buffer de entrada
      inputBufferRef.current += event.key;
      
      // Limitar tamanho do buffer
      if (inputBufferRef.current.length > 10) {
        inputBufferRef.current = inputBufferRef.current.slice(-10);
      }

      console.log('⌨️ [useVimCommandDetector] Input buffer:', inputBufferRef.current);
      
      // Verificar se algum comando Vim foi formado
      let commandDetected = false;
      for (const cmd of VIM_COMMANDS) {
        if (inputBufferRef.current.endsWith(cmd)) {
          console.log('✅ [useVimCommandDetector] Command detected:', cmd);
          commandsRef.current.push(cmd);
          commandDetected = true;
          
          console.log('⌨️ [useVimCommandDetector] Total commands so far:', commandsRef.current.length, commandsRef.current);
          
          // Detectar após 3 comandos Vim válidos
          if (commandsRef.current.length >= 3) {
            console.log('🎉 [useVimCommandDetector] VIM MASTER ACHIEVED! Commands:', commandsRef.current);
            onDetect();
            commandsRef.current = [];
            inputBufferRef.current = '';
            return;
          }
          break;
        }
      }

      if (!commandDetected) {
        console.log('❌ [useVimCommandDetector] No command matched yet');
      }

      // Limpar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset após 3 segundos de inatividade
      timeoutRef.current = setTimeout(() => {
        console.log('⏱️ [useVimCommandDetector] Timeout - resetting buffer and commands');
        commandsRef.current = [];
        inputBufferRef.current = '';
      }, 3000);
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, onDetect]);
};

/**
 * Hook para detectar padrões de navegação (visitação de páginas)
 * @param requiredPaths Array de caminhos que devem ser visitados
 * @param onComplete Callback executado quando todos os caminhos foram visitados
 * @param enabled Se a detecção está ativa (padrão: true)
 * @param timeWindow Tempo máximo para completar em ms (padrão: 60000 = 1min)
 */
export const useNavigationPatternDetector = (
  requiredPaths: string[],
  onComplete: (visitedPaths: string[]) => void,
  enabled: boolean = true,
  timeWindow: number = 60000
) => {
  const visitedPathsRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || requiredPaths.length === 0) return;

    const checkPath = () => {
      const currentPath = window.location.pathname;
      
      // Verificar se o path atual corresponde a algum requerido
      for (const requiredPath of requiredPaths) {
        if (currentPath.includes(requiredPath) || currentPath === requiredPath) {
          visitedPathsRef.current.add(requiredPath);
          break;
        }
      }

      // Verificar se todos foram visitados
      if (visitedPathsRef.current.size === requiredPaths.length) {
        onComplete(Array.from(visitedPathsRef.current));
        visitedPathsRef.current.clear();
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    };

    // Verificar path inicial
    checkPath();

    // Observar mudanças de URL
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      checkPath();
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      checkPath();
    };

    window.addEventListener('popstate', checkPath);

    // Reset após time window
    timeoutRef.current = setTimeout(() => {
      visitedPathsRef.current.clear();
    }, timeWindow);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', checkPath);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, requiredPaths, onComplete, timeWindow]);
};
