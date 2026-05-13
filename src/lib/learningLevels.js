/** Ordered path: unlock next after any completion. XP (clean solve) uses xpReward. */

const TECHNIQUE_PATH = [
  "Naked Single",
  "Naked Single",
  "Hidden Single",
  "Hidden Single",
  "Candidate Scan",
  "Candidate Scan",
  "Locked Candidate / Pointing",
  "Locked Candidate / Pointing",
  "Naked Pair",
  "Candidate Scan",
  "Hidden Single",
  "Candidate Scan",
  "Locked Candidate / Pointing",
  "Locked Candidate / Pointing",
  "Candidate Pressure",
  "Candidate Pressure",
  "Advanced Scan",
  "Mixed Review",
];

const TECHNIQUE_OBJECTIVES = {
  "Naked Single": {
    ru: "Находить клетки, где остался ровно один кандидат.",
    en: "Find cells with exactly one remaining candidate.",
    kk: "Бір ғана кандидат қалған ұяшықтарды табу.",
  },
  "Hidden Single": {
    ru: "Находить число, которое в зоне может стоять только в одной клетке.",
    en: "Find a number that has only one possible cell inside a unit.",
    kk: "Аймақта тек бір ұяшыққа ғана келе алатын санды табу.",
  },
  "Locked Candidate / Pointing": {
    ru: "Видеть кандидаты, запертые в одной линии внутри квадрата.",
    en: "Spot candidates locked into one line inside a box.",
    kk: "Шаршы ішінде бір сызыққа бекітілген кандидаттарды көру.",
  },
  "Candidate Scan": {
    ru: "Выбирать следующую сильную клетку без угадывания.",
    en: "Choose the next strong cell without guessing.",
    kk: "Болжамсыз келесі маңызды ұяшықты таңдау.",
  },
  "Naked Pair": {
    ru: "Замечать пары кандидатов и очищать лишние варианты.",
    en: "Recognize candidate pairs and remove extra options.",
    kk: "Кандидат жұптарын байқап, артық нұсқаларды алып тастау.",
  },
  "Candidate Pressure": {
    ru: "Работать с плотной сеткой кандидатов в сложных позициях.",
    en: "Handle dense candidate grids in harder positions.",
    kk: "Күрделі позициядағы тығыз кандидат торымен жұмыс істеу.",
  },
  "Advanced Scan": {
    ru: "Комбинировать несколько техник перед ходом.",
    en: "Combine multiple techniques before placing a number.",
    kk: "Сан қоймас бұрын бірнеше техниканы біріктіру.",
  },
  "Mixed Review": {
    ru: "Закрепить весь путь: одиночки, исключения и фокус.",
    en: "Review the full path: singles, exclusions, and focus.",
    kk: "Толық жолды бекіту: жалғыздар, алып тастау және назар.",
  },
};

const BASE_LEARNING_LEVELS = [
  {
    id: "l01",
    difficulty: "easy",
    tier: "beginner",
    xpReward: 38,
    title: { ru: "Первые шаги", en: "First steps", kk: "Алғашқы қадамдар" },
  },
  {
    id: "l02",
    difficulty: "easy",
    tier: "beginner",
    xpReward: 38,
    title: { ru: "Один кандидат", en: "Single candidate", kk: "Бір кандидат" },
  },
  {
    id: "l03",
    difficulty: "easy",
    tier: "beginner",
    xpReward: 40,
    title: { ru: "Полные дома", en: "Full houses", kk: "Толық үйлер" },
  },
  {
    id: "l04",
    difficulty: "easy",
    tier: "beginner",
    xpReward: 40,
    title: { ru: "Исключения в строке", en: "Row exclusions", kk: "Қатардағы алып тастау" },
  },
  {
    id: "l05",
    difficulty: "easy",
    tier: "beginner",
    xpReward: 42,
    title: { ru: "Спокойный темп", en: "Steady rhythm", kk: "Тыныш ырғақ" },
  },
  {
    id: "l06",
    difficulty: "easy",
    tier: "beginner",
    xpReward: 42,
    title: { ru: "Закрепление базы", en: "Basics review", kk: "Негізді бекіту" },
  },
  {
    id: "l07",
    difficulty: "medium",
    tier: "practice",
    xpReward: 55,
    title: { ru: "Второй этаж", en: "Stepping up", kk: "Келесі деңгей" },
  },
  {
    id: "l08",
    difficulty: "medium",
    tier: "practice",
    xpReward: 55,
    title: { ru: "Пересечения", en: "Line intersections", kk: "Қиылыстар" },
  },
  {
    id: "l09",
    difficulty: "medium",
    tier: "practice",
    xpReward: 58,
    title: { ru: "Пары и тройки", en: "Pairs and triples", kk: "Жұптар мен үштіктер" },
  },
  {
    id: "l10",
    difficulty: "medium",
    tier: "practice",
    xpReward: 58,
    title: { ru: "Карандашная сетка", en: "Pencil discipline", kk: "Қарындаш тәртігі" },
  },
  {
    id: "l11",
    difficulty: "medium",
    tier: "practice",
    xpReward: 60,
    title: { ru: "Середина поля", en: "Mid-board focus", kk: "Тор ортасы" },
  },
  {
    id: "l12",
    difficulty: "medium",
    tier: "practice",
    xpReward: 60,
    title: { ru: "Ритм без спешки", en: "No-rush rhythm", kk: "Асықпай ойнау" },
  },
  {
    id: "l13",
    difficulty: "hard",
    tier: "challenge",
    xpReward: 78,
    title: { ru: "Плотная сетка", en: "Tight grid", kk: "Тығыз тор" },
  },
  {
    id: "l14",
    difficulty: "hard",
    tier: "challenge",
    xpReward: 78,
    title: { ru: "Меньше подсказок", en: "Fewer given cells", kk: "Аз берілген ұяшық" },
  },
  {
    id: "l15",
    difficulty: "hard",
    tier: "challenge",
    xpReward: 82,
    title: { ru: "Давление кандидатов", en: "Candidate pressure", kk: "Кандидат қысымы" },
  },
  {
    id: "l16",
    difficulty: "hard",
    tier: "challenge",
    xpReward: 82,
    title: { ru: "Долгий фокус", en: "Sustained focus", kk: "Ұзақ назар" },
  },
  {
    id: "l17",
    difficulty: "expert",
    tier: "challenge",
    xpReward: 105,
    title: { ru: "Мастерская серия", en: "Master stretch", kk: "Шеберлік сериясы" },
  },
  {
    id: "l18",
    difficulty: "expert",
    tier: "challenge",
    xpReward: 115,
    title: { ru: "Финал пути", en: "Path finale", kk: "Жолдың финалы" },
  },
];

export const LEARNING_LEVELS = BASE_LEARNING_LEVELS.map((level, index, levels) => {
  const technique = TECHNIQUE_PATH[index] || "Candidate Scan";
  return {
    ...level,
    technique,
    objective: TECHNIQUE_OBJECTIVES[technique] || TECHNIQUE_OBJECTIVES["Candidate Scan"],
    recommendedDifficulty: level.difficulty,
    prerequisiteLessonIds: index > 0 ? [levels[index - 1].id] : [],
  };
});

export function getLearningLevelById(id) {
  return LEARNING_LEVELS.find((l) => l.id === id) || null;
}

export function getLearningLevelIndex(id) {
  return LEARNING_LEVELS.findIndex((l) => l.id === id);
}

export function isLessonUnlocked(lessonId, completedIds) {
  const idx = getLearningLevelIndex(lessonId);
  if (idx <= 0) return true;
  const prevId = LEARNING_LEVELS[idx - 1].id;
  return completedIds.includes(prevId);
}
