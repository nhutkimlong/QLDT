
import { useState, useEffect } from 'react';

function getValue<T,>(key: string, initialValue: T | (() => T)): T {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Error parsing localStorage key:", key, error);
      localStorage.removeItem(key); // Remove corrupted data
    }
  }
  if (initialValue instanceof Function) return initialValue();
  return initialValue;
}

export function useLocalStorage<T,>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    return getValue(key, initialValue);
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
