import { useEffect, useRef, useState } from 'react';

/**
 * Hook para detectar o Konami Code (↑↑↓↓←→←→BA)
 * @param onSuccess Callback executado quando o código é ativado
 * @param enabled Se a detecção está ativa (padrão: true)
 */
export const useKonamiCode = (
  onSuccess: () => void,
  enabled: boolean = true
) => {
  const [isActive, setIsActive] = useState(false);
  const sequenceRef = useRef<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sequência do Konami Code
  const KONAMI_SEQUENCE = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'KeyB',
    'KeyA'
  ];

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar se estiver em um campo de texto
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Adicionar tecla pressionada à sequência
      sequenceRef.current.push(event.code);

      // Limitar tamanho da sequência ao tamanho do Konami Code
      if (sequenceRef.current.length > KONAMI_SEQUENCE.length) {
        sequenceRef.current.shift();
      }

      // Limpar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset após 2 segundos de inatividade
      timeoutRef.current = setTimeout(() => {
        sequenceRef.current = [];
      }, 2000);

      // Verificar se a sequência atual corresponde ao Konami Code
      if (sequenceRef.current.length === KONAMI_SEQUENCE.length) {
        const isMatch = sequenceRef.current.every(
          (key, index) => key === KONAMI_SEQUENCE[index]
        );

        if (isMatch) {
          setIsActive(true);
          onSuccess();
          sequenceRef.current = []; // Reset após sucesso
          
          // Reset o estado após 3 segundos
          setTimeout(() => {
            setIsActive(false);
          }, 3000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, onSuccess]);

  return { isActive };
};
