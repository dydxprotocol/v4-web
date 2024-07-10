import { useCallback, useEffect, useState } from 'react';

export const useCommandMenu = () => {
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'k' && (event.ctrlKey || event.metaKey)) {
      setIsCommandMenuOpen((isOpen) => !isOpen);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const closeCommandMenu = useCallback(() => {
    setIsCommandMenuOpen(false);
  }, []);

  return {
    closeCommandMenu,
    isCommandMenuOpen,
    setIsCommandMenuOpen,
  };
};
