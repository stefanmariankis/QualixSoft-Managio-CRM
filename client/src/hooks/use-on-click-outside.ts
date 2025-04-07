import { useEffect, RefObject } from 'react';

type Event = MouseEvent | TouchEvent;

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: Event) => void
) {
  useEffect(() => {
    const listener = (event: Event) => {
      const el = ref?.current;
      
      // Nu face nimic dacă click-ul a fost pe elementul referențiat
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      
      handler(event);
    };
    
    // Adăugăm event listeners pentru mouse și touch
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    return () => {
      // Curățăm event listeners când componenta se demontează
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}