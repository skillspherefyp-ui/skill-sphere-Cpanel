import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  return 'http://localhost:5000';
};

export const slugify = (name) =>
  (name || '')
    .replace(/\+\+/g,  '-plus-plus')   // C++ → c-plus-plus
    .replace(/\+/g,    '-plus')         // A+ → a-plus
    .replace(/#/g,     '-sharp')        // C# → c-sharp
    .replace(/\./g,    '-')             // Node.js → node-js
    .replace(/&/g,     '-and-')         // HTML & CSS → html-and-css
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')       // strip remaining special chars
    .trim()
    .replace(/\s+/g,   '-')             // spaces → hyphens
    .replace(/-{2,}/g, '-')             // collapse multiple hyphens
    .replace(/^-|-$/g, '');             // trim leading/trailing hyphens

export const resolveFileUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  return `${getBaseUrl()}${filePath}`;
};
