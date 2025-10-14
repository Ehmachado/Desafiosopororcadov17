import { useState, useEffect, useRef } from 'react';

export const useLocalStorage = (key, initialValue) => {
  // Ref to track if this is the first render
  const isFirstRender = useRef(true);
  
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    // Skip writing to localStorage on first render to prevent StrictMode double-write
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};

export default useLocalStorage;
