export const STORAGE_KEY = "sana-sudoku-state-v3";
export const PROFILE_KEY = "sana-sudoku-profile-v1";
export const PREFS_KEY = "sana-sudoku-preferences-v1";
export const BRAND_NAME = "sudocore";
export const BRAND_ICON_SRC = "/sudocore-icon.svg";

export const DEFAULT_PREFS = {
  showFocusLens: true,
  soundEnabled: true,
  soundVolume: 0.75,
  coachVoiceEnabled: false,
  coachVoiceURI: "auto",
  boardSize: "standard",
  theme: "studio",
  language: "ru",
  smartNotes: false,
};

export const BOARD_SIZES = [
  { key: "compact", labelKey: "boardCompact" },
  { key: "standard", labelKey: "boardStandard" },
  { key: "expanded", labelKey: "boardExpanded" },
];

export const LANG_META = {
  ru: { label: "Русский", locale: "ru-RU", speech: "ru-RU" },
  en: { label: "English", locale: "en-US", speech: "en-US" },
  kk: { label: "Қазақша", locale: "kk-KZ", speech: "kk-KZ" },
};

export const THEMES = [
  { key: "studio", label: "Logic Studio" },
  { key: "light", label: "White" },
  { key: "dark", label: "Black" },
  { key: "ocean", label: "Ocean" },
  { key: "sakura", label: "Sakura" },
];

export const LEVELS = [
  { name: "Новичок", min: 0 },
  { name: "Тактик", min: 120 },
  { name: "Мастер", min: 360 },
  { name: "Легенда", min: 760 },
  { name: "Гроссмейстер", min: 1300 },
];

export const DEFAULT_COUNTRY = "Kazakhstan";
export const DEFAULT_CITY = "Алматы";

export const COUNTRY_OPTIONS = ["Kazakhstan", "Kyrgyzstan", "Uzbekistan", "Russia", "Other"];

export const CITY_OPTIONS = [
  { country: "Kazakhstan", city: "Алматы" },
  { country: "Kazakhstan", city: "Astana" },
  { country: "Kazakhstan", city: "Shymkent" },
  { country: "Kazakhstan", city: "Karaganda" },
  { country: "Kazakhstan", city: "Aktobe" },
  { country: "Kazakhstan", city: "Taraz" },
  { country: "Kazakhstan", city: "Pavlodar" },
  { country: "Kazakhstan", city: "Oskemen" },
  { country: "Kyrgyzstan", city: "Bishkek" },
  { country: "Kyrgyzstan", city: "Osh" },
  { country: "Uzbekistan", city: "Tashkent" },
  { country: "Uzbekistan", city: "Samarkand" },
  { country: "Russia", city: "Moscow" },
  { country: "Russia", city: "Saint Petersburg" },
  { country: "Other", city: "Other" },
];

export const EMPTY_PROFILE = {
  name: "Гость",
  city: DEFAULT_CITY,
  country: DEFAULT_COUNTRY,
  xp: 0,
  streak: 0,
  lastPlayed: null,
  solved: 0,
  badges: [],
  dailyResults: {},
  famousBests: {},
  subscriptionTier: "free",
  proExpiresAt: null,
  limitUsage: {},
  achievements: [],
  statsByMode: {},
};
