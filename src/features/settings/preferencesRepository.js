import { BOARD_SIZES, DEFAULT_PREFS, PREFS_KEY, THEMES } from "../../app/config.js";
import { TRANSLATIONS } from "../../i18n/translations.js";

export function clampVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_PREFS.soundVolume;
  return Math.max(0, Math.min(1, number));
}

export function normalizePreferences(preferences = {}) {
  return {
    ...DEFAULT_PREFS,
    ...preferences,
    soundVolume: clampVolume(preferences.soundVolume ?? DEFAULT_PREFS.soundVolume),
    boardSize: BOARD_SIZES.some((size) => size.key === preferences.boardSize)
      ? preferences.boardSize
      : DEFAULT_PREFS.boardSize,
    theme: THEMES.some((theme) => theme.key === preferences.theme) ? preferences.theme : DEFAULT_PREFS.theme,
    language: TRANSLATIONS[preferences.language] ? preferences.language : DEFAULT_PREFS.language,
    smartNotes: Boolean(preferences.smartNotes ?? DEFAULT_PREFS.smartNotes),
    coachVoiceEnabled: Boolean(preferences.coachVoiceEnabled ?? DEFAULT_PREFS.coachVoiceEnabled),
    coachVoiceURI:
      typeof preferences.coachVoiceURI === "string" && preferences.coachVoiceURI
        ? preferences.coachVoiceURI
        : DEFAULT_PREFS.coachVoiceURI,
  };
}

export function loadPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    return normalizePreferences(saved);
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePreferences(preferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.lang = preferences.language;
}
