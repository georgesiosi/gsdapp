"use client"; // Required for hooks using useState and useEffect

import { useState, useEffect } from 'react';

// Helper function to safely parse JSON from localStorage
function safelyParseJson<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) {
    return defaultValue;
  }
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error parsing JSON from localStorage', error);
    return defaultValue;
  }
}

/**
 * Custom hook to manage state synchronized with localStorage.
 * @param key The localStorage key.
 * @param initialValue The initial value if nothing is found in localStorage.
 * @returns A stateful value, and a function to update it.
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Check if running on the client side
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? safelyParseJson<T>(item, initialValue) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  // useEffect to update local storage when the state changes
  // This effect should only run on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          typeof storedValue === 'function'
            ? (storedValue as (val: T) => T)(storedValue) // Execute function if it is
            : storedValue;
        // Save state
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        // A more advanced implementation would handle the error case
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    }
  }, [key, storedValue]); // Only re-run if key or storedValue changes

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
     try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        // Save state
        setStoredValue(valueToStore);
      } catch (error) {
        // A more advanced implementation would handle the error case
        console.error(`Error setting value for localStorage key “${key}”:`, error);
      }
  };


  return [storedValue, setValue];
}

export default useLocalStorage;
