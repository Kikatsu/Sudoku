import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Crown,
  Eraser,
  Eye,
  EyeOff,
  HelpCircle,
  History,
  Infinity,
  Lightbulb,
  LogIn,
  Lock,
  Maximize2,
  Palette,
  Pencil,
  Play,
  Redo2,
  RefreshCw,
  Sparkles,
  Settings,
  Trophy,
  Undo2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createCoachStep, createLessonStep } from "./lib/coach.js";
import { pickBestCoachVoice } from "./lib/coachSpeech.js";
import { playGameSound } from "./lib/gameSounds.js";
import {
  computeProStatus,
  fetchRemoteHistory,
  gameToCloudBlob,
  hydrateGameFromCloud,
  mergeHistoryFromRemote,
  mergePreferencesWithRemote,
  mergeProfileForSync,
  mapProfileFromDb,
  profileToRemotePatch,
  upsertHistoryRecords,
} from "./lib/cloudSync.js";
import {
  HISTORY_PREVIEW_RECORD,
  appendToArchive,
  gameHasProgress,
  loadArchive,
  normalizeSelection,
  restoreGameFromRecord,
  saveArchive,
  sortRecords,
} from "./lib/gameHistory.js";
import { createPolarCheckoutSession } from "./lib/polarCheckout.js";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient.js";
import {
  DIFFICULTIES,
  GAME_RULES_VERSION,
  NUMBERS,
  canEnterSolutionNumber,
  createGame,
  createGameFromPuzzle,
  formatTime,
  getCandidates,
  getConflictIndices,
  getDateKey,
  getPeers,
  isSolved,
  normalizeNotes,
  sanitizeEditableValues,
} from "./lib/sudoku.js";
import {
  FAMOUS_PUZZLES,
  getFamousPuzzleById,
  loadFamousBests,
  recordFamousBest,
} from "./lib/famousPuzzles.js";
import { LEARNING_LEVELS, getLearningLevelById, isLessonUnlocked } from "./lib/learningLevels.js";
import {
  loadLearningProgress,
  markLessonCompleted,
  markLessonXpAwarded,
  saveLearningProgress,
} from "./lib/learningProgress.js";

const STORAGE_KEY = "sana-sudoku-state-v3";
const PROFILE_KEY = "sana-sudoku-profile-v1";
const PREFS_KEY = "sana-sudoku-preferences-v1";
const BRAND_NAME = "sudocore";
const BRAND_ICON_SRC = "/sudocore-icon.svg";

const DEFAULT_PREFS = {
  showFocusLens: true,
  soundEnabled: true,
  soundVolume: 0.75,
  boardSize: "standard",
  theme: "studio",
  language: "ru",
};

const BOARD_SIZES = [
  { key: "compact", labelKey: "boardCompact" },
  { key: "standard", labelKey: "boardStandard" },
  { key: "expanded", labelKey: "boardExpanded" },
];

const LANG_META = {
  ru: { label: "Русский", locale: "ru-RU", speech: "ru-RU" },
  en: { label: "English", locale: "en-US", speech: "en-US" },
  kk: { label: "Қазақша", locale: "kk-KZ", speech: "kk-KZ" },
};

const THEMES = [
  { key: "studio", label: "Logic Studio" },
  { key: "light", label: "White" },
  { key: "dark", label: "Black" },
  { key: "ocean", label: "Ocean" },
  { key: "sakura", label: "Sakura" },
];

const TRANSLATIONS = {
  ru: {
    tagline: "daily brain ritual",
    nav: {
      rules: "Правила",
      learn: "Обучение",
      pro: "Upgrade to Pro",
      signIn: "Войти",
      signOut: "Выйти",
      settings: "Настройки",
      history: "История",
      famous: "Знаменитые партии",
    },
    modes: {
      daily: "Сегодняшний ритуал",
      free: "Свободная тренировка",
      dailyTitle: "Daily Challenge",
      freeTitle: "режим",
    },
    stats: { time: "время", mistakes: "ошибки", hints: "подсказки", solved: "решено" },
    difficulties: {
      easy: "Легко",
      medium: "Средне",
      hard: "Сложно",
      expert: "Мастер",
      impossible: "Невозможно",
    },
    actions: {
      pencil: "Карандаш",
      erase: "Стереть",
      undo: "Отмена",
      redo: "Повтор",
      newGame: "Новая игра",
      play: "Играть",
      backToLessons: "К урокам",
      restartLesson: "Заново",
      apply: "Поставить число",
      proofShow: "Показать доказательство",
      proofHide: "Скрыть доказательство",
      close: "Закрыть",
    },
    panels: {
      daily: "Daily Challenge",
      filled: (filled) => `${filled} из 81 ячеек заполнено`,
      coach: "AI Coach",
      mentor: "Наставник",
      profile: "Профиль",
      leaderboard: "Городской топ",
      local: "local",
    },
    coach: {
      hint: "Подсказка",
      lesson: "Обучение",
      why: "Почему нельзя",
      empty:
        "Выберите ячейку или нажмите подсказку. Я объясню ход без спойлера всего решения.",
      mini: "Нажмите режим выше, и Coach найдет следующий обучающий шаг.",
      dailyReady: "Daily Challenge загружен. Начните с ячеек, где меньше всего вариантов.",
      freeReady: "Новая тренировка готова. Выберите клетку и держите ритм спокойно.",
      proof: "Доказательство",
      placed: "Поставил число в доказанную клетку.",
    },
    lens: {
      title: "Focus Lens",
      aria: "Фокус выбранной клетки",
      hide: "Скрыть Focus Lens",
      show: "Показать Focus Lens",
      fixed: "задана",
      entered: "введена",
      empty: "пустая",
      notes: "карандаш",
      number: "число",
      noCandidates: "нет кандидатов",
      currentNumber: (value) => `число ${value}`,
      context: "Контекст заполнения",
      candidates: "Кандидаты выбранной клетки",
    },
    settings: {
      title: "Настройки",
      eyebrow: "Studio controls",
      lens: "Focus Lens",
      lensCopy: "Показывать панель выбранной клетки возле доски.",
      sound: "Звук",
      soundCopy: "Мягкие игровые эффекты и озвучка AI Coach.",
      volume: "Громкость",
      boardSize: "Размер доски",
      boardSizeCopy: "Увеличьте игровое поле, но в аккуратных пределах.",
      boardCompact: "Компактно",
      boardStandard: "Обычно",
      boardExpanded: "Крупнее",
      theme: "Тема",
      language: "Язык",
    },
    history: {
      title: "История игр",
      eyebrow: "Архив партий",
      empty: "Здесь появятся завершённые партии и незавершённые, когда вы начнёте новую игру.",
      sortLabel: "Сортировка",
      sortDateNew: "Сначала новые",
      sortDateOld: "Сначала старые",
      sortTimeFast: "Быстрее по времени",
      sortTimeSlow: "Дольше по времени",
      sortMistakesLow: "Меньше ошибок ввода",
      sortMistakesHigh: "Больше ошибок ввода",
      won: "Победа",
      abandoned: "Не завершено",
      moves: "Вводы цифр",
      mistakes: "Ошибки (счётчик)",
      hints: "Подсказки",
      time: "Время партии",
      replay: "Повтор ходов",
      step: (n, max) => `Шаг ${n} / ${max}`,
      openGame: "Разбор",
      back: "Назад к списку",
      better: "Лучше:",
      wrongDigit: "Неверная цифра",
      erased: "Стерто",
      correct: "Верно",
      noWrongMoves: "Неверных вводов по сравнению с решением не было.",
      wrongSummary: (n) => `Неверных вводов: ${n}`,
      datePlayed: "Дата",
      outcome: "Итог",
      difficulty: "Сложность",
      filled: "Заполнено",
      clues: "Дано клеток",
      xp: "XP",
      previewTitle: "Пример: так будет выглядеть история",
      previewHint: "Демонстрация интерфейса. Настоящие партии появятся после игры.",
      sampleTag: "Пример",
      stepPrev: "Предыдущий шаг",
      stepNext: "Следующий шаг",
      colBoard: "Позиция",
      colWhen: "Дата",
      colOutcome: "Итог",
      colMode: "Режим / сложность",
      colTime: "Время",
      colMoves: "Вводы",
      colMistakes: "Ошибки",
      colHints: "Подсказки",
      colFilled: "Заполнено",
      colAction: "Действие",
      actionOpen: "Открыть",
      actionContinue: "Продолжить",
      actionAnalyze: "Анализ",
      analyzeTitle: "Разбор партии",
      finalBoard: "Финальная позиция",
      showDock: "Показать",
      hideDock: "Скрыть",
      emptyCompact: "Архив появится после первых партий.",
      savedCount: (count) => `${count} ${count === 1 ? "партия" : count >= 2 && count <= 4 ? "партии" : "партий"} сохранено`,
    },
    modals: {
      proEyebrow: "Подписка sudocore Pro",
      proTitle: "$2.99 в месяц",
      proCopy: "Безлимитные партии, полноценный AI Coach, глубокая статистика и ранний доступ к темам.",
      proTagline: "Тренируйтесь глубже: без лимитов, с полным тренером и понятной статистикой.",
      proPriceCaption: "Ежемесячно · отмена в любой момент",
      proFeaturesAria: "Что даёт подписка Pro",
      proFeatures: [
        {
          title: "Безлимитные партии",
          detail: "Неограниченно партий в ежедневном испытании и в свободной тренировке.",
        },
        { title: "Полный AI Coach", detail: "Подсказки, уроки и объяснения без урезаний." },
        { title: "Глубокая статистика", detail: "История партий и прогресс в деталях." },
        { title: "Ранний доступ к темам", detail: "Новые палитры раньше бесплатной версии." },
      ],
      proFeatureIncluded: "Уже в вашей подписке",
      proActive: "Подписка Pro активна.",
      proUntil: (date) => `До ${date}`,
      proBillingNote:
        "Оплата через Polar; вебхук на Vercel обновляет профиль в Supabase.",
      proSignIn: "Войдите в аккаунт, чтобы оформить Pro.",
      proCtaSignIn: "Войти и оформить Pro",
      polarBusy: "Открываем Polar…",
      polarFail: "Не удалось открыть оплату. Проверьте Vercel /api и секреты Polar.",
      proCta: "Оформить Pro",
      rulesTitle: "Правила судоку",
      rulesEyebrow: "Как играть",
      rules: [
        "Заполните пустые клетки цифрами от 1 до 9.",
        "В каждой строке каждая цифра может встречаться только один раз.",
        "В каждом столбце каждая цифра может встречаться только один раз.",
        "В каждом квадрате 3x3 каждая цифра тоже встречается только один раз.",
        "Красная подсветка показывает конфликт. Карандаш помогает ставить маленькие заметки.",
        "Победа засчитывается только когда вся доска заполнена и все правила выполнены.",
      ],
      victory: "Победа",
      solved: "Решено",
      solvedSubtitle: "Уникальное решение найдено",
    },
    toasts: {
      selectCell: "Сначала выберите ячейку.",
      signedOut: "Вы вышли.",
      signedIn: "Вы вошли. Прогресс сохраняется в облаке.",
      wrongEntry: "Это число не подходит сюда. Доска осталась без изменений.",
      solved: (xp) => `Решено: +${xp} XP. Отличный ритм.`,
      solvedReplay: "Сетка решена. XP за эту партию уже был начислен.",
      learningXp: (xp) => `Урок: +${xp} XP за чистое решение.`,
      learningNoXp: "Урок пройден без XP — использовалась помощь Coach.",
    },
    aria: {
      nav: "Главная навигация",
      game: "Игровая зона",
      stats: "Статистика партии",
      difficulty: "Выбор сложности",
      board: "Судоку 9 на 9",
      numbers: "Ввод чисел",
      tools: "Инструменты",
      side: "Прогресс и помощник",
      coachMode: "Режим AI Coach",
      learnNav: "Обучение",
      cell: (index, value) => (value ? `Ячейка ${index + 1}, число ${value}` : `Ячейка ${index + 1}, пусто`),
    },
    learning: {
      eyebrow: "Тропа обучения",
      title: "Уроки судоку",
      lead: "Проходите уровни по порядку. Чистое решение — без подсказок и без хода «Поставить» от Coach — приносит XP.",
      tierBeginner: "Начальный",
      tierPractice: "Практика",
      tierChallenge: "Вызов",
      locked: "Сначала пройдите предыдущий урок.",
      completed: "Пройдено",
      cleanBonus: "Чисто — XP",
      cluesShort: (n) => `${n} дано`,
      homeBack: "К игре",
      back: "Назад к урокам",
      ariaPage: "Каталог обучения",
      ariaCard: (title) => `Урок: ${title}`,
      lessonEyebrow: "Урок",
    },
    famous: {
      eyebrow: "Знаменитые судоку",
      title: "Партии, вошедшие в историю",
      lead: "Соберите подборку партий, которыми зачитывались газеты и форумы. Историческая хроника, ваше лучшее время и кнопка «Играть» — без рандома, та самая сетка.",
      back: "Вернуться к игре",
      cluesShort: (n) => `${n} подсказок`,
      year: "Год",
      setter: "Автор",
      historyTitle: "Хроника",
      yourBest: "Ваш рекорд",
      noBest: "Ещё не пройдено",
      bestSummary: (mistakes, hints) => `ошибок: ${mistakes}, подсказок: ${hints}`,
      play: "Играть эту партию",
      replay: "Переиграть",
      ariaPage: "Знаменитые партии",
      ariaCard: (name) => `Партия ${name}`,
      timeLabel: "за",
      empty: "—",
    },
    auth: {
      title: "Аккаунт",
      eyebrow: "sudocore",
      sceneBadge: "Сетка 9×9 — тот же спокойный ритм, что и в партии",
      lead: "Войдите или создайте аккаунт, чтобы сохранить прогресс и синхронизировать данные.",
      signInTab: "Вход",
      signUpTab: "Регистрация",
      email: "Email",
      password: "Пароль",
      submitSignIn: "Войти",
      submitSignUp: "Создать аккаунт",
      footnote: "Аккаунт и прогресс синхронизируются с Supabase.",
      back: "Вернуться к игре",
      error: "Не удалось войти. Проверьте email и пароль.",
      busy: "Подождите…",
      signUpConfirm: "Аккаунт создан. Подтвердите email, если это требуется в проекте.",
      needCloud: "Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY в .env",
    },
  },
  en: {
    tagline: "daily brain ritual",
    nav: { rules: "Rules", learn: "Learn", pro: "Upgrade to Pro", signIn: "Sign in", signOut: "Sign out", settings: "Settings", history: "History", famous: "Famous puzzles" },
    modes: { daily: "Today's ritual", free: "Free training", dailyTitle: "Daily Challenge", freeTitle: "mode" },
    stats: { time: "time", mistakes: "mistakes", hints: "hints", solved: "solved" },
    difficulties: { easy: "Easy", medium: "Medium", hard: "Hard", expert: "Master", impossible: "Impossible" },
    actions: { pencil: "Pencil", erase: "Erase", undo: "Undo", redo: "Redo", newGame: "New game", play: "Play", backToLessons: "Back to lessons", restartLesson: "Restart", apply: "Place number", proofShow: "Show proof", proofHide: "Hide proof", close: "Close" },
    panels: { daily: "Daily Challenge", filled: (filled) => `${filled} of 81 cells filled`, coach: "AI Coach", mentor: "Mentor", profile: "Profile", leaderboard: "City board", local: "local" },
    coach: { hint: "Hint", lesson: "Lesson", why: "Why not", empty: "Choose a cell or ask for a hint. I will explain the move without spoiling the whole solution.", mini: "Choose a mode above and Coach will find the next learning step.", dailyReady: "Daily Challenge loaded. Start with cells that have the fewest options.", freeReady: "New training board is ready. Pick a cell and keep a calm rhythm.", proof: "Proof", placed: "Placed the proven number." },
    lens: { title: "Focus Lens", aria: "Selected cell focus", hide: "Hide Focus Lens", show: "Show Focus Lens", fixed: "given", entered: "entered", empty: "empty", notes: "pencil", number: "number", noCandidates: "no candidates", currentNumber: (value) => `number ${value}`, context: "Fill context", candidates: "Selected cell candidates" },
    settings: { title: "Settings", eyebrow: "Studio controls", lens: "Focus Lens", lensCopy: "Show the selected-cell panel beside the board.", sound: "Sound", soundCopy: "Soft game feedback plus AI Coach voice.", volume: "Volume", boardSize: "Board size", boardSizeCopy: "Make the puzzle roomier without letting it overtake the screen.", boardCompact: "Compact", boardStandard: "Standard", boardExpanded: "Expanded", theme: "Theme", language: "Language" },
    history: {
      title: "Game history",
      eyebrow: "Your archive",
      empty: "Finished games appear here. If you start a new game while one is in progress, the old board is saved as unfinished.",
      sortLabel: "Sort",
      sortDateNew: "Newest first",
      sortDateOld: "Oldest first",
      sortTimeFast: "Fastest time",
      sortTimeSlow: "Longest time",
      sortMistakesLow: "Fewest wrong entries",
      sortMistakesHigh: "Most wrong entries",
      won: "Won",
      abandoned: "Unfinished",
      moves: "Digit entries",
      mistakes: "Mistakes (counter)",
      hints: "Hints",
      time: "Time",
      replay: "Replay",
      step: (n, max) => `Step ${n} / ${max}`,
      openGame: "Review",
      back: "Back to list",
      better: "Better:",
      wrongDigit: "Wrong digit",
      erased: "Erased",
      correct: "Correct",
      noWrongMoves: "No wrong placements vs the solution.",
      wrongSummary: (n) => `Wrong placements: ${n}`,
      datePlayed: "Played",
      outcome: "Outcome",
      difficulty: "Difficulty",
      filled: "Filled",
      clues: "Givens",
      xp: "XP",
      previewTitle: "Example: how history will look",
      previewHint: "This is a demo layout. Your real games show up after you play.",
      sampleTag: "Sample",
      stepPrev: "Previous step",
      stepNext: "Next step",
      colBoard: "Board",
      colWhen: "Date",
      colOutcome: "Result",
      colMode: "Mode / difficulty",
      colTime: "Time",
      colMoves: "Entries",
      colMistakes: "Mistakes",
      colHints: "Hints",
      colFilled: "Filled",
      colAction: "Action",
      actionOpen: "Open",
      actionContinue: "Continue",
      actionAnalyze: "Analyze",
      analyzeTitle: "Game analysis",
      finalBoard: "Final board",
      showDock: "Show",
      hideDock: "Hide",
      emptyCompact: "Your archive appears after the first saved games.",
      savedCount: (count) => `${count} saved ${count === 1 ? "game" : "games"}`,
    },
    modals: {
      proEyebrow: "sudocore Pro",
      proTitle: "$2.99 per month",
      proCopy: "Unlimited games, full AI Coach, deeper stats, and early access to themes.",
      proTagline: "Train without limits — full coach, history, and themes in one calm upgrade.",
      proPriceCaption: "Billed monthly · cancel anytime",
      proFeaturesAria: "What you get with sudocore Pro",
      proFeatures: [
        { title: "Unlimited games", detail: "Play as many daily and free boards as you like." },
        { title: "Full AI Coach", detail: "Hints, lessons, and explanations without cut-down modes." },
        { title: "Deeper stats", detail: "Rich history and progress signals across sessions." },
        { title: "Early themes", detail: "New palettes land here before the free tier." },
      ],
      proFeatureIncluded: "Included with your membership",
      proActive: "sudocore Pro is active.",
      proUntil: (date) => `Until ${date}`,
      proBillingNote:
        "Checkout runs on Polar; the Vercel webhook updates your Supabase profile.",
      proSignIn: "Sign in to subscribe to Pro.",
      proCtaSignIn: "Sign in to subscribe",
      polarBusy: "Opening Polar…",
      polarFail: "Checkout could not start. Deploy to Vercel, set env vars, and try `vercel dev` locally.",
      proCta: "Subscribe to Pro",
      rulesTitle: "Sudoku rules",
      rulesEyebrow: "How to play",
      rules: [
        "Fill empty cells with numbers from 1 to 9.",
        "Each number can appear only once in every row.",
        "Each number can appear only once in every column.",
        "Each 3x3 box also contains each number only once.",
        "Red highlighting shows a conflict. Pencil mode lets you add small notes.",
        "A win counts only when the whole board is filled and every rule is satisfied.",
      ],
      victory: "Victory",
      solved: "Solved",
      solvedSubtitle: "Unique solution found",
    },
    toasts: { selectCell: "Choose a cell first.", signedOut: "You signed out.", signedIn: "Signed in. Your progress syncs to the cloud.", wrongEntry: "That number does not fit there. The board stayed unchanged.", solved: (xp) => `Solved: +${xp} XP. Great rhythm.`, solvedReplay: "Grid solved — XP for this game was already awarded.", learningXp: (xp) => `Lesson: +${xp} XP for a clean solve.`, learningNoXp: "Lesson cleared — no XP because Coach help was used." },
    aria: { nav: "Main navigation", game: "Game area", stats: "Game stats", difficulty: "Difficulty selector", board: "9 by 9 Sudoku", numbers: "Number input", tools: "Tools", side: "Progress and coach", coachMode: "AI Coach mode", learnNav: "Learning path", cell: (index, value) => (value ? `Cell ${index + 1}, number ${value}` : `Cell ${index + 1}, empty`) },
    learning: {
      eyebrow: "Learning path",
      title: "Sudoku lessons",
      lead: "Unlock levels in order. A clean solve — no hints and no Coach “Place” move — earns XP.",
      tierBeginner: "Beginner",
      tierPractice: "Practice",
      tierChallenge: "Challenge",
      locked: "Finish the previous lesson first.",
      completed: "Done",
      cleanBonus: "Clean — XP",
      cluesShort: (n) => `${n} givens`,
      homeBack: "Back to game",
      back: "Back to lessons",
      ariaPage: "Lesson catalog",
      ariaCard: (title) => `Lesson: ${title}`,
      lessonEyebrow: "Lesson",
    },
    famous: {
      eyebrow: "Famous sudoku",
      title: "Puzzles that made history",
      lead: "A small museum of the boards newspapers and forums could not stop talking about. Story, your personal best, and a Play button \u2014 the same grid, no random seed.",
      back: "Back to game",
      cluesShort: (n) => `${n} clues`,
      year: "Year",
      setter: "Setter",
      historyTitle: "Notable moments",
      yourBest: "Your best",
      noBest: "Not yet completed",
      bestSummary: (mistakes, hints) => `mistakes: ${mistakes}, hints: ${hints}`,
      play: "Play this puzzle",
      replay: "Play again",
      ariaPage: "Famous puzzles",
      ariaCard: (name) => `Puzzle ${name}`,
      timeLabel: "in",
      empty: "\u2014",
    },
    auth: {
      title: "Account",
      eyebrow: "sudocore",
      sceneBadge: "9×9 grid — the same calm rhythm as play",
      lead: "Sign in or sign up to save progress and sync across devices.",
      signInTab: "Sign in",
      signUpTab: "Sign up",
      email: "Email",
      password: "Password",
      submitSignIn: "Sign in",
      submitSignUp: "Create account",
      footnote: "Your account and saves sync through Supabase.",
      back: "Back to game",
      error: "Sign-in failed. Check your email and password.",
      busy: "Please wait…",
      signUpConfirm: "Account created. Confirm your email if your project requires it.",
      needCloud: "Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your .env file.",
    },
  },
  kk: {
    tagline: "күнделікті логика рәсімі",
    nav: { rules: "Ереже", learn: "Оқу", pro: "Pro-ға өту", signIn: "Кіру", signOut: "Шығу", settings: "Баптаулар", history: "Тарих", famous: "Атақты тақырыптар" },
    modes: { daily: "Бүгінгі рәсім", free: "Еркін жаттығу", dailyTitle: "Күндік сынақ", freeTitle: "режим" },
    stats: { time: "уақыт", mistakes: "қате", hints: "кеңес", solved: "шешілді" },
    difficulties: { easy: "Жеңіл", medium: "Орташа", hard: "Қиын", expert: "Шебер", impossible: "Мүмкін емес" },
    actions: { pencil: "Қарындаш", erase: "Өшіру", undo: "Қайтару", redo: "Қайталау", newGame: "Жаңа ойын", play: "Ойнау", backToLessons: "Сабақтарға", restartLesson: "Қайта бастау", apply: "Санды қою", proofShow: "Дәлелді көрсету", proofHide: "Дәлелді жасыру", close: "Жабу" },
    panels: { daily: "Күндік сынақ", filled: (filled) => `${filled}/81 ұяшық толды`, coach: "AI Coach", mentor: "Тәлімгер", profile: "Профиль", leaderboard: "Қала рейтингі", local: "жергілікті" },
    coach: { hint: "Кеңес", lesson: "Сабақ", why: "Неге болмайды", empty: "Ұяшық таңдаңыз немесе кеңес сұраңыз. Мен толық шешімді ашпай, жүрісті түсіндіремін.", mini: "Жоғарыдан режим таңдаңыз, Coach келесі оқу қадамын табады.", dailyReady: "Күндік сынақ жүктелді. Ең аз нұсқасы бар ұяшықтардан бастаңыз.", freeReady: "Жаңа жаттығу дайын. Ұяшық таңдап, сабырлы ырғақ ұстаңыз.", proof: "Дәлел", placed: "Дәлелденген сан қойылды." },
    lens: { title: "Focus Lens", aria: "Таңдалған ұяшық фокусы", hide: "Focus Lens жасыру", show: "Focus Lens көрсету", fixed: "берілген", entered: "енгізілді", empty: "бос", notes: "қарындаш", number: "сан", noCandidates: "үміткер жоқ", currentNumber: (value) => `${value} саны`, context: "Толу контексті", candidates: "Таңдалған ұяшық үміткерлері" },
    settings: { title: "Баптаулар", eyebrow: "Studio controls", lens: "Focus Lens", lensCopy: "Тақтаның жанында таңдалған ұяшық панелін көрсету.", sound: "Дыбыс", soundCopy: "Жұмсақ ойын әсерлері және AI Coach дауысы.", volume: "Дыбыс", boardSize: "Тақта өлшемі", boardSizeCopy: "Тақтаны сәл үлкейтіңіз, бірақ экранды басып кетпесін.", boardCompact: "Ықшам", boardStandard: "Қалыпты", boardExpanded: "Үлкенірек", theme: "Тақырып", language: "Тіл" },
    history: {
      title: "Ойын тарихы",
      eyebrow: "Партиялар мұрағаты",
      empty: "Аяқталған партиялар осында пайда болады. Ойын ортасында жаңасын бастасаңыз, ескі тақта «аяқталмаған» ретінде сақталады.",
      sortLabel: "Сұрыптау",
      sortDateNew: "Алдымен жаңалары",
      sortDateOld: "Алдымен ескілері",
      sortTimeFast: "Уақыт бойынша жылдам",
      sortTimeSlow: "Уақыт бойынша ұзақ",
      sortMistakesLow: "Қате енгізулер аз",
      sortMistakesHigh: "Қате енгізулер көп",
      won: "Жеңіс",
      abandoned: "Аяқталмады",
      moves: "Сан енгізулері",
      mistakes: "Қателер (есептеу)",
      hints: "Кеңестер",
      time: "Уақыт",
      replay: "Қайталау",
      step: (n, max) => `Қадам ${n} / ${max}`,
      openGame: "Талдау",
      back: "Тізімге оралу",
      better: "Дұрысы:",
      wrongDigit: "Қате сан",
      erased: "Өшірілді",
      correct: "Дұрыс",
      noWrongMoves: "Шешіммен салыстырғанда қате енгізулер жоқ.",
      wrongSummary: (n) => `Қате енгізулер: ${n}`,
      datePlayed: "Күні",
      outcome: "Нәтиже",
      difficulty: "Қиындық",
      filled: "Толдырылды",
      clues: "Берілген ұяшық",
      xp: "XP",
      previewTitle: "Мысал: тарих осындай көрінеді",
      previewHint: "Интерфейстің демосы. Шынайы партиялар ойнағаннан кейін пайда болады.",
      sampleTag: "Мысал",
      stepPrev: "Алдыңғы қадам",
      stepNext: "Келесі қадам",
      colBoard: "Тақта",
      colWhen: "Күні",
      colOutcome: "Нәтиже",
      colMode: "Режим / қиындық",
      colTime: "Уақыт",
      colMoves: "Енгізулер",
      colMistakes: "Қателер",
      colHints: "Кеңестер",
      colFilled: "Толдырылды",
      colAction: "Әрекет",
      actionOpen: "Ашу",
      actionContinue: "Жалғастыру",
      actionAnalyze: "Талдау",
      analyzeTitle: "Ойын талдауы",
      finalBoard: "Соңғы қалып",
      showDock: "Көрсету",
      hideDock: "Жасыру",
      emptyCompact: "Мұрағат алғашқы ойындардан кейін көрінеді.",
      savedCount: (count) => `${count} ойын сақталды`,
    },
    modals: {
      proEyebrow: "sudocore Pro жазылымы",
      proTitle: "Айына $2.99",
      proCopy: "Шексіз ойындар, толық AI Coach, терең статистика және тақырыптарға ерте қолжетімділік.",
      proTagline: "Шектеусіз жаттығыңыз — толық көмекші, тарих пен темалар бір жаңартуда.",
      proPriceCaption: "Ай сайын · кез келген уақытта бас тартуға болады",
      proFeaturesAria: "Pro жазылымында не бар",
      proFeatures: [
        { title: "Шексіз ойындар", detail: "Күндік сынақ пен еркін жаттығуда қалағанынша ойнаңыз." },
        { title: "Толық AI Coach", detail: "Кеңестер, сабақтар және түсіндірмелер толық көлемде." },
        { title: "Терең статистика", detail: "Партиялар тарихы және прогресс толық көрінісі." },
        { title: "Темаларға ерте қолжетімділік", detail: "Жаңа палитралар тегін нұсқадан бұрын осында." },
      ],
      proFeatureIncluded: "Жазылымыңызға кіреді",
      proActive: "Pro жазылымы белсенді.",
      proUntil: (date) => `${date} дейін`,
      proBillingNote:
        "Төлем Polar арқылы; Vercel вебхукі Supabase профилін жаңартады.",
      proSignIn: "Pro үшін алдымен аккаунтқа кіріңіз.",
      proCtaSignIn: "Кіріп, Pro-ға жазылу",
      polarBusy: "Polar ашылады…",
      polarFail: "Төлемді бастау сәтсіз. Vercel /api және Polar ортасын тексеріңіз.",
      proCta: "Pro-ға жазылу",
      rulesTitle: "Судоку ережелері",
      rulesEyebrow: "Қалай ойнау керек",
      rules: [
        "Бос ұяшықтарды 1-ден 9-ға дейінгі сандармен толтырыңыз.",
        "Әр қатарда әр сан бір рет қана кездеседі.",
        "Әр бағанда әр сан бір рет қана кездеседі.",
        "Әр 3x3 шаршыда да әр сан бір рет қана болады.",
        "Қызыл белгі қақтығысты көрсетеді. Қарындаш режимі шағын ескертпе қоюға көмектеседі.",
        "Жеңіс тақта толық толып, барлық ереже орындалғанда ғана есептеледі.",
      ],
      victory: "Жеңіс",
      solved: "Шешілді",
      solvedSubtitle: "Бірегей шешім табылды",
    },
    toasts: { selectCell: "Алдымен ұяшық таңдаңыз.", signedOut: "Шықтыңыз.", signedIn: "Кірдіңіз. Прогресс бұлтта сақталады.", wrongEntry: "Бұл сан бұл жерге келмейді. Тақта өзгеріссіз қалды.", solved: (xp) => `Шешілді: +${xp} XP. Керемет ырғақ.`, solvedReplay: "Тор шешілген — осы ойын үшін XP қосылған.", learningXp: (xp) => `Сабақ: таза шешу үшін +${xp} XP.`, learningNoXp: "Сабақ аяқталды — Coach көмегі болғандықтан XP жоқ." },
    aria: { nav: "Негізгі навигация", game: "Ойын аймағы", stats: "Ойын статистикасы", difficulty: "Қиындық таңдау", board: "9 да 9 судоку", numbers: "Сан енгізу", tools: "Құралдар", side: "Прогресс және көмекші", coachMode: "AI Coach режимі", learnNav: "Оқу жолы", cell: (index, value) => (value ? `${index + 1}-ұяшық, ${value} саны` : `${index + 1}-ұяшық, бос`) },
    learning: {
      eyebrow: "Оқу жолы",
      title: "Судоку сабақтары",
      lead: "Деңгейлерді ретімен ашыңыз. Таза шешу — кеңессіз және Coach «Қою» жүрісіз — XP береді.",
      tierBeginner: "Бастапқы",
      tierPractice: "Жаттығу",
      tierChallenge: "Сынақ",
      locked: "Алдымен алдыңғы сабақты аяқтаңыз.",
      completed: "Аяқталды",
      cleanBonus: "Таза — XP",
      cluesShort: (n) => `${n} берілді`,
      homeBack: "Ойынға оралу",
      back: "Сабақтарға оралу",
      ariaPage: "Сабақтар каталогы",
      ariaCard: (title) => `Сабақ: ${title}`,
      lessonEyebrow: "Сабақ",
    },
    famous: {
      eyebrow: "Атақты судоку",
      title: "Тарихқа енген тақырыптар",
      lead: "Газеттер мен форумдар тоқтаусыз талқылаған торлардың шағын мұражайы. Тарихи хроника, жеке рекордыңыз және «Ойнау» түймесі — кездейсоқ емес, нақ сол тор.",
      back: "Ойынға оралу",
      cluesShort: (n) => `${n} кеңес`,
      year: "Жыл",
      setter: "Авторы",
      historyTitle: "Хроника",
      yourBest: "Жеке рекорд",
      noBest: "Әлі шешілмеген",
      bestSummary: (mistakes, hints) => `қателер: ${mistakes}, кеңестер: ${hints}`,
      play: "Осы тақырыпты ойнау",
      replay: "Қайта ойнау",
      ariaPage: "Атақты тақырыптар",
      ariaCard: (name) => `${name} тақырыбы`,
      timeLabel: "·",
      empty: "—",
    },
    auth: {
      title: "Аккаунт",
      eyebrow: "sudocore",
      sceneBadge: "9×9 тор — ойындағыдай тыныш ырғақ",
      lead: "Кіріңіз немесе тіркеліңіз — прогресті сақтау және деректерді синхрондау үшін.",
      signInTab: "Кіру",
      signUpTab: "Тіркелу",
      email: "Email",
      password: "Құпия сөз",
      submitSignIn: "Кіру",
      submitSignUp: "Аккаунт жасау",
      footnote: "Аккаунт пен прогресс Supabase арқылы синхрондалады.",
      back: "Ойынға оралу",
      error: "Кіру сәтсіз. Email мен құпия сөзді тексеріңіз.",
      busy: "Күте тұрыңыз…",
      signUpConfirm: "Аккаунт жасалды. Жоба қажет етсе, email растаңыз.",
      needCloud: ".env файлына VITE_SUPABASE_URL және VITE_SUPABASE_PUBLISHABLE_KEY қосыңыз.",
    },
  },
};

const LEVELS = [
  { name: "Новичок", min: 0 },
  { name: "Тактик", min: 120 },
  { name: "Мастер", min: 360 },
  { name: "Легенда", min: 760 },
  { name: "Гроссмейстер", min: 1300 },
];

const DEMO_LEADERS = [
  { name: "Aruzhan", city: "Алматы", seconds: 212 },
  { name: "Timur", city: "Алматы", seconds: 248 },
  { name: "Dana", city: "Алматы", seconds: 302 },
  { name: "Miras", city: "Алматы", seconds: 391 },
];

const EMPTY_PROFILE = {
  name: "Гость",
  xp: 0,
  streak: 0,
  lastPlayed: null,
  solved: 0,
  badges: [],
  dailyResults: {},
  famousBests: {},
  subscriptionTier: "free",
  proExpiresAt: null,
};

function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved.rulesVersion !== GAME_RULES_VERSION) return null;
    if (!saved.generator?.unique) return null;
    if (!Array.isArray(saved.values) || saved.values.length !== 81) return null;
    if (!Array.isArray(saved.puzzle) || saved.puzzle.length !== 81) return null;
    if (!Array.isArray(saved.solution) || saved.solution.length !== 81) return null;
    const fixed =
      Array.isArray(saved.fixed) && saved.fixed.length === 81 ? saved.fixed : saved.puzzle.map(Boolean);
    let clueOk = true;
    for (let i = 0; i < 81; i += 1) {
      if (saved.puzzle[i] && saved.puzzle[i] !== saved.solution?.[i]) {
        clueOk = false;
        break;
      }
    }
    if (!clueOk) return null;

    const sanitized = sanitizeEditableValues(saved.values, fixed, saved.solution);
    const repaired = new Set(sanitized.repairedIndices);
    const notes = normalizeNotes(saved.notes).map((note, index) => (repaired.has(index) ? [] : note));

    return {
      ...saved,
      fixed,
      values: sanitized.values,
      selected: normalizeSelection(saved.selected, sanitized.values, fixed),
      startedAt: Date.now(),
      notes,
      hintCells: saved.hintCells || [],
      history: saved.history || [],
      future: saved.future || [],
      awardXp: saved.awardXp || 0,
      suppressVictoryRewards: Boolean(saved.suppressVictoryRewards),
      learningLevelId: saved.learningLevelId,
      learningCleanEligible:
        saved.mode === "learning" ? saved.learningCleanEligible !== false : saved.learningCleanEligible,
    };
  } catch {
    return null;
  }
}

function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    const merged = { ...EMPTY_PROFILE, ...saved };
    if (!merged.famousBests || typeof merged.famousBests !== "object") {
      merged.famousBests = {};
    }
    const localBests = loadFamousBests();
    if (localBests && Object.keys(localBests).length) {
      merged.famousBests = { ...localBests, ...merged.famousBests };
      for (const [id, entry] of Object.entries(localBests)) {
        const cur = merged.famousBests[id];
        if (!cur || (entry?.seconds != null && entry.seconds < cur.seconds)) {
          merged.famousBests[id] = entry;
        }
      }
    }
    return merged;
  } catch {
    return EMPTY_PROFILE;
  }
}

function loadPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    return normalizePreferences(saved);
  } catch {
    return DEFAULT_PREFS;
  }
}

function normalizePreferences(preferences = {}) {
  return {
    ...DEFAULT_PREFS,
    ...preferences,
    soundVolume: clampVolume(preferences.soundVolume ?? DEFAULT_PREFS.soundVolume),
    boardSize: BOARD_SIZES.some((size) => size.key === preferences.boardSize)
      ? preferences.boardSize
      : DEFAULT_PREFS.boardSize,
    theme: THEMES.some((theme) => theme.key === preferences.theme) ? preferences.theme : DEFAULT_PREFS.theme,
    language: TRANSLATIONS[preferences.language] ? preferences.language : DEFAULT_PREFS.language,
  };
}

function clampVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_PREFS.soundVolume;
  return Math.max(0, Math.min(1, number));
}

function getElapsed(game, now = Date.now()) {
  if (game.completed) return game.elapsedBefore;
  return game.elapsedBefore + Math.floor((now - game.startedAt) / 1000);
}

function saveGame(game) {
  const data = {
    ...game,
    elapsedBefore: getElapsed(game),
    startedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getLevel(xp) {
  return LEVELS.reduce((current, level) => (xp >= level.min ? level : current), LEVELS[0]);
}

function getNextLevel(xp) {
  return LEVELS.find((level) => level.min > xp) || LEVELS[LEVELS.length - 1];
}

function makeSnapshot(game) {
  const snap = {
    values: [...game.values],
    notes: game.notes.map((note) => [...note]),
    mistakes: game.mistakes,
    hintsUsed: game.hintsUsed,
    lastNumber: game.lastNumber,
    hintCells: [...game.hintCells],
  };
  if (game.mode === "learning") {
    snap.learningCleanEligible = game.learningCleanEligible !== false;
  }
  return snap;
}

function restoreSnapshot(game, snapshot) {
  return {
    ...game,
    values: [...snapshot.values],
    notes: snapshot.notes.map((note) => [...note]),
    mistakes: snapshot.mistakes,
    hintsUsed: snapshot.hintsUsed,
    lastNumber: snapshot.lastNumber,
    hintCells: [...snapshot.hintCells],
    learningCleanEligible:
      snapshot.learningCleanEligible !== undefined
        ? snapshot.learningCleanEligible
        : game.learningCleanEligible,
  };
}

function withHistory(game) {
  return {
    ...game,
    history: [...game.history.slice(-119), makeSnapshot(game)],
    future: [],
  };
}

function parseAppRoute() {
  let path = window.location.hash.slice(1) || "/";
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  if (path === "/sign-in") return { kind: "sign-in", lessonId: null };
  if (path === "/famous") return { kind: "famous", lessonId: null };
  if (path === "/learn") return { kind: "learn", lessonId: null };
  if (path.startsWith("/learn/")) {
    const rest = path.slice("/learn/".length);
    if (rest) return { kind: "learn", lessonId: decodeURIComponent(rest) };
  }
  return { kind: "home", lessonId: null };
}

/** Classic 9×9 opening — decoration only (not an active puzzle). */
const AUTH_DECOR_GRID = [
  5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0, 0, 0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0, 0, 0, 2, 8, 0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9,
];

const AUTH_FLOAT_DIGITS = [
  { n: 7, className: "auth-scene__chip--a" },
  { n: 2, className: "auth-scene__chip--b" },
  { n: 9, className: "auth-scene__chip--c" },
  { n: 4, className: "auth-scene__chip--d" },
  { n: 1, className: "auth-scene__chip--e" },
];

function Brand({ tagline }) {
  return (
    <a className="brand" href="#/" aria-label={BRAND_NAME}>
      <span className="brand-mark" aria-hidden="true">
        <img src={BRAND_ICON_SRC} alt="" />
      </span>
      <span>
        <strong>{BRAND_NAME}</strong>
        <small>{tagline}</small>
      </span>
    </a>
  );
}

function AuthMiniSudoku() {
  return (
    <div className="auth-mini-sudoku">
      {AUTH_DECOR_GRID.map((value, i) => {
        const row = Math.floor(i / 9);
        const col = i % 9;
        const thickR = col === 2 || col === 5;
        const thickB = row === 2 || row === 5;
        const pulse = i === 40;
        return (
          <span
            key={i}
            className={[
              "auth-mini-cell",
              value ? "auth-mini-cell--given" : "auth-mini-cell--empty",
              thickR ? "auth-mini-cell--thick-r" : "",
              thickB ? "auth-mini-cell--thick-b" : "",
              pulse ? "auth-mini-cell--pulse" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {value > 0 ? value : null}
          </span>
        );
      })}
    </div>
  );
}

function AuthPage({ labels, brandTagline, navAria, onBack, cloudAvailable, onSignedIn }) {
  const [mode, setMode] = useState("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!cloudAvailable || !supabase) {
      setError(labels.needCloud);
      return;
    }
    const form = event.currentTarget;
    const email = String(form.email?.value || "").trim();
    const password = String(form.password?.value || "");
    if (!email || !password) {
      setError(labels.error);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signErr) throw signErr;
        onSignedIn?.();
        onBack();
      } else {
        const { data, error: signErr } = await supabase.auth.signUp({ email, password });
        if (signErr) throw signErr;
        if (data.session) {
          onSignedIn?.();
          onBack();
        } else {
          onSignedIn?.(labels.signUpConfirm);
        }
      }
    } catch (e) {
      setError(e?.message || labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="topbar" aria-label={navAria}>
        <Brand tagline={brandTagline} />
        <button className="mini-button icon-button" type="button" onClick={onBack}>
          <ArrowLeft size={17} aria-hidden="true" />
          {labels.back}
        </button>
      </header>
      <div className="auth-page">
        <div className="auth-layout">
          <div className="auth-scene">
            <div className="auth-scene__mesh" aria-hidden="true" />
            <div className="auth-scene__grid-pattern" aria-hidden="true" />
            <div className="auth-scene__chips" aria-hidden="true">
              {AUTH_FLOAT_DIGITS.map(({ n, className }) => (
                <span key={className} className={`auth-scene__chip ${className}`}>
                  {n}
                </span>
              ))}
            </div>
            <div className="auth-scene__stage">
              <div aria-hidden="true">
                <AuthMiniSudoku />
              </div>
              <p className="auth-scene__badge">{labels.sceneBadge}</p>
            </div>
          </div>
          <div className="auth-panel">
            <article className="auth-card">
              <p className="eyebrow">{labels.eyebrow}</p>
              <h1>{labels.title}</h1>
              <p className="auth-lead">{labels.lead}</p>
              <div className="auth-tabs" role="tablist" aria-label={labels.title}>
                <button
                  className={mode === "signin" ? "active" : ""}
                  type="button"
                  role="tab"
                  aria-selected={mode === "signin"}
                  onClick={() => setMode("signin")}
                >
                  {labels.signInTab}
                </button>
                <button
                  className={mode === "signup" ? "active" : ""}
                  type="button"
                  role="tab"
                  aria-selected={mode === "signup"}
                  onClick={() => setMode("signup")}
                >
                  {labels.signUpTab}
                </button>
              </div>
              <form className="auth-form" onSubmit={handleSubmit}>
                <label className="auth-field">
                  <span>{labels.email}</span>
                  <input name="email" type="email" autoComplete="email" placeholder="you@example.com" disabled={busy} />
                </label>
                <label className="auth-field">
                  <span>{labels.password}</span>
                  <input
                    name="password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    disabled={busy}
                  />
                </label>
                {error ? (
                  <p className="auth-error" role="alert">
                    {error}
                  </p>
                ) : null}
                <button className="auth-submit" type="submit" disabled={busy}>
                  {busy ? labels.busy : mode === "signin" ? labels.submitSignIn : labels.submitSignUp}
                </button>
              </form>
              <p className="auth-foot">{labels.footnote}</p>
            </article>
          </div>
        </div>
      </div>
    </>
  );
}

export function createInitialGame(route = { kind: "home", lessonId: null }, loaded = null) {
  if (route.kind === "learn" && route.lessonId) {
    const def = getLearningLevelById(route.lessonId);
    if (def) return createGame(def.difficulty, "learning", { learningLevelId: route.lessonId });
  }
  if (loaded) return loaded;
  return createGame("easy", "free");
}

function App() {
  const [game, setGame] = useState(() => createInitialGame(parseAppRoute(), loadGame()));
  const [profile, setProfile] = useState(loadProfile);
  const [preferences, setPreferences] = useState(loadPreferences);
  const [coachMessage, setCoachMessageState] = useState(null);
  const [coachMode, setCoachMode] = useState("hint");
  const [coachStep, setCoachStep] = useState(null);
  const [proofVisible, setProofVisible] = useState(false);
  const [toast, setToast] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [historyRecords, setHistoryRecords] = useState(() => loadArchive());
  const [historySort, setHistorySort] = useState("dateNew");
  const [historyDockOpen, setHistoryDockOpen] = useState(false);
  const [historyAnalysisRecord, setHistoryAnalysisRecord] = useState(null);
  const [lockedCell, setLockedCell] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [hashRoute, setHashRoute] = useState(() => parseAppRoute());
  const gameRef = useRef(game);
  gameRef.current = game;
  const keyboardRef = useRef(null);
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [proBusy, setProBusy] = useState(false);

  const t = TRANSLATIONS[preferences.language] || TRANSLATIONS.ru;
  const langMeta = LANG_META[preferences.language] || LANG_META.ru;
  const visibleCoachMessage = coachMessage || t.coach.empty;
  const elapsed = getElapsed(game, now);
  const filled = game.values.filter(Boolean).length;
  const progress = Math.round((filled / 81) * 100);
  const conflicts = useMemo(() => getConflictIndices(game.values), [game.values]);
  const selectedPeers = useMemo(() => {
    const s = game.selected;
    if (!Number.isInteger(s) || s < 0 || s > 80) return new Set();
    return getPeers(s);
  }, [game.selected]);
  const coachHighlightMap = useMemo(
    () => (proofVisible && coachStep ? createHighlightMap(coachStep.highlights) : new Map()),
    [coachStep, proofVisible],
  );
  const selectedValue =
    Number.isInteger(game.selected) && game.selected >= 0 && game.selected < 81
      ? game.values[game.selected]
      : null;
  const focusLens = useMemo(() => createFocusLens(game), [game]);
  const level = getLevel(profile.xp);
  const nextLevel = getNextLevel(profile.xp);
  const xpSpan = Math.max(1, nextLevel.min - level.min);
  const xpProgress =
    nextLevel.name === level.name ? 100 : Math.max(0, Math.min(100, ((profile.xp - level.min) / xpSpan) * 100));

  const sortedHistory = useMemo(
    () => sortRecords(historyRecords, historySort),
    [historyRecords, historySort],
  );

  const leaderboard = useMemo(() => {
    const leaders = [...DEMO_LEADERS];
    const dailyTime = profile.dailyResults?.[getDateKey()];
    if (dailyTime) {
      leaders.push({
        name: authUser ? profile.name : "Вы",
        city: "Алматы",
        seconds: dailyTime,
      });
    }
    return leaders.sort((a, b) => a.seconds - b.seconds).slice(0, 5);
  }, [profile, authUser]);

  const isPro = computeProStatus(profile.subscriptionTier, profile.proExpiresAt);

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.lang = preferences.language;
  }, [preferences]);

  useEffect(() => {
    function onHashChange() {
      setHashRoute(parseAppRoute());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (hashRoute.kind !== "learn" || !hashRoute.lessonId) return;
    const current = gameRef.current;
    if (current.mode === "learning" && current.learningLevelId === hashRoute.lessonId) return;
    const def = getLearningLevelById(hashRoute.lessonId);
    if (!def) return;
    if (gameHasProgress(current)) {
      const abandoned = appendToArchive(current, "abandoned", { elapsedSec: getElapsed(current) });
      setHistoryRecords(loadArchive());
      if (supabase && authUser) void upsertHistoryRecords(supabase, authUser.id, [abandoned]);
    }
    setGame(createGame(def.difficulty, "learning", { learningLevelId: hashRoute.lessonId }));
    setCoachStep(null);
    setProofVisible(false);
    setCoachMessageState(null);
  }, [hashRoute.kind, hashRoute.lessonId, authUser?.id]);

  useEffect(() => {
    if (!supabase) return undefined;
    let cancelled = false;
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) {
          console.warn("Supabase session restore failed; clearing local auth state.", error);
          await supabase.auth.signOut();
        }
        if (!cancelled) {
          setAuthUser(session?.user ?? null);
          setAuthReady(true);
        }
      })
      .catch((error) => {
        console.warn("Supabase session bootstrap failed.", error);
        if (!cancelled) {
          setAuthUser(null);
          setAuthReady(true);
        }
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !authUser?.id) {
      setCloudSynced(false);
      return undefined;
    }
    let cancelled = false;
    setCloudSynced(false);
    (async () => {
      try {
        const { data: row, error } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
        if (error) throw error;
        if (cancelled) return;

        const remoteProfile = mapProfileFromDb(row, authUser.email);
        const localProfile = loadProfile();
        const mergedProfile = mergeProfileForSync(localProfile, remoteProfile);
        setProfile(mergedProfile);

        const mergedPrefs = mergePreferencesWithRemote(loadPreferences(), row?.preferences || {});
        setPreferences(normalizePreferences(mergedPrefs));

        const localHist = loadArchive();
        const remoteRows = await fetchRemoteHistory(supabase, authUser.id);
        const mergedHist = mergeHistoryFromRemote(localHist, remoteRows);
        saveArchive(mergedHist);
        setHistoryRecords(mergedHist);
        await upsertHistoryRecords(supabase, authUser.id, mergedHist);

        const cloudGame = hydrateGameFromCloud(row?.current_game);
        if (cloudGame) {
          setGame((g) => (gameHasProgress(g) ? g : cloudGame));
        }

        await supabase.from("profiles").upsert(profileToRemotePatch(mergedProfile, mergedPrefs, authUser.id), {
          onConflict: "id",
        });
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setCloudSynced(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  useEffect(() => {
    if (!supabase || !authUser?.id || !cloudSynced) return undefined;
    const timer = window.setTimeout(() => {
      void supabase.from("profiles").upsert(profileToRemotePatch(profile, preferences, authUser.id), {
        onConflict: "id",
      });
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [profile, preferences, authUser?.id, cloudSynced]);

  useEffect(() => {
    if (!supabase || !authUser?.id || !cloudSynced) return undefined;
    const timer = window.setTimeout(() => {
      const elapsedFlush = getElapsed(game, Date.now());
      const payloadFlush = gameToCloudBlob(game, elapsedFlush);
      void supabase.from("profiles").update({ current_game: payloadFlush }).eq("id", authUser.id);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [game, authUser?.id, cloudSynced]);

  useEffect(() => {
    setCoachMessageState(null);
  }, [preferences.language]);

  useEffect(() => {
    saveGame(game);
  }, [game]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => saveGame(game), 30000);
    return () => window.clearInterval(timer);
  }, [game]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (historyDockOpen) setHistoryRecords(loadArchive());
  }, [historyDockOpen]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return undefined;
    const synth = window.speechSynthesis;
    const prime = () => {
      synth.getVoices();
    };
    prime();
    synth.addEventListener("voiceschanged", prime);
    return () => synth.removeEventListener("voiceschanged", prime);
  }, []);

  useEffect(() => {
    function handleKeyboard(event) {
      const k = keyboardRef.current;
      if (!k) return;
      const key = event.key.toLowerCase();

      if (event.key === "Escape") {
        k.setActiveModal(null);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) k.redo();
        else k.undo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && key === "y") {
        event.preventDefault();
        k.redo();
        return;
      }

      if (/^[1-9]$/.test(event.key)) {
        k.enterNumber(Number(event.key));
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
        k.eraseCell();
        return;
      }

      if (key === "n") {
        k.setGame((current) => ({ ...current, noteMode: !current.noteMode }));
        return;
      }

      if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        k.moveSelection(key);
      }
    }

    document.addEventListener("keydown", handleKeyboard);
    return () => document.removeEventListener("keydown", handleKeyboard);
  }, []);

  function showToast(message) {
    setToast(message);
  }

  function playFeedback(kind) {
    if (!preferences.soundEnabled) return;
    playGameSound(kind, preferences.soundVolume);
  }

  function speakCoach(message) {
    if (!preferences.soundEnabled || preferences.soundVolume <= 0 || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = langMeta.speech;
    const voice = pickBestCoachVoice(window.speechSynthesis.getVoices(), langMeta.speech);
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.pitch = 0.98;
    utterance.volume = preferences.soundVolume;
    window.speechSynthesis.speak(utterance);
  }

  function setCoachMessage(message) {
    setCoachMessageState(message);
    speakCoach(message);
  }

  function flashLockedCell(index) {
    setLockedCell(index);
    window.setTimeout(() => setLockedCell(null), 420);
  }

  function continueHistoryRecord(record) {
    if (!record || record.id === HISTORY_PREVIEW_RECORD.id) return;
    if (gameHasProgress(game)) {
      const abandoned = appendToArchive(game, "abandoned", { elapsedSec: getElapsed(game) });
      setHistoryRecords(loadArchive());
      if (supabase && authUser) void upsertHistoryRecords(supabase, authUser.id, [abandoned]);
    }
    const next = restoreGameFromRecord(record);
    setCoachStep(null);
    setProofVisible(false);
    setCoachMessageState(null);
    setActiveModal(null);
    setHistoryDockOpen(false);
    setGame(next);
  }

  function analyzeHistoryRecord(record) {
    if (!record || record.id === HISTORY_PREVIEW_RECORD.id) return;
    setHistoryAnalysisRecord(record);
    setActiveModal("historyAnalysis");
  }

  function startNewGame(difficulty = game.difficulty, mode = "free") {
    if (gameHasProgress(game)) {
      const abandoned = appendToArchive(game, "abandoned", { elapsedSec: getElapsed(game) });
      setHistoryRecords(loadArchive());
      if (supabase && authUser) void upsertHistoryRecords(supabase, authUser.id, [abandoned]);
    }
    const next = createGame(difficulty, mode);
    setGame(next);
    setCoachStep(null);
    setProofVisible(false);
    setCoachMessageState(mode === "daily" ? t.coach.dailyReady : t.coach.freeReady);
  }

  function startFamousGame(puzzleId) {
    const entry = getFamousPuzzleById(puzzleId);
    if (!entry) return;
    if (gameHasProgress(game)) {
      const abandoned = appendToArchive(game, "abandoned", { elapsedSec: getElapsed(game) });
      setHistoryRecords(loadArchive());
      if (supabase && authUser) void upsertHistoryRecords(supabase, authUser.id, [abandoned]);
    }
    const next = createGameFromPuzzle({
      id: entry.id,
      puzzle: entry.puzzle,
      solution: entry.solution,
      difficulty: entry.difficulty,
    });
    setGame(next);
    setCoachStep(null);
    setProofVisible(false);
    setCoachMessageState(null);
    window.location.hash = "#/";
  }

  function restartLearningLesson(lessonId) {
    const def = getLearningLevelById(lessonId);
    if (!def) return;
    if (gameHasProgress(game)) {
      const abandoned = appendToArchive(game, "abandoned", { elapsedSec: getElapsed(game) });
      setHistoryRecords(loadArchive());
      if (supabase && authUser) void upsertHistoryRecords(supabase, authUser.id, [abandoned]);
    }
    setGame(createGame(def.difficulty, "learning", { learningLevelId: lessonId }));
    setCoachStep(null);
    setProofVisible(false);
    setCoachMessageState(null);
  }

  function commitGame(next, checkCompletion = false) {
    if (checkCompletion && isSolved(next)) {
      completePuzzle(next);
      return;
    }
    setGame(next);
  }

  function selectCell(index) {
    setGame((current) => ({
      ...current,
      selected: index,
      hintCells: [],
    }));
    setProofVisible(false);
  }

  function enterNumber(number) {
    if (game.completed) return;
    const index = game.selected;
    if (index === null || index === undefined || !Number.isInteger(index) || index < 0 || index > 80) {
      showToast(t.toasts.selectCell);
      return;
    }
    if (game.fixed[index]) {
      flashLockedCell(index);
      playFeedback("reject");
      return;
    }

    if (game.noteMode) {
      if (game.values[index]) return;
      const next = withHistory(game);
      const currentNotes = new Set(next.notes[index]);
      if (currentNotes.has(number)) currentNotes.delete(number);
      else currentNotes.add(number);
      next.notes = next.notes.map((note, noteIndex) =>
        noteIndex === index ? [...currentNotes].sort((a, b) => a - b) : note,
      );
      next.lastNumber = number;
      commitGame(next);
      playFeedback("note");
      return;
    }

    if (game.values[index] === number) return;

    const entry = canEnterSolutionNumber(game, index, number);
    if (!entry.ok) {
      if (entry.reason === "wrong-number") {
        flashLockedCell(index);
        setGame((current) => ({
          ...current,
          mistakes: current.mistakes + 1,
          hintCells: [],
          lastNumber: number,
        }));
        showToast(t.toasts.wrongEntry);
        playFeedback("reject");
      }
      return;
    }

    const next = withHistory(game);
    next.values = [...next.values];
    next.notes = next.notes.map((note) => [...note]);
    next.values[index] = number;
    next.notes[index] = [];
    next.hintCells = [];
    next.lastNumber = number;
    const completesPuzzle = isSolved(next);
    commitGame(next, true);
    if (!completesPuzzle) playFeedback("place");
  }

  function eraseCell() {
    if (game.completed) return;
    const index = game.selected;
    if (index === null || index === undefined || !Number.isInteger(index) || index < 0 || index > 80) return;
    if (game.fixed[index]) {
      flashLockedCell(index);
      playFeedback("reject");
      return;
    }
    if (!game.values[index] && game.notes[index].length === 0) return;

    const next = withHistory(game);
    next.values = [...next.values];
    next.notes = next.notes.map((note) => [...note]);
    next.values[index] = 0;
    next.notes[index] = [];
    next.hintCells = [];
    commitGame(next);
    playFeedback("erase");
  }

  function undo() {
    if (game.history.length === 0 || game.completed) return;
    const previous = game.history[game.history.length - 1];
    const next = restoreSnapshot(
      {
        ...game,
        history: game.history.slice(0, -1),
        future: [...game.future, makeSnapshot(game)],
      },
      previous,
    );
    setGame(next);
    playFeedback("undo");
  }

  function redo() {
    if (game.future.length === 0 || game.completed) return;
    const future = game.future[game.future.length - 1];
    const next = restoreSnapshot(
      {
        ...game,
        history: [...game.history, makeSnapshot(game)],
        future: game.future.slice(0, -1),
      },
      future,
    );
    setGame(next);
    playFeedback("redo");
  }

  function completePuzzle(nextGame) {
    const finalTime = getElapsed(nextGame);
    if (nextGame.suppressVictoryRewards) {
      setGame({
        ...nextGame,
        completed: true,
        elapsedBefore: finalTime,
        history: [],
        future: [],
        awardXp: 0,
        suppressVictoryRewards: false,
      });
      showToast(t.toasts.solvedReplay);
      playFeedback("complete");
      return;
    }

    const isLearning = nextGame.mode === "learning" && nextGame.learningLevelId;
    const learningMeta = isLearning ? getLearningLevelById(nextGame.learningLevelId) : null;

    if (isLearning && learningMeta) {
      const progressBefore = loadLearningProgress();
      const alreadyXp = progressBefore.cleanXpAwardedIds.includes(nextGame.learningLevelId);
      const clean = nextGame.learningCleanEligible !== false;

      if (clean && alreadyXp) {
        setGame({
          ...nextGame,
          completed: true,
          elapsedBefore: finalTime,
          history: [],
          future: [],
          awardXp: 0,
        });
        showToast(t.toasts.solvedReplay);
        playFeedback("complete");
        return;
      }

      let gainedXp = 0;
      if (clean && !alreadyXp) {
        gainedXp = Math.max(15, learningMeta.xpReward);
      }

      let prog = markLessonCompleted(nextGame.learningLevelId, progressBefore);
      if (gainedXp > 0) {
        prog = markLessonXpAwarded(nextGame.learningLevelId, prog);
      }
      saveLearningProgress(prog);

      const wonRecord = appendToArchive(nextGame, "won", { elapsedSec: finalTime, awardXp: gainedXp });
      setHistoryRecords(loadArchive());
      if (supabase && authUser) void upsertHistoryRecords(supabase, authUser.id, [wonRecord]);

      const completed = {
        ...nextGame,
        completed: true,
        elapsedBefore: finalTime,
        history: [],
        future: [],
        awardXp: gainedXp,
      };

      setGame(completed);

      setProfile((current) => {
        const today = getDateKey();
        const yesterday = getDateKey(Date.now() - 24 * 60 * 60 * 1000);
        const nextStreak =
          current.lastPlayed === today
            ? current.streak
            : current.lastPlayed === yesterday
            ? current.streak + 1
            : 1;
        const badges = new Set(current.badges || []);
        if (nextGame.hintsUsed === 0) badges.add("Чистое решение");
        if (finalTime < 180) badges.add("Молния");
        if (nextGame.difficulty === "impossible") badges.add("Невозможное возможно");

        return {
          ...current,
          xp: current.xp + gainedXp,
          solved: current.solved + 1,
          streak: nextStreak,
          lastPlayed: today,
          badges: [...badges],
          dailyResults: current.dailyResults,
          famousBests: current.famousBests || {},
        };
      });

      if (clean && gainedXp > 0) showToast(t.toasts.learningXp(gainedXp));
      else if (!clean) showToast(t.toasts.learningNoXp);
      playFeedback("complete");
      return;
    }

    const gainedXp = Math.max(
      15,
      DIFFICULTIES[nextGame.difficulty].xp - nextGame.hintsUsed * 5 - nextGame.mistakes * 2,
    );
    const wonRecord = appendToArchive(nextGame, "won", { elapsedSec: finalTime, awardXp: gainedXp });
    setHistoryRecords(loadArchive());
    if (supabase && authUser) void upsertHistoryRecords(supabase, authUser.id, [wonRecord]);
    const completed = {
      ...nextGame,
      completed: true,
      elapsedBefore: finalTime,
      history: [],
      future: [],
      awardXp: gainedXp,
    };

    setGame(completed);
    const isFamous = nextGame.mode === "famous" && nextGame.famousId;
    if (isFamous) {
      recordFamousBest(nextGame.famousId, {
        seconds: finalTime,
        mistakes: nextGame.mistakes,
        hintsUsed: nextGame.hintsUsed,
        completedAt: Date.now(),
      });
    }
    setProfile((current) => {
      const today = getDateKey();
      const yesterday = getDateKey(Date.now() - 24 * 60 * 60 * 1000);
      const nextStreak = isFamous
        ? current.streak
        : current.lastPlayed === today
        ? current.streak
        : current.lastPlayed === yesterday
        ? current.streak + 1
        : 1;
      const badges = new Set(current.badges || []);
      if (nextGame.hintsUsed === 0) badges.add("Чистое решение");
      if (finalTime < 180) badges.add("Молния");
      if (nextGame.difficulty === "impossible") badges.add("Невозможное возможно");
      if (isFamous) badges.add("Хроника судоку");

      let nextFamousBests = current.famousBests || {};
      if (isFamous) {
        const prev = nextFamousBests[nextGame.famousId];
        if (!prev || finalTime < prev.seconds) {
          nextFamousBests = {
            ...nextFamousBests,
            [nextGame.famousId]: {
              seconds: finalTime,
              mistakes: nextGame.mistakes,
              hintsUsed: nextGame.hintsUsed,
              completedAt: Date.now(),
            },
          };
        }
      }

      return {
        ...current,
        xp: current.xp + gainedXp,
        solved: current.solved + 1,
        streak: nextStreak,
        lastPlayed: isFamous ? current.lastPlayed : today,
        badges: [...badges],
        dailyResults:
          nextGame.mode === "daily"
            ? { ...current.dailyResults, [today]: finalTime }
            : current.dailyResults,
        famousBests: nextFamousBests,
      };
    });
    showToast(t.toasts.solved(gainedXp));
    playFeedback("complete");
  }

  function requestCoach(mode) {
    if (game.completed) return;
    const selectedNumber =
      game.selected === null || game.selected === undefined
        ? game.lastNumber
        : game.values[game.selected] || game.lastNumber;
    const step =
      mode === "lesson"
        ? createLessonStep(game)
        : createCoachStep(game, mode, {
            index: game.selected,
            number: selectedNumber,
          });

    setCoachMode(mode);
    setCoachStep(step);
    setProofVisible(mode !== "hint");

    if (mode === "hint" && !["conflict", "instruction"].includes(step.kind)) {
      setGame((current) => ({
        ...current,
        hintsUsed: current.hintsUsed + 1,
        learningCleanEligible: current.mode === "learning" ? false : current.learningCleanEligible,
        selected: Number.isInteger(step.target) ? step.target : current.selected,
        lastNumber: step.number || current.lastNumber,
      }));
    } else if (Number.isInteger(step.target)) {
      setGame((current) => ({
        ...current,
        selected: step.target,
        lastNumber: step.number || current.lastNumber,
      }));
    }

    setCoachMessage(`${step.title}: ${step.summary} ${step.explanation}`);
  }

  function toggleProof() {
    if (!coachStep) return;
    setProofVisible((current) => !current);
    if (!proofVisible) setCoachMessage(`${t.coach.proof}: ${coachStep.proof}`);
  }

  function applyCoachStep() {
    if (!coachStep?.strict || !Number.isInteger(coachStep.target) || !coachStep.number || game.completed) {
      return;
    }
    if (game.fixed[coachStep.target]) {
      flashLockedCell(coachStep.target);
      playFeedback("reject");
      return;
    }

    const next = withHistory(game);
    next.values = [...next.values];
    next.notes = next.notes.map((note) => [...note]);
    next.values[coachStep.target] = coachStep.number;
    next.notes[coachStep.target] = [];
    next.lastNumber = coachStep.number;
    next.selected = coachStep.target;
    next.hintCells = [];
    if (game.mode === "learning") {
      next.learningCleanEligible = false;
    }
    setProofVisible(false);
    setCoachMessage(`${t.coach.placed} ${coachStep.summary}`);
    const completesPuzzle = isSolved(next);
    commitGame(next, true);
    if (!completesPuzzle) playFeedback("place");
  }

  keyboardRef.current = {
    enterNumber,
    eraseCell,
    moveSelection,
    undo,
    redo,
    setActiveModal,
    setGame,
  };

  function moveSelection(key) {
    const raw = game.selected;
    const selected = Number.isInteger(raw) && raw >= 0 && raw < 81 ? raw : 0;
    const row = Math.floor(selected / 9);
    const col = selected % 9;
    const next = {
      arrowup: [Math.max(0, row - 1), col],
      arrowdown: [Math.min(8, row + 1), col],
      arrowleft: [row, Math.max(0, col - 1)],
      arrowright: [row, Math.min(8, col + 1)],
    }[key];

    setGame({
      ...game,
      selected: next[0] * 9 + next[1],
      hintCells: [],
    });
  }

  async function handleAuthNavClick() {
    if (authUser && supabase) {
      await supabase.auth.signOut();
      setCloudSynced(false);
      showToast(t.toasts.signedOut);
      return;
    }
    window.location.hash = "#/sign-in";
  }

  async function openPolarCheckout() {
    if (!authUser) {
      showToast(t.modals.proSignIn);
      return;
    }
    setProBusy(true);
    try {
      const { url, error } = await createPolarCheckoutSession();
      if (error || !url) {
        showToast(t.modals.polarFail);
        return;
      }
      window.location.href = url;
    } finally {
      setProBusy(false);
    }
  }

  if (!authReady) {
    return (
      <div className="app-shell auth-page" role="status" aria-live="polite">
        <p className="auth-lead" style={{ margin: "24px auto", textAlign: "center" }}>
          {t.auth.busy}
        </p>
      </div>
    );
  }

  if (hashRoute.kind === "sign-in") {
    return (
      <>
        <div className="app-shell">
          <AuthPage
            labels={t.auth}
            brandTagline={t.tagline}
            navAria={t.aria.nav}
            cloudAvailable={isSupabaseConfigured}
            onSignedIn={(msg) => showToast(msg || t.toasts.signedIn)}
            onBack={() => {
              window.location.hash = "#/";
            }}
          />
        </div>
        <div className={`toast ${toast ? "show" : ""}`} aria-live="polite">
          {toast}
        </div>
      </>
    );
  }

  if (hashRoute.kind === "famous") {
    return (
      <>
        <div className="app-shell">
          <FamousPuzzlesPage
            labels={t.famous}
            brandTagline={t.tagline}
            navAria={t.aria.nav}
            language={preferences.language}
            difficultyLabels={t.difficulties}
            famousBests={profile.famousBests || {}}
            onBack={() => {
              window.location.hash = "#/";
            }}
            onPlay={(id) => startFamousGame(id)}
          />
        </div>
        <div className={`toast ${toast ? "show" : ""}`} aria-live="polite">
          {toast}
        </div>
      </>
    );
  }

  if (hashRoute.kind === "learn" && !hashRoute.lessonId) {
    return (
      <>
        <div className="app-shell">
          <LearningCatalogPage
            labels={t.learning}
            brandTagline={t.tagline}
            navAria={t.aria.nav}
            language={preferences.language}
            difficultyLabels={t.difficulties}
            tierLabels={{
              beginner: t.learning.tierBeginner,
              practice: t.learning.tierPractice,
              challenge: t.learning.tierChallenge,
            }}
            progress={loadLearningProgress()}
            onBack={() => {
              window.location.hash = "#/";
            }}
            onSelectLesson={(id) => {
              if (!isLessonUnlocked(id, loadLearningProgress().completedIds)) {
                showToast(t.learning.locked);
                return;
              }
              window.location.hash = `#/learn/${encodeURIComponent(id)}`;
            }}
          />
        </div>
        <div className={`toast ${toast ? "show" : ""}`} aria-live="polite">
          {toast}
        </div>
      </>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar" aria-label={t.aria.nav}>
        <Brand tagline={t.tagline} />

        <div className="top-actions">
          <IconButton
            icon={BookOpen}
            label={t.nav.learn}
            variant="famous"
            onClick={() => {
              window.location.hash = "#/learn";
            }}
          />
          <IconButton icon={Trophy} label={t.nav.famous} variant="famous" onClick={() => { window.location.hash = "#/famous"; }} />
          <IconButton icon={Settings} label={t.nav.settings} onClick={() => setActiveModal("settings")} />
          <IconButton icon={HelpCircle} label={t.nav.rules} onClick={() => setActiveModal("rules")} />
          <IconButton icon={Crown} label={t.nav.pro} variant="pro" onClick={() => setActiveModal("pro")} />
          <IconButton icon={LogIn} label={authUser ? t.nav.signOut : t.nav.signIn} variant="auth" onClick={handleAuthNavClick} />
        </div>
      </header>

      <main className="workspace">
        <section className="game-column" aria-label={t.aria.game}>
          <div className="game-toolbar">
            <div>
              {game.mode === "learning" && game.learningLevelId ? (
                <>
                  <p className="eyebrow">
                    {t.learning.lessonEyebrow} · {t.learning.cluesShort(game.generator.clues)} ·{" "}
                    {
                      {
                        beginner: t.learning.tierBeginner,
                        practice: t.learning.tierPractice,
                        challenge: t.learning.tierChallenge,
                      }[getLearningLevelById(game.learningLevelId)?.tier || "beginner"]
                    }
                  </p>
                  <h1>{pickLocalized(getLearningLevelById(game.learningLevelId)?.title, preferences.language, "")}</h1>
                  <button className="mini-button learning-back" type="button" onClick={() => { window.location.hash = "#/learn"; }}>
                    <ArrowLeft size={17} aria-hidden="true" />
                    {t.learning.back}
                  </button>
                </>
              ) : (
                <>
                  <p className="eyebrow">
                    {game.mode === "daily" ? t.modes.daily : t.modes.free} · {game.generator.clues} {t.stats.hints}
                  </p>
                  <h1>{game.mode === "daily" ? t.modes.dailyTitle : `${t.difficulties[game.difficulty]} ${t.modes.freeTitle}`}</h1>
                </>
              )}
            </div>
            <div className="live-stats" aria-label={t.aria.stats}>
              <Metric value={formatTime(elapsed)} label={t.stats.time} />
              <Metric value={game.mistakes} label={t.stats.mistakes} />
              <Metric value={game.hintsUsed} label={t.stats.hints} />
            </div>
          </div>

          {game.mode === "learning" ? null : (
            <div className="difficulty-bar" aria-label={t.aria.difficulty}>
              {Object.entries(DIFFICULTIES).map(([key, item]) => (
                <button
                  className={`difficulty-option ${game.difficulty === key ? "active" : ""}`}
                  key={key}
                  type="button"
                  onClick={() => startNewGame(key, "free")}
                >
                  {t.difficulties[key] || item.label}
                </button>
              ))}
            </div>
          )}

          <div className={`board-wrap board-size-${preferences.boardSize} ${preferences.showFocusLens ? "" : "lens-hidden"}`}>
            <div className="board-stage">
              <div className="corner-rail" aria-hidden="true" />
              <div className="column-rail" aria-hidden="true">
                {"ABCDEFGHI".split("").map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="row-rail" aria-hidden="true">
                {NUMBERS.map((number) => (
                  <span key={number}>{number}</span>
                ))}
              </div>
              <div className="sudoku-board" role="grid" aria-label={t.aria.board}>
                {game.values.map((value, index) => (
                  <Cell
                    key={index}
                    index={index}
                    value={value}
                    notes={game.notes[index]}
                    fixed={game.fixed[index]}
                    selected={game.selected === index}
                    peer={selectedPeers.has(index)}
                    same={Boolean(value && selectedValue && value === selectedValue)}
                    conflict={conflicts.has(index)}
                    highlight={coachHighlightMap.get(index) || ""}
                    locked={lockedCell === index}
                    label={t.aria.cell(index, value)}
                    onClick={() => selectCell(index)}
                  />
                ))}
              </div>
            </div>
            {preferences.showFocusLens ? (
              <FocusLens
                lens={focusLens}
                noteMode={game.noteMode}
                labels={t.lens}
                onHide={() => setPreferences((current) => ({ ...current, showFocusLens: false }))}
              />
            ) : (
              <button
                className="lens-restore-button"
                type="button"
                aria-label={t.lens.show}
                title={t.lens.show}
                onClick={() => setPreferences((current) => ({ ...current, showFocusLens: true }))}
              >
                <Eye size={16} aria-hidden="true" />
              </button>
            )}

            <AnimatePresence>
              {game.completed && (
                <motion.div
                  className="win-layer"
                  aria-live="polite"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <div className="win-card">
                    <p className="eyebrow">{t.modals.victory}</p>
                    <strong>{t.modals.solved}</strong>
                    <span className="win-subtitle">{t.modals.solvedSubtitle}</span>
                    <div className="win-metrics">
                      <Metric value={formatTime(game.elapsedBefore)} label={t.stats.time} />
                      <Metric value={`+${game.awardXp || 0}`} label="XP" />
                      <Metric value={profile.streak} label="streak" />
                    </div>
                    <div className="win-actions">
                      {game.mode === "learning" && game.learningLevelId ? (
                        <>
                          <button type="button" onClick={() => { window.location.hash = "#/learn"; }}>
                            {t.actions.backToLessons}
                          </button>
                          <button type="button" onClick={() => restartLearningLesson(game.learningLevelId)}>
                            {t.actions.restartLesson}
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => startNewGame(game.difficulty, "free")}>
                          {t.actions.newGame}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="number-pad" aria-label={t.aria.numbers}>
            {NUMBERS.map((number) => (
              <button
                className={game.lastNumber === number ? "active" : ""}
                key={number}
                type="button"
                onClick={() => enterNumber(number)}
              >
                {number}
              </button>
            ))}
          </div>

          <div className="tool-row" aria-label={t.aria.tools}>
            <IconButton icon={Pencil} label={t.actions.pencil} active={game.noteMode} onClick={() => setGame({ ...game, noteMode: !game.noteMode })} />
            <IconButton icon={Eraser} label={t.actions.erase} onClick={eraseCell} />
            <IconButton icon={Undo2} label={t.actions.undo} disabled={game.history.length === 0} onClick={undo} />
            <IconButton icon={Redo2} label={t.actions.redo} disabled={game.future.length === 0} onClick={redo} />
            <IconButton
              icon={RefreshCw}
              label={t.actions.newGame}
              onClick={() =>
                game.mode === "learning" && game.learningLevelId
                  ? restartLearningLesson(game.learningLevelId)
                  : startNewGame(game.difficulty, "free")
              }
            />
          </div>

          <section className={`history-dock ${historyDockOpen ? "is-open" : ""}`} aria-label={t.history.title}>
            <button
              className="history-dock-toggle"
              type="button"
              aria-expanded={historyDockOpen}
              onClick={() => setHistoryDockOpen((open) => !open)}
            >
              <span className="history-dock-copy">
                <span className="eyebrow">{t.history.eyebrow}</span>
                <strong>{t.history.title}</strong>
                <small>{historyRecords.length > 0 ? t.history.savedCount(historyRecords.length) : t.history.emptyCompact}</small>
              </span>
              <span className="history-dock-action">
                <History size={17} aria-hidden="true" />
                <span>{historyDockOpen ? t.history.hideDock : t.history.showDock}</span>
                <ChevronDown size={17} aria-hidden="true" />
              </span>
            </button>

            <AnimatePresence initial={false}>
              {historyDockOpen && (
                <motion.div
                  className="history-dock-body"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <HistoryTableView
                    records={sortedHistory}
                    labels={t.history}
                    difficultyLabels={t.difficulties}
                    dailyLabel={t.modes.dailyTitle}
                    sortKey={historySort}
                    onSortChange={setHistorySort}
                    langMeta={langMeta}
                    onContinue={continueHistoryRecord}
                    onAnalyze={analyzeHistoryRecord}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </section>

        <aside className="side-panel" aria-label={t.aria.side}>
          <section className="panel-block daily-block">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t.panels.daily}</p>
                <h2>
                  {new Intl.DateTimeFormat(langMeta.locale, {
                    day: "numeric",
                    month: "long",
                  }).format(new Date())}
                </h2>
              </div>
              <button className="mini-button icon-button" type="button" onClick={() => startNewGame("medium", "daily")}>
                <CalendarDays size={17} aria-hidden="true" />
                {t.actions.play}
              </button>
            </div>
            <div className="ritual-meter" aria-label="Прогресс решения">
              <span style={{ width: `${progress}%` }} />
            </div>
            <p className="panel-copy">{t.panels.filled(filled)}</p>
          </section>

          <section className="panel-block coach-block">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t.panels.coach}</p>
                <h2>{t.panels.mentor}</h2>
              </div>
              <span className="status-dot">{game.generator.unique ? "unique" : "basic"}</span>
            </div>
            <div className="coach-tabs" role="tablist" aria-label={t.aria.coachMode}>
              <button className={coachMode === "hint" ? "active" : ""} type="button" onClick={() => requestCoach("hint")}>
                {t.coach.hint}
              </button>
              <button className={coachMode === "lesson" ? "active" : ""} type="button" onClick={() => requestCoach("lesson")}>
                {t.coach.lesson}
              </button>
              <button className={coachMode === "why" ? "active" : ""} type="button" onClick={() => requestCoach("why")}>
                {t.coach.why}
              </button>
            </div>
            <CoachCard
              message={visibleCoachMessage}
              step={coachStep}
              proofVisible={proofVisible}
              labels={t}
              onShowProof={toggleProof}
              onApply={applyCoachStep}
            />
          </section>

          <section className="panel-block profile-block">
            <div className="profile-line">
              <div>
                <p className="eyebrow">{t.panels.profile}</p>
                <h2>{authUser ? profile.name : getGuestName(preferences.language)}</h2>
              </div>
              <span className="level-pill">{level.name}</span>
            </div>
            <div className="xp-track" aria-label="Опыт до следующего уровня">
              <span style={{ width: `${xpProgress}%` }} />
            </div>
            <div className="metric-grid">
              <Metric value={profile.xp} label="XP" />
              <Metric value={profile.streak} label="streak" />
              <Metric value={profile.solved} label={t.stats.solved} />
            </div>
          </section>

          <section className="panel-block leaderboard-block">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t.panels.leaderboard}</p>
                <h2>Алматы</h2>
              </div>
              <span className="city-filter">{t.panels.local}</span>
            </div>
            <ol className="leaderboard">
              {leaderboard.map((leader) => (
                <li key={`${leader.name}-${leader.seconds}`}>
                  <span>
                    <strong>{leader.name}</strong>
                    <small>{leader.city}</small>
                  </span>
                  <time>{formatTime(leader.seconds)}</time>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </main>

      <AnimatePresence>
        {activeModal === "settings" && (
          <Modal title={t.settings.title} eyebrow={t.settings.eyebrow} wide onClose={() => setActiveModal(null)} closeLabel={t.actions.close}>
            <SettingsPanel
              preferences={preferences}
              labels={t.settings}
              onChange={(next) => setPreferences((current) => ({ ...current, ...next }))}
            />
          </Modal>
        )}
        {activeModal === "pro" && (
          <Modal
            title={t.modals.proTitle}
            eyebrow={t.modals.proEyebrow}
            wide
            extraClass="pro-modal-card"
            onClose={() => setActiveModal(null)}
            closeLabel={t.actions.close}
          >
            <ProSubscriptionCard
              t={t}
              langMeta={langMeta}
              isPro={isPro}
              profile={profile}
              authUser={authUser}
              proBusy={proBusy}
              onSubscribe={() => void openPolarCheckout()}
              onSignIn={() => {
                setActiveModal(null);
                window.location.hash = "#/sign-in";
              }}
            />
          </Modal>
        )}
        {activeModal === "rules" && (
          <Modal title={t.modals.rulesTitle} eyebrow={t.modals.rulesEyebrow} wide onClose={() => setActiveModal(null)} closeLabel={t.actions.close}>
            <ul className="rules-list">
              {t.modals.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </Modal>
        )}
        {activeModal === "historyAnalysis" && historyAnalysisRecord && (
          <Modal
            title={t.history.analyzeTitle}
            eyebrow={t.history.eyebrow}
            wide
            extraClass="history-modal-card"
            onClose={() => {
              setActiveModal(null);
              setHistoryAnalysisRecord(null);
            }}
            closeLabel={t.actions.close}
          >
            <HistoryAnalysisView
              record={historyAnalysisRecord}
              labels={t.history}
              difficultyLabels={t.difficulties}
              dailyLabel={t.modes.dailyTitle}
              langMeta={langMeta}
            />
          </Modal>
        )}
      </AnimatePresence>

      <div className={`toast ${toast ? "show" : ""}`} aria-live="polite">
        {toast}
      </div>
    </div>
  );
}

function Cell({ index, value, notes, fixed, selected, peer, same, conflict, highlight, locked, label, onClick }) {
  const classes = [
    "cell",
    fixed ? "given" : "",
    selected ? "selected" : "",
    peer ? "peer" : "",
    same ? "same" : "",
    conflict ? "conflict" : "",
    highlight,
    locked ? "locked-flash" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classes}
      data-index={index}
      role="gridcell"
      type="button"
      aria-label={label}
      onClick={onClick}
    >
      {value || <NotesGrid notes={notes} />}
    </button>
  );
}

function NotesGrid({ notes }) {
  const active = new Set(notes);
  return (
    <span className="notes-grid" aria-hidden="true">
      {NUMBERS.map((number) => (
        <span className={active.has(number) ? "active" : ""} key={number}>
          {number}
        </span>
      ))}
    </span>
  );
}

function CoachCard({ message, step, proofVisible, labels, onShowProof, onApply }) {
  if (!step) {
    return (
      <div className="coach-card empty">
        <p className="coach-message">{message}</p>
        <div className="coach-actions">
          <span className="coach-mini-note">{labels.coach.mini}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`coach-card ${step.kind}`}>
      <div className="coach-card-head">
        <span className="technique-pill">
          <Sparkles size={14} aria-hidden="true" />
          {step.technique}
        </span>
        <span className="confidence-pill">{Math.round(step.confidence * 100)}%</span>
      </div>
      <h3>{step.summary}</h3>
      <p className="coach-message">{step.explanation}</p>
      {step.candidates.length > 0 && (
        <div className="candidate-row" aria-label="Кандидаты">
          {step.candidates.map((candidate) => (
            <span key={candidate}>{candidate}</span>
          ))}
        </div>
      )}
      {proofVisible && <p className="proof-copy">{step.proof}</p>}
      <div className="coach-actions">
        <IconButton
          icon={Lightbulb}
          label={proofVisible ? labels.actions.proofHide : labels.actions.proofShow}
          onClick={onShowProof}
        />
        <IconButton
          icon={AlertCircle}
          label={labels.actions.apply}
          disabled={!step.strict}
          onClick={onApply}
        />
      </div>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <span>
      <b>{value}</b>
      <small>{label}</small>
    </span>
  );
}

function FocusLens({ lens, noteMode, labels, onHide }) {
  return (
    <aside className="focus-lens" aria-label={labels.aria}>
      <button
        className="lens-toggle-button"
        type="button"
        aria-label={labels.hide}
        title={labels.hide}
        onClick={onHide}
      >
        <EyeOff size={15} aria-hidden="true" />
      </button>
      <div className="lens-orbit" aria-hidden="true">
        <span style={{ "--i": lens.rowRatio }} />
        <span style={{ "--i": lens.colRatio }} />
        <span style={{ "--i": lens.boxRatio }} />
      </div>
      <div>
        <p className="eyebrow">{labels.title}</p>
        <h2>{lens.label}</h2>
      </div>
      <div className="lens-state">
        <span>{lens.fixed ? labels.fixed : lens.value ? labels.entered : labels.empty}</span>
        <span>{noteMode ? labels.notes : labels.number}</span>
      </div>
      <div className="lens-bars" aria-label={labels.context}>
        <LensBar label="Row" value={lens.rowFilled} />
        <LensBar label="Col" value={lens.colFilled} />
        <LensBar label="Box" value={lens.boxFilled} />
      </div>
      <div className="lens-candidates" aria-label={labels.candidates}>
        {lens.candidates.length > 0 ? (
          lens.candidates.map((candidate) => <CandidateChip key={candidate} value={candidate} active={lens.notes.has(candidate)} />)
        ) : (
          <span className="lens-empty">{lens.value ? labels.currentNumber(lens.value) : labels.noCandidates}</span>
        )}
      </div>
    </aside>
  );
}

function LensBar({ label, value }) {
  return (
    <span>
      <small>{label}</small>
      <i>
        <b style={{ width: `${(value / 9) * 100}%` }} />
      </i>
      <strong>{value}/9</strong>
    </span>
  );
}

function CandidateChip({ value, active }) {
  return <span className={active ? "active" : ""}>{value}</span>;
}

function getGuestName(language) {
  if (language === "en") return "Guest";
  if (language === "kk") return "Қонақ";
  return "Гость";
}

function createFocusLens(game) {
  const index = Number.isInteger(game.selected) ? game.selected : game.values.findIndex((value) => value === 0);
  const safeIndex = index >= 0 ? index : 0;
  const row = Math.floor(safeIndex / 9);
  const col = safeIndex % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  const rowCells = NUMBERS.map((_, offset) => row * 9 + offset);
  const colCells = NUMBERS.map((_, offset) => offset * 9 + col);
  const boxCells = [];

  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      boxCells.push((boxRow + r) * 9 + boxCol + c);
    }
  }

  const value = game.values[safeIndex];
  const candidates = value ? [] : getCandidates(game.values, safeIndex);

  return {
    label: `R${row + 1}C${col + 1}`,
    value,
    fixed: game.fixed[safeIndex],
    notes: new Set(game.notes[safeIndex] || []),
    candidates,
    rowFilled: rowCells.filter((cell) => game.values[cell]).length,
    colFilled: colCells.filter((cell) => game.values[cell]).length,
    boxFilled: boxCells.filter((cell) => game.values[cell]).length,
    rowRatio: row / 8,
    colRatio: col / 8,
    boxRatio: (Math.floor(row / 3) * 3 + Math.floor(col / 3)) / 8,
  };
}

function createHighlightMap(highlights = {}) {
  const map = new Map();
  addHighlight(map, highlights.unit, "coach-unit");
  addHighlight(map, highlights.candidates, "coach-candidate");
  addHighlight(map, highlights.eliminations, "coach-elimination");
  addHighlight(map, highlights.blockers, "coach-blocker");
  addHighlight(map, highlights.target, "coach-target");
  return map;
}

function addHighlight(map, indices = [], className) {
  indices.forEach((index) => {
    const current = map.get(index);
    map.set(index, current ? `${current} ${className}` : className);
  });
}

function pickLocalized(value, language, fallback = "") {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value[language] || value.en || value.ru || Object.values(value)[0] || fallback;
  }
  return String(value);
}

function LearningCatalogPage({
  labels,
  brandTagline,
  navAria,
  language,
  difficultyLabels,
  tierLabels,
  progress,
  onBack,
  onSelectLesson,
}) {
  return (
    <>
      <header className="topbar" aria-label={navAria}>
        <Brand tagline={brandTagline} />
        <div className="top-actions">
          <IconButton icon={ArrowLeft} label={labels.homeBack} onClick={onBack} />
        </div>
      </header>

      <main className="learning-page" aria-label={labels.ariaPage}>
        <section className="learning-hero">
          <p className="eyebrow">{labels.eyebrow}</p>
          <h1>{labels.title}</h1>
          <p className="learning-lead">{labels.lead}</p>
        </section>

        <section className="learning-grid" role="list">
          {LEARNING_LEVELS.map((level) => {
            const title = pickLocalized(level.title, language, level.id);
            const unlocked = isLessonUnlocked(level.id, progress.completedIds);
            const completed = progress.completedIds.includes(level.id);
            const cleanDone = progress.cleanXpAwardedIds.includes(level.id);
            const tier = tierLabels[level.tier] || level.tier;
            return (
              <article
                key={level.id}
                className={`learning-card ${!unlocked ? "learning-card--locked" : ""} ${completed ? "learning-card--done" : ""}`}
                role="listitem"
                aria-label={labels.ariaCard(title)}
              >
                <button
                  type="button"
                  className="learning-card__hit"
                  disabled={!unlocked}
                  onClick={() => onSelectLesson(level.id)}
                >
                  <div className="learning-card__row">
                    <span className="learning-tier">{tier}</span>
                    {completed ? (
                      <span className="learning-card__badge" aria-hidden="true">
                        <CheckCircle2 size={18} className={cleanDone ? "learning-card__clean" : "learning-card__done-muted"} />
                      </span>
                    ) : unlocked ? null : (
                      <Lock size={18} aria-hidden="true" />
                    )}
                  </div>
                  <h2>{title}</h2>
                  <p className="learning-card__meta">
                    {difficultyLabels[level.difficulty] || level.difficulty} · {labels.cleanBonus}{" "}
                    +{level.xpReward} XP
                  </p>
                </button>
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
}

function FamousPuzzlesPage({ labels, brandTagline, navAria, language, difficultyLabels, famousBests, onBack, onPlay }) {
  return (
    <>
      <header className="topbar" aria-label={navAria}>
        <Brand tagline={brandTagline} />
        <div className="top-actions">
          <IconButton icon={ArrowLeft} label={labels.back} onClick={onBack} />
        </div>
      </header>

      <main className="famous-page" aria-label={labels.ariaPage}>
        <section className="famous-hero">
          <p className="eyebrow">{labels.eyebrow}</p>
          <h1>{labels.title}</h1>
          <p className="famous-lead">{labels.lead}</p>
        </section>

        <section className="famous-grid" role="list">
          {FAMOUS_PUZZLES.map((entry) => {
            const best = famousBests?.[entry.id] || null;
            const clueCount = entry.puzzle.filter(Boolean).length;
            const fixed = entry.puzzle.map(Boolean);
            const name = pickLocalized(entry.name, language, entry.id);
            return (
              <article
                key={entry.id}
                className="famous-card"
                role="listitem"
                aria-label={labels.ariaCard(name)}
              >
                <div className="famous-card__head">
                  <HistoryMiniBoard values={entry.puzzle} fixed={fixed} outcome={best ? "won" : "abandoned"} />
                  <div className="famous-card__meta">
                    <p className="eyebrow">{labels.cluesShort(clueCount)}</p>
                    <h2>{name}</h2>
                    <p className="famous-card__tagline">{pickLocalized(entry.tagline, language)}</p>
                    <ul className="famous-card__facts">
                      <li>
                        <span>{labels.setter}</span>
                        <strong>{entry.setter}</strong>
                      </li>
                      <li>
                        <span>{labels.year}</span>
                        <strong>{entry.year}</strong>
                      </li>
                      <li>
                        <span>{difficultyLabels?.[entry.difficulty] || entry.difficulty}</span>
                        <strong>{clueCount}/81</strong>
                      </li>
                    </ul>
                  </div>
                </div>

                <p className="famous-card__story">{pickLocalized(entry.story, language)}</p>

                <div className="famous-card__history" aria-label={labels.historyTitle}>
                  <p className="eyebrow">{labels.historyTitle}</p>
                  <ul className="famous-lore-list">
                    {entry.highlights.map((item, idx) => {
                      const who = pickLocalized(item.who, language, "");
                      const note = pickLocalized(item.note, language, "");
                      return (
                        <li key={`${entry.id}-h-${idx}`}>
                          <span className="lore-row__who">
                            <strong>{who}</strong>
                            {item.year ? <em>{item.year}</em> : null}
                          </span>
                          <span className="lore-row__note">
                            {note}
                            {Number.isFinite(item.time) ? (
                              <>
                                {" "}
                                {labels.timeLabel} <b>{formatTime(item.time)}</b>
                              </>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="famous-best-row" aria-live="polite">
                  <div>
                    <p className="eyebrow">{labels.yourBest}</p>
                    {best ? (
                      <>
                        <strong>{formatTime(best.seconds)}</strong>
                        <small>{labels.bestSummary(best.mistakes ?? 0, best.hintsUsed ?? 0)}</small>
                      </>
                    ) : (
                      <strong className="famous-best-empty">{labels.noBest}</strong>
                    )}
                  </div>
                  <button
                    type="button"
                    className="famous-play-button"
                    onClick={() => onPlay(entry.id)}
                  >
                    <Play size={16} aria-hidden="true" />
                    <span>{best ? labels.replay : labels.play}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
}

function IconButton({ icon: Icon, label, variant = "", active = false, disabled = false, onClick }) {
  return (
    <button
      className={`icon-button ${variant ? `${variant}-button` : ""} ${active ? "active" : ""}`}
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={label}
    >
      <Icon size={17} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function SettingsPanel({ preferences, labels, onChange }) {
  return (
    <div className="settings-panel">
      <SettingRow
        icon={preferences.showFocusLens ? Eye : EyeOff}
        title={labels.lens}
        copy={labels.lensCopy}
        control={
          <label className="switch">
            <input
              type="checkbox"
              checked={preferences.showFocusLens}
              onChange={(event) => onChange({ showFocusLens: event.target.checked })}
            />
            <span />
          </label>
        }
      />
      <SettingRow
        icon={preferences.soundEnabled ? Volume2 : VolumeX}
        title={labels.sound}
        copy={labels.soundCopy}
        control={
          <label className="switch">
            <input
              type="checkbox"
              checked={preferences.soundEnabled}
              onChange={(event) => onChange({ soundEnabled: event.target.checked })}
            />
            <span />
          </label>
        }
      />
      <label className="range-setting">
        <span>{labels.volume}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(preferences.soundVolume * 100)}
          onChange={(event) => onChange({ soundVolume: clampVolume(Number(event.target.value) / 100) })}
        />
        <strong>{Math.round(preferences.soundVolume * 100)}%</strong>
      </label>
      <SettingRow
        icon={Maximize2}
        title={labels.boardSize}
        copy={labels.boardSizeCopy}
        control={
          <div className="board-size-control" role="group" aria-label={labels.boardSize}>
            {BOARD_SIZES.map((size) => (
              <button
                className={preferences.boardSize === size.key ? "active" : ""}
                key={size.key}
                type="button"
                onClick={() => onChange({ boardSize: size.key })}
              >
                {labels[size.labelKey]}
              </button>
            ))}
          </div>
        }
      />
      <div className="settings-group">
        <span>{labels.theme}</span>
        <div className="choice-grid">
          {THEMES.map((theme) => (
            <button
              className={preferences.theme === theme.key ? "active" : ""}
              key={theme.key}
              type="button"
              onClick={() => onChange({ theme: theme.key })}
            >
              <i className={`theme-swatch ${theme.key}`} aria-hidden="true" />
              {theme.label}
            </button>
          ))}
        </div>
      </div>
      <div className="settings-group">
        <span>{labels.language}</span>
        <div className="choice-grid language-grid">
          {Object.entries(LANG_META).map(([key, language]) => (
            <button
              className={preferences.language === key ? "active" : ""}
              key={key}
              type="button"
              onClick={() => onChange({ language: key })}
            >
              {language.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingRow({ icon: Icon, title, copy, control }) {
  return (
    <div className="setting-row">
      <span className="setting-icon">
        <Icon size={17} aria-hidden="true" />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{copy}</small>
      </span>
      {control}
    </div>
  );
}

function HistoryMiniBoard({ values, fixed, outcome }) {
  return (
    <div className={`history-mini-board ${outcome === "won" ? "is-won" : "is-abandoned"}`} aria-hidden="true">
      {values.map((v, i) => (
        <span key={i} className={[fixed[i] ? "hb-given" : "", v ? "hb-filled" : ""].filter(Boolean).join(" ")}>
          {v || ""}
        </span>
      ))}
    </div>
  );
}

function HistoryTableView({
  records,
  labels,
  difficultyLabels,
  dailyLabel,
  sortKey,
  onSortChange,
  langMeta,
  onContinue,
  onAnalyze,
}) {
  const demo = HISTORY_PREVIEW_RECORD;
  const showDemo = records.length === 0;
  const rowIds = showDemo ? [demo] : records;

  return (
    <div className="history-table-wrap">
      <label className="history-sort-row">
        <span>{labels.sortLabel}</span>
        <select value={sortKey} onChange={(e) => onSortChange(e.target.value)} className="history-sort-select">
          <option value="dateNew">{labels.sortDateNew}</option>
          <option value="dateOld">{labels.sortDateOld}</option>
          <option value="timeFast">{labels.sortTimeFast}</option>
          <option value="timeSlow">{labels.sortTimeSlow}</option>
          <option value="mistakesLow">{labels.sortMistakesLow}</option>
          <option value="mistakesHigh">{labels.sortMistakesHigh}</option>
        </select>
      </label>

      {showDemo && (
        <>
          <p className="history-empty">{labels.empty}</p>
          <p className="history-preview-hint">{labels.previewHint}</p>
        </>
      )}

      <div className="history-table-scroll">
        <table className="history-grid-table">
          <thead>
            <tr>
              <th scope="col">{labels.colBoard}</th>
              <th scope="col">{labels.colWhen}</th>
              <th scope="col">{labels.colOutcome}</th>
              <th scope="col">{labels.colMode}</th>
              <th scope="col">{labels.colTime}</th>
              <th scope="col">{labels.colMoves}</th>
              <th scope="col">{labels.colMistakes}</th>
              <th scope="col">{labels.colHints}</th>
              <th scope="col">{labels.colFilled}</th>
              <th scope="col">{labels.colAction}</th>
            </tr>
          </thead>
          <tbody>
            {rowIds.map((rec) => {
              const last = rec.timeline[rec.timeline.length - 1];
              const when = new Date(rec.endedAt);
              const isDemo = rec.id === HISTORY_PREVIEW_RECORD.id;
              const isResumable = rec.outcome !== "won";
              const actionLabel = isResumable ? labels.actionContinue : labels.actionAnalyze;
              const onAction = isResumable ? onContinue : onAnalyze;
              return (
                <tr key={rec.id} className={isDemo ? "history-table-row--demo" : ""}>
                  <td>
                    {isDemo ? (
                      <HistoryMiniBoard values={last} fixed={rec.fixed} outcome={rec.outcome} />
                    ) : (
                      <button
                        type="button"
                        className="history-board-button"
                        aria-label={actionLabel}
                        title={actionLabel}
                        onClick={() => onAction(rec)}
                      >
                        <HistoryMiniBoard values={last} fixed={rec.fixed} outcome={rec.outcome} />
                      </button>
                    )}
                  </td>
                  <td>
                    <time dateTime={when.toISOString()}>
                      {new Intl.DateTimeFormat(langMeta.locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(when)}
                    </time>
                  </td>
                  <td>
                    <span className={rec.outcome === "won" ? "tag-won" : "tag-abandoned"}>
                      {rec.outcome === "won" ? labels.won : labels.abandoned}
                    </span>
                  </td>
                  <td>{rec.mode === "daily" ? dailyLabel : difficultyLabels[rec.difficulty] || rec.difficulty}</td>
                  <td>{formatTime(rec.elapsedSec)}</td>
                  <td>{rec.moveCount}</td>
                  <td>{rec.mistakes}</td>
                  <td>{rec.hintsUsed}</td>
                  <td>
                    {rec.filledFinal}/81
                  </td>
                  <td>
                    {isDemo ? (
                      <span className="history-table-demo-pill">{labels.sampleTag}</span>
                    ) : (
                      <button
                        type="button"
                        className="history-table-action-btn"
                        onClick={() => onAction(rec)}
                      >
                        {actionLabel}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistoryAnalysisView({ record, labels, difficultyLabels, dailyLabel, langMeta }) {
  const last = record.timeline[record.timeline.length - 1];
  const wrongMoves = (record.placements || []).filter((move) => move.kind === "place" && !move.correct);
  const when = new Date(record.endedAt);

  return (
    <div className="history-detail">
      <div className="history-detail-head">
        <div className="history-detail-outcome">
          <span className="tag-won">{labels.won}</span>
          <time dateTime={when.toISOString()}>
            {new Intl.DateTimeFormat(langMeta.locale, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(when)}
          </time>
          <p className="history-detail-sub">
            {record.mode === "daily" ? dailyLabel : difficultyLabels[record.difficulty] || record.difficulty}
          </p>
        </div>
        <div className="history-detail-metrics">
          <Metric value={formatTime(record.elapsedSec)} label={labels.time} />
          <Metric value={record.moveCount} label={labels.moves} />
          <Metric value={record.mistakes} label={labels.mistakes} />
          <Metric value={record.hintsUsed} label={labels.hints} />
        </div>
      </div>

      <div className="history-detail-body">
        <section className="history-replay-panel">
          <p className="eyebrow">{labels.finalBoard}</p>
          <div className="history-board-shell">
            <HistoryReadonlyBoard values={last} fixed={record.fixed} />
          </div>
        </section>

        <section className="history-analysis">
          <h3>{labels.wrongSummary(wrongMoves.length)}</h3>
          {wrongMoves.length === 0 ? (
            <p className="history-muted">{labels.noWrongMoves}</p>
          ) : (
            <ul className="history-wrong-list">
              {wrongMoves.map((move, index) => (
                <li key={`${move.stepIndex}-${move.index}-${index}`}>
                  <span className="history-wrong-step">#{move.stepIndex}</span>
                  {labels.wrongDigit}: {move.value}. {labels.better} {move.better}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function HistoryReadonlyBoard({ values, fixed }) {
  return (
    <div className="sudoku-board history-readonly-board" role="grid" aria-label="History board">
      {values.map((value, index) => (
        <div className={`cell ${fixed[index] ? "given" : ""}`} role="gridcell" key={index}>
          {value || ""}
        </div>
      ))}
    </div>
  );
}

const PRO_FEATURE_ICONS = [Infinity, Sparkles, BarChart3, Palette];

function ProSubscriptionCard({ t, langMeta, isPro, profile, authUser, proBusy, onSubscribe, onSignIn }) {
  const features = t.modals.proFeatures;

  if (isPro) {
    const expiryFormatted = profile.proExpiresAt
      ? new Intl.DateTimeFormat(langMeta.locale, { dateStyle: "medium" }).format(new Date(profile.proExpiresAt))
      : null;

    return (
      <div className="pro-offer-stack">
        <div className="pro-offer-card pro-offer-card--active">
          <div className="pro-active-hero">
            <span className="pro-offer-crown" aria-hidden="true">
              <Crown size={22} strokeWidth={2.2} />
            </span>
            <div>
              <p className="pro-active-status">
                <CheckCircle2 size={18} strokeWidth={2.4} aria-hidden="true" />
                {t.modals.proActive}
              </p>
              {expiryFormatted ? <p className="pro-active-expiry">{t.modals.proUntil(expiryFormatted)}</p> : null}
            </div>
          </div>
          <p className="pro-included-label">{t.modals.proFeatureIncluded}</p>
          <ul className="pro-feature-list" aria-label={t.modals.proFeatureIncluded}>
            {features.map((item, i) => {
              const Icon = PRO_FEATURE_ICONS[i] ?? Sparkles;
              return (
                <li key={item.title} className="pro-feature-row pro-feature-row--active">
                  <span className="pro-feature-icon pro-feature-icon--active" aria-hidden="true">
                    <Icon size={19} strokeWidth={2} />
                  </span>
                  <span className="pro-feature-text">
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <CheckCircle2 className="pro-feature-check" size={20} strokeWidth={2.2} aria-hidden="true" />
                </li>
              );
            })}
          </ul>
        </div>
        <p className="pro-billing-foot">{t.modals.proBillingNote}</p>
      </div>
    );
  }

  return (
    <div className="pro-offer-stack">
      <div className="pro-offer-card">
        <div className="pro-offer-hero">
          <span className="pro-offer-crown" aria-hidden="true">
            <Crown size={22} strokeWidth={2.2} />
          </span>
          <p className="pro-tagline">{t.modals.proTagline}</p>
        </div>
        <ul className="pro-feature-list" aria-label={t.modals.proFeaturesAria}>
          {features.map((item, i) => {
            const Icon = PRO_FEATURE_ICONS[i] ?? Sparkles;
            return (
              <li key={item.title} className="pro-feature-row">
                <span className="pro-feature-icon" aria-hidden="true">
                  <Icon size={19} strokeWidth={2} />
                </span>
                <span className="pro-feature-text">
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="pro-price-caption">{t.modals.proPriceCaption}</p>
      </div>

      {!authUser ? <p className="pro-signin-note">{t.modals.proSignIn}</p> : null}

      <div className="pro-cta-stack">
        <button
          className="pro-button wide"
          type="button"
          disabled={proBusy}
          onClick={authUser ? onSubscribe : onSignIn}
        >
          {proBusy ? t.modals.polarBusy : authUser ? t.modals.proCta : t.modals.proCtaSignIn}
        </button>
      </div>

      <p className="pro-billing-foot">{t.modals.proBillingNote}</p>
    </div>
  );
}

function Modal({ title, eyebrow, wide = false, extraClass = "", closeLabel = "Close", onClose, children }) {
  return (
    <motion.div
      className="modal show"
      aria-hidden="false"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`modal-card ${wide ? "rules-card" : ""} ${extraClass}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        initial={{ y: 16, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, scale: 0.98 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" aria-label={closeLabel} onClick={onClose}>
          x
        </button>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="modal-title">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
}

export default App;
