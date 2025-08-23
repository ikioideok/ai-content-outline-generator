import { SavedOutline, SavedArticle, SavedMarkdown } from '../types';

const STORAGE_KEY_OUTLINES = 'ai-outline-generator-saved-outlines';
const STORAGE_KEY_ARTICLES = 'ai-outline-generator-saved-articles';
const STORAGE_KEY_MARKDOWNS = 'ai-outline-generator-saved-markdowns';

export const getSavedOutlines = (): SavedOutline[] => {
  try {
    const data = window.localStorage.getItem(STORAGE_KEY_OUTLINES);
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
    window.localStorage.setItem(STORAGE_KEY_OUTLINES, data);
  } catch (error) {
    console.error("Error writing to localStorage for outlines", error);
  }
};

export const getSavedArticles = (): SavedArticle[] => {
  try {
    const data = window.localStorage.getItem(STORAGE_KEY_ARTICLES);
    if (!data) {
      return [];
    }
    const articles: SavedArticle[] = JSON.parse(data);
    // Sort by creation date, newest first
    return articles.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error reading articles from localStorage", error);
    return [];
  }
};

export const saveArticles = (articles: SavedArticle[]): void => {
  try {
    const data = JSON.stringify(articles);
    window.localStorage.setItem(STORAGE_KEY_ARTICLES, data);
  } catch (error) {
    console.error("Error writing articles to localStorage", error);
  }
};

export const getSavedMarkdowns = (): SavedMarkdown[] => {
  try {
    const data = window.localStorage.getItem(STORAGE_KEY_MARKDOWNS);
    if (!data) {
      return [];
    }
    const markdowns: SavedMarkdown[] = JSON.parse(data);
    return markdowns.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error reading markdowns from localStorage", error);
    return [];
  }
};

export const saveMarkdowns = (markdowns: SavedMarkdown[]): void => {
  try {
    const data = JSON.stringify(markdowns);
    window.localStorage.setItem(STORAGE_KEY_MARKDOWNS, data);
  } catch (error) {
    console.error("Error writing markdowns to localStorage", error);
  }
};
