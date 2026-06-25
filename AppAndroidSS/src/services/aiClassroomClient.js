import { post, API_BASE } from './apiClient';

export const startCourseGeneration = (data) =>
  post('/ai-classroom/course/generate', data);

export const getAudioUrl = (path) => {
  const base = API_BASE.replace('/api', '');
  return path.startsWith('http') ? path : `${base}${path}`;
};
