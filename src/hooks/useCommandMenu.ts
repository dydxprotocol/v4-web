import { useEffect, useState } from 'react';

export const useCommandMenu = () => {
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);

  useEffect(() => {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if(event.key === 'k' && (event.ctrlKey || event.metaKey))
        setIsCommandMenuOpen(!isCommandMenuOpen)
    })
  }, []);

  return {
    closeCommandMenu: () => setIsCommandMenuOpen(false),
    isCommandMenuOpen,
    setIsCommandMenuOpen,
  };
};
