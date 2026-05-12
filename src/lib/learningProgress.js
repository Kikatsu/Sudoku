const LEARNING_STORAGE_KEY = "sana-sudoku-learning-v1";

export function loadLearningProgress() {
  try {
    const raw = localStorage.getItem(LEARNING_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return {
      completedIds: Array.isArray(data.completedIds) ? [...data.completedIds] : [],
      cleanXpAwardedIds: Array.isArray(data.cleanXpAwardedIds) ? [...data.cleanXpAwardedIds] : [],
    };
  } catch {
    return { completedIds: [], cleanXpAwardedIds: [] };
  }
}

export function saveLearningProgress(progress) {
  localStorage.setItem(
    LEARNING_STORAGE_KEY,
    JSON.stringify({
      completedIds: progress.completedIds ?? [],
      cleanXpAwardedIds: progress.cleanXpAwardedIds ?? [],
    }),
  );
}

export function markLessonCompleted(lessonId, progress) {
  const completed = new Set(progress.completedIds || []);
  completed.add(lessonId);
  return { ...progress, completedIds: [...completed] };
}

export function markLessonXpAwarded(lessonId, progress) {
  const awarded = new Set(progress.cleanXpAwardedIds || []);
  awarded.add(lessonId);
  return { ...progress, cleanXpAwardedIds: [...awarded] };
}
