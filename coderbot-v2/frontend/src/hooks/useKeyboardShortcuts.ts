import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onFocus?: () => void;
  onSubmit?: () => void;
  onEscape?: () => void;
}

export const useKeyboardShortcuts = ({ onFocus, onSubmit, onEscape }: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K para focar no input
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        onFocus?.();
      }
      
      // Ctrl/Cmd + Enter para enviar
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        onSubmit?.();
      }
      
      // Escape para limpar/cancelar
      if (event.key === 'Escape') {
        onEscape?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onFocus, onSubmit, onEscape]);
};
