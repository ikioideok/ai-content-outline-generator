import { SavedOutline } from '../types';

const STORAGE_KEY = 'ai-outline-generator-saved-outlines';

export const getSavedOutlines = (): SavedOutline[] => {
  try {
    const data = window.localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const outlines: SavedOutline[] = JSON.parse(data);
    // Sort by creation date, newest first
    return outlines.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error reading from localStorage", error);
    return [];
  }
};

export const saveOutlines = (outlines: SavedOutline[]): void => {
  try {
    const data = JSON.stringify(outlines);
    window.localStorage.setItem(STORAGE_KEY, data);
  } catch (error) {
    console.error("Error writing to localStorage", error);
  }
};
