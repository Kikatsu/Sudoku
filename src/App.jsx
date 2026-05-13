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
  Menu,
  MessageCircle,
  Palette,
  Pencil,
  Play,
  Redo2,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Settings,
  Trophy,
  Undo2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BOARD_SIZES,
  BRAND_ICON_SRC,
  BRAND_NAME,
  CITY_OPTIONS,
  COUNTRY_OPTIONS,
  DEFAULT_CITY,
  DEFAULT_COUNTRY,
  LANG_META,
  THEMES,
} from "./app/config.js";
import { navigateTo, parseAppRoute, ROUTES } from "./app/routes.js";
import { useAuthSession } from "./features/auth/useAuthSession.js";
import { createCollaborationRoom } from "./features/collaboration/collaborationService.js";
import { summarizeAction } from "./features/collaboration/collaborationRules.js";
import { useCollaborationRoom } from "./features/collaboration/useCollaborationRoom.js";
import { TRANSLATIONS } from "./i18n/translations.js";
import { getElapsed, loadGame, saveGame, withHistory } from "./features/game/gameRepository.js";
import { GAME_ACTIONS, useSudokuGame } from "./features/game/useSudokuGame.js";
import { useDailyLeaderboard } from "./features/leaderboard/useDailyLeaderboard.js";
import { getLevel, getNextLevel, loadProfile, saveProfile } from "./features/profile/profileRepository.js";
import { clampVolume, loadPreferences, savePreferences } from "./features/settings/preferencesRepository.js";
import {
  FREE_TIER_LIMITS,
  canAnalyzeHistory,
  canStartGame,
  canUseCoach,
  isProfilePro,
  isThemePro,
  recordLimitUsage,
  startProCheckout,
} from "./features/subscription/subscriptionService.js";
import { useCloudSync } from "./features/sync/useCloudSync.js";
import { createCoachStep, createLessonStep } from "./lib/coach.js";
import { getCoachVoiceOptions, pickBestCoachVoice } from "./lib/coachSpeech.js";
import { playGameSound } from "./lib/gameSounds.js";
import { upsertDailyLeaderboardEntry, upsertHistoryRecords } from "./lib/cloudSync.js";
import {
  HISTORY_PREVIEW_RECORD,
  appendToArchive,
  gameHasProgress,
  loadArchive,
  restoreGameFromRecord,
  sortRecords,
} from "./lib/gameHistory.js";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient.js";
import {
  DIFFICULTIES,
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
} from "./lib/sudoku.js";
import {
  FAMOUS_PUZZLES,
  getFamousPuzzleById,
  recordFamousBest,
} from "./lib/famousPuzzles.js";
import { LEARNING_LEVELS, getLearningLevelById, isLessonUnlocked } from "./lib/learningLevels.js";
import {
  loadLearningProgress,
  markLessonCompleted,
  markLessonXpAwarded,
  saveLearningProgress,
} from "./lib/learningProgress.js";
import { SUDOKU_TECHNIQUES, TECHNIQUE_TIERS } from "./lib/techniques.js";

const AUTH_RETURN_KEY = "sudocore-auth-return-v1";
const POST_AUTH_ACTION_KEY = "sudocore-post-auth-action-v1";
const POST_AUTH_ACTIONS = {
  shareCollaboration: "share-collaboration",
};

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

const LANDING_FEATURE_ICONS = {
  coach: Sparkles,
  learn: BookOpen,
  daily: CalendarDays,
  famous: Trophy,
  leaderboard: BarChart3,
  sync: RefreshCw,
  collaboration: Share2,
  pro: Crown,
};

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

const LANDING_DEMO_GRID = [
  5, 3, 0, 0, 7, 0, 0, 0, 0,
  6, 0, 0, 1, 9, 5, 0, 0, 0,
  0, 9, 8, 0, 0, 0, 0, 6, 0,
  8, 0, 0, 0, 6, 0, 0, 0, 3,
  4, 0, 0, 8, 0, 3, 0, 0, 1,
  7, 0, 0, 0, 2, 0, 0, 0, 6,
  0, 6, 0, 0, 0, 0, 2, 8, 0,
  0, 0, 0, 4, 1, 9, 0, 0, 5,
  0, 0, 0, 0, 8, 0, 0, 7, 9,
];

const LANDING_DEMO_MOVES = [
  { index: 2, value: 4, player: "Mira", color: "#137466" },
  { index: 10, value: 7, player: "Timur", color: "#4659b7" },
  { index: 40, value: 5, player: "Aruzhan", color: "#b87922" },
  { index: 62, value: 4, player: "Mira", color: "#137466" },
];

function LandingLiveSudoku({ labels, onPlay }) {
  const [step, setStep] = useState(0);
  const visibleMoves = LANDING_DEMO_MOVES.slice(0, step + 1);
  const activeMove = LANDING_DEMO_MOVES[step];
  const valueByIndex = new Map(visibleMoves.map((move) => [move.index, move.value]));
  const activeRow = Math.floor(activeMove.index / 9);
  const activeCol = activeMove.index % 9;
  const nextStep = () => setStep((current) => (current + 1) % LANDING_DEMO_MOVES.length);

  useEffect(() => {
    const timer = window.setInterval(nextStep, 1800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="landing-live-demo">
      <button className="landing-live-board" type="button" aria-label={labels.boardAria} onClick={nextStep}>
        {LANDING_DEMO_GRID.map((given, index) => {
          const row = Math.floor(index / 9);
          const col = index % 9;
          const played = valueByIndex.get(index);
          const active = index === activeMove.index;
          const peer =
            row === activeRow ||
            col === activeCol ||
            (Math.floor(row / 3) === Math.floor(activeRow / 3) &&
              Math.floor(col / 3) === Math.floor(activeCol / 3));
          return (
            <span
              key={index}
              className={[
                "landing-live-cell",
                given ? "is-given" : "",
                played ? "is-played" : "",
                peer ? "is-peer" : "",
                active ? "is-active" : "",
                col === 2 || col === 5 ? "is-box-right" : "",
                row === 2 || row === 5 ? "is-box-bottom" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {given || played || <i />}
            </span>
          );
        })}
        <span
          className="landing-remote-cursor landing-remote-cursor--one"
          style={{ "--cursor-color": LANDING_DEMO_MOVES[(step + 1) % LANDING_DEMO_MOVES.length].color }}
        >
          {LANDING_DEMO_MOVES[(step + 1) % LANDING_DEMO_MOVES.length].player}
        </span>
        <span
          className="landing-remote-cursor landing-remote-cursor--two"
          style={{ "--cursor-color": LANDING_DEMO_MOVES[(step + 2) % LANDING_DEMO_MOVES.length].color }}
        >
          {LANDING_DEMO_MOVES[(step + 2) % LANDING_DEMO_MOVES.length].player}
        </span>
      </button>
      <div className="landing-friends-note">
        <span>
          <Share2 size={17} aria-hidden="true" />
          {labels.previewBadge}
        </span>
        <p>{labels.previewText}</p>
        <div className="landing-friends-row" aria-label={labels.playersAria}>
          {labels.players.map((player) => (
            <strong key={player}>{player.slice(0, 1)}</strong>
          ))}
          <small>{labels.liveStatus(activeMove.player, activeMove.value)}</small>
        </div>
        <button type="button" onClick={onPlay}>
          {labels.previewCta}
        </button>
      </div>
    </div>
  );
}

function AuthPage({ labels, brandTagline, navAria, onBack, onComplete = onBack, cloudAvailable, onSignedIn }) {
  const [mode, setMode] = useState("signin");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cityOptions = CITY_OPTIONS.filter((option) => option.country === country);

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
    const nickname = String(form.nickname?.value || "").trim();
    const selectedCountry = String(form.country?.value || DEFAULT_COUNTRY).trim();
    const selectedCity = String(form.city?.value || DEFAULT_CITY).trim();
    if (!email || !password) {
      setError(labels.error);
      return;
    }
    if (mode === "signup" && !nickname) {
      setError(labels.error);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signErr) throw signErr;
        onSignedIn?.();
        onComplete?.();
      } else {
        const { data, error: signErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname,
              city: selectedCity,
              country: selectedCountry,
            },
          },
        });
        if (signErr) throw signErr;
        if (data.session) {
          onSignedIn?.();
          onComplete?.();
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
                {mode === "signup" ? (
                  <>
                    <label className="auth-field">
                      <span>{labels.nickname}</span>
                      <input
                        name="nickname"
                        type="text"
                        autoComplete="nickname"
                        placeholder="Aruzhan"
                        minLength={2}
                        maxLength={32}
                        disabled={busy}
                        required
                      />
                    </label>
                    <label className="auth-field">
                      <span>{labels.country}</span>
                      <select
                        name="country"
                        value={country}
                        onChange={(event) => {
                          const nextCountry = event.target.value;
                          setCountry(nextCountry);
                          setCity(CITY_OPTIONS.find((option) => option.country === nextCountry)?.city || DEFAULT_CITY);
                        }}
                        disabled={busy}
                      >
                        {COUNTRY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="auth-field">
                      <span>{labels.city}</span>
                      <select name="city" value={city} onChange={(event) => setCity(event.target.value)} disabled={busy}>
                        {cityOptions.map((option) => (
                          <option key={`${option.country}-${option.city}`} value={option.city}>
                            {option.city}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : null}
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

function LandingPage({
  labels,
  navLabels,
  authLabel,
  brandTagline,
  navAria,
  language,
  languageOptions,
  onLanguageChange,
  onPlay,
  onLearn,
  onFamous,
  onSignIn,
}) {
  return (
    <>
      <header className="topbar landing-topbar" aria-label={navAria}>
        <Brand tagline={brandTagline} />
        <div className="landing-nav-actions">
          <select
            className="landing-language-select"
            aria-label={labels.languageLabel}
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
          >
            {Object.entries(languageOptions).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
          <button className="mini-button icon-button" type="button" onClick={onLearn}>
            <BookOpen size={17} aria-hidden="true" />
            {navLabels.learn}
          </button>
          <button className="mini-button icon-button" type="button" onClick={onSignIn}>
            <LogIn size={17} aria-hidden="true" />
            {authLabel}
          </button>
        </div>
      </header>

      <main className="landing-page">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="eyebrow">{labels.eyebrow}</p>
            <h1>{labels.title}</h1>
            <p className="landing-lead">{labels.lead}</p>
            <div className="landing-cta-row">
              <button className="landing-primary-cta" type="button" onClick={onPlay}>
                <Play size={18} aria-hidden="true" />
                {labels.primaryCta}
              </button>
              <button className="landing-secondary-cta" type="button" onClick={onLearn}>
                <BookOpen size={18} aria-hidden="true" />
                {labels.secondaryCta}
              </button>
            </div>
            <div className="landing-proof-strip" aria-label={labels.statsAria}>
              {labels.stats.map((item) => (
                <span key={item.label}>
                  <strong>{item.value}</strong>
                  <small>{item.label}</small>
                </span>
              ))}
            </div>
          </div>

          <div className="landing-preview" aria-label={labels.previewAria}>
            <LandingLiveSudoku labels={labels} onPlay={onPlay} />
          </div>
        </section>

        <section className="landing-feature-band" aria-label={labels.featuresAria}>
          {labels.features.map((feature) => {
            const Icon = LANDING_FEATURE_ICONS[feature.icon] || Sparkles;
            return (
              <article className="landing-feature" key={feature.title}>
                <span className="landing-feature-icon" aria-hidden="true">
                  <Icon size={19} />
                </span>
                <h2>{feature.title}</h2>
                <p>{feature.detail}</p>
              </article>
            );
          })}
        </section>

        <section className="landing-quote" aria-label={labels.quoteAria}>
          <div className="landing-quote-copy">
            <p className="eyebrow">{labels.quoteEyebrow}</p>
            <blockquote>{labels.quoteText}</blockquote>
            <div className="landing-quote-person">
              <strong>{labels.quoteName}</strong>
              <span>{labels.quoteRole}</span>
            </div>
            <p className="landing-quote-note">{labels.quoteNote}</p>
          </div>
          <figure className="landing-quote-figure">
            <img src="/maki-kaji-sudoku.jpg" alt={labels.quoteImageAlt} />
            <figcaption>
              <a href="https://commons.wikimedia.org/wiki/File:Maki_Kaji_(5607045477).jpg" target="_blank" rel="noreferrer">
                {labels.quoteCredit}
              </a>
            </figcaption>
          </figure>
        </section>

        <section className="landing-flow">
          <div>
            <p className="eyebrow">{labels.flowEyebrow}</p>
            <h2>{labels.flowTitle}</h2>
          </div>
          <div className="landing-flow-steps">
            {labels.flowSteps.map((step, index) => (
              <article key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-final">
          <div>
            <p className="eyebrow">{labels.finalEyebrow}</p>
            <h2>{labels.finalTitle}</h2>
            <p>{labels.finalLead}</p>
          </div>
          <div className="landing-cta-row">
            <button className="landing-primary-cta" type="button" onClick={onPlay}>
              <Play size={18} aria-hidden="true" />
              {labels.primaryCta}
            </button>
            <button className="landing-secondary-cta" type="button" onClick={onFamous}>
              <Trophy size={18} aria-hidden="true" />
              {labels.famousCta}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

export function createInitialGame(route = { kind: "play", lessonId: null }, loaded = null) {
  if (route.kind === "learn" && route.lessonId) {
    const def = getLearningLevelById(route.lessonId);
    if (def) return createGame(def.difficulty, "learning", { learningLevelId: route.lessonId });
  }
  if (loaded) return loaded;
  return createGame("easy", "free");
}

function App() {
  const { game, setGame, dispatchGame } = useSudokuGame(() => createInitialGame(parseAppRoute(), loadGame()));
  const [profile, setProfile] = useState(loadProfile);
  const [preferences, setPreferences] = useState(loadPreferences);
  const [coachMessage, setCoachMessageState] = useState(null);
  const [coachMode, setCoachMode] = useState("hint");
  const [coachStep, setCoachStep] = useState(null);
  const [speechVoices, setSpeechVoices] = useState([]);
  const [proofVisible, setProofVisible] = useState(false);
  const [toast, setToast] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const collaborationRewardRef = useRef(null);
  const { authUser, authReady, signOut } = useAuthSession();
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
  const todayKey = getDateKey();
  const { cloudSynced, setCloudSynced } = useCloudSync({
    authUser,
    game,
    setGame,
    profile,
    setProfile,
    preferences,
    setPreferences,
    setHistoryRecords,
  });
  const { dailyLeaderboard, refreshDailyLeaderboard } = useDailyLeaderboard({
    dateKey: todayKey,
    city: profile.city || DEFAULT_CITY,
    cloudSynced,
  });
  const xpSpan = Math.max(1, nextLevel.min - level.min);
  const xpProgress =
    nextLevel.name === level.name ? 100 : Math.max(0, Math.min(100, ((profile.xp - level.min) / xpSpan) * 100));

  const sortedHistory = useMemo(
    () => sortRecords(historyRecords, historySort),
    [historyRecords, historySort],
  );

  const leaderboard = useMemo(() => {
    const leaders = dailyLeaderboard.map((entry) => ({
      id: `${entry.user_id}-${entry.date_key}`,
      name: entry.nickname,
      city: entry.country ? `${entry.city}, ${entry.country}` : entry.city,
      seconds: entry.seconds,
    }));
    const dailyTime = profile.dailyResults?.[todayKey];
    if (dailyTime) {
      const ownName = authUser ? profile.name : "Вы";
      const ownCity = `${profile.city || DEFAULT_CITY}, ${profile.country || DEFAULT_COUNTRY}`;
      const alreadyListed = leaders.some((leader) => leader.name === ownName && leader.seconds === dailyTime);
      if (!alreadyListed) leaders.push({
        id: "local-daily",
        name: authUser ? profile.name : "Вы",
        city: ownCity,
        seconds: dailyTime,
      });
    }
    return leaders.sort((a, b) => a.seconds - b.seconds).slice(0, 5);
  }, [dailyLeaderboard, profile, authUser, todayKey]);

  const isPro = isProfilePro(profile);
  const isCollaborationRoute = hashRoute.kind === "collab" && Boolean(hashRoute.roomId);
  const collaborationLabels = t.collaboration || TRANSLATIONS.en.collaboration;
  const collaboration = useCollaborationRoom({
    roomId: isCollaborationRoute ? hashRoute.roomId : null,
    authUser,
    profile,
    game,
    setGame,
    preferences,
    onToast: showToast,
    labels: collaborationLabels,
  });

  useEffect(() => {
    if (!collaboration.enabled) return;
    const ready = collaboration.pendingProposals.find((proposal) => {
      const summary = collaboration.voteSummary(proposal);
      return summary.approvalCount >= summary.threshold;
    });
    if (ready) void collaboration.approveProposal(ready);
  }, [collaboration.enabled, collaboration.pendingProposals, collaboration.voteSummary, collaboration.approveProposal]);

  useEffect(() => {
    if (!collaboration.enabled || !collaboration.isHost || collaboration.room?.status !== "solved" || !game.completed) return;
    const key = `${collaboration.room.id}:${collaboration.room.boardVersion}`;
    if (collaborationRewardRef.current === key) return;
    collaborationRewardRef.current = key;
    completePuzzle(game);
  }, [collaboration.enabled, collaboration.isHost, collaboration.room?.status, collaboration.room?.id, collaboration.room?.boardVersion, game.completed]);

  useEffect(() => {
    if (!isPro && isThemePro(preferences.theme)) {
      setPreferences((current) => ({ ...current, theme: "studio" }));
    }
  }, [isPro, preferences.theme]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    savePreferences(preferences);
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
      setSpeechVoices(synth.getVoices());
    };
    prime();
    synth.addEventListener("voiceschanged", prime);
    return () => synth.removeEventListener("voiceschanged", prime);
  }, []);

  useEffect(() => {
    if (!preferences.coachVoiceEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [preferences.coachVoiceEnabled]);

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
        k.dispatchGame({ type: GAME_ACTIONS.TOGGLE_NOTE_MODE });
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

  function currentRouteForReturn() {
    const current = window.location.hash || ROUTES.landing;
    return parseAppRoute(current).kind === "sign-in" ? ROUTES.landing : current;
  }

  function readAuthReturnRoute() {
    try {
      const saved = window.sessionStorage?.getItem(AUTH_RETURN_KEY);
      if (saved && parseAppRoute(saved).kind !== "sign-in") return saved;
    } catch {
      // Session storage can be unavailable in some embedded browser contexts.
    }
    return ROUTES.landing;
  }

  function clearAuthReturnRoute() {
    try {
      window.sessionStorage?.removeItem(AUTH_RETURN_KEY);
    } catch {
      // Ignore storage failures; routing can still fall back to home.
    }
  }

  function clearPostAuthAction() {
    try {
      window.sessionStorage?.removeItem(POST_AUTH_ACTION_KEY);
    } catch {
      // Ignore storage failures; there may be no pending post-auth action.
    }
  }

  function requestSignIn({ returnTo = currentRouteForReturn(), postAuthAction = "" } = {}) {
    try {
      if (returnTo && parseAppRoute(returnTo).kind !== "sign-in") {
        window.sessionStorage?.setItem(AUTH_RETURN_KEY, returnTo);
      }
      if (postAuthAction) {
        window.sessionStorage?.setItem(POST_AUTH_ACTION_KEY, postAuthAction);
      }
    } catch {
      // Navigation still works even if storage is blocked.
    }
    navigateTo(ROUTES.signIn);
  }

  function playFeedback(kind) {
    if (!preferences.soundEnabled) return;
    playGameSound(kind, preferences.soundVolume);
  }

  function speakCoach(message) {
    if (
      !preferences.coachVoiceEnabled ||
      preferences.soundVolume <= 0 ||
      !("speechSynthesis" in window)
    ) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = langMeta.speech;
    const voice = pickBestCoachVoice(
      window.speechSynthesis.getVoices(),
      langMeta.speech,
      preferences.coachVoiceURI,
    );
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
    const limit = canAnalyzeHistory(profile, isPro, todayKey);
    if (!limit.allowed) {
      showToast(t.limits[limit.reason]);
      setActiveModal("pro");
      return;
    }
    if (!isPro) {
      setProfile((current) => recordLimitUsage(current, limit.usageKey, todayKey));
    }
    setHistoryAnalysisRecord(record);
    setActiveModal("historyAnalysis");
  }

  function startNewGame(difficulty = game.difficulty, mode = "free") {
    const limit = canStartGame(profile, isPro, mode, todayKey);
    if (!limit.allowed) {
      showToast(t.limits[limit.reason]);
      setActiveModal("pro");
      return;
    }
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
    if (!isPro) {
      setProfile((current) => recordLimitUsage(current, limit.usageKey, todayKey));
    }
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
    navigateTo(ROUTES.play);
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
    dispatchGame({ type: GAME_ACTIONS.SELECT_CELL, index });
    collaboration.updateSelection(index);
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

    if (collaboration.enabled) {
      void collaboration.proposeMove({
        kind: game.noteMode ? "note" : "place",
        index,
        number,
      }).then((result) => {
        if (result?.ok) showToast(collaborationLabels.toasts.moveProposed);
      });
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
          wrongEntries: [
            ...(current.wrongEntries || []),
            {
              index,
              value: number,
              better: current.solution[index],
              elapsedSec: getElapsed(current),
            },
          ],
          activityLog: [
            ...(current.activityLog || []),
            {
              kind: "wrong",
              index,
              value: number,
              elapsedSec: getElapsed(current),
            },
          ],
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
    if (preferences.smartNotes) {
      const peers = getPeers(index);
      next.notes = next.notes.map((note, noteIndex) =>
        peers.has(noteIndex) ? note.filter((candidate) => candidate !== number) : note,
      );
    }
    next.notes[index] = [];
    next.hintCells = [];
    next.lastNumber = number;
    next.activityLog = [
      ...(next.activityLog || []),
      {
        kind: "place",
        index,
        value: number,
        elapsedSec: getElapsed(game),
      },
    ];
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

    if (collaboration.enabled) {
      void collaboration.proposeMove({ kind: "erase", index }).then((result) => {
        if (result?.ok) showToast(collaborationLabels.toasts.moveProposed);
      });
      return;
    }

    const next = withHistory(game);
    next.values = [...next.values];
    next.notes = next.notes.map((note) => [...note]);
    next.values[index] = 0;
    next.notes[index] = preferences.smartNotes ? getCandidates(next.values, index) : [];
    next.hintCells = [];
    commitGame(next);
    playFeedback("erase");
  }

  function undo() {
    if (collaboration.enabled || game.history.length === 0 || game.completed) return;
    dispatchGame({ type: GAME_ACTIONS.UNDO });
    playFeedback("undo");
  }

  function redo() {
    if (collaboration.enabled || game.future.length === 0 || game.completed) return;
    dispatchGame({ type: GAME_ACTIONS.REDO });
    playFeedback("redo");
  }

  function publishDailyLeaderboardResult(nextProfile, seconds, dateKey) {
    if (!supabase || !authUser?.id) return;
    void upsertDailyLeaderboardEntry(supabase, authUser.id, {
      dateKey,
      nickname: nextProfile.name,
      city: nextProfile.city || DEFAULT_CITY,
      country: nextProfile.country || DEFAULT_COUNTRY,
      seconds,
    })
      .then(() => refreshDailyLeaderboard())
      .catch((error) => console.warn("Daily leaderboard publish failed.", error));
  }

  function completePuzzle(nextGame) {
    const finalTime = getElapsed(nextGame);
    const review = createGameReview(nextGame, finalTime);
    if (nextGame.suppressVictoryRewards) {
      setGame({
        ...nextGame,
        completed: true,
        elapsedBefore: finalTime,
        history: [],
        future: [],
        awardXp: 0,
        review,
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
          review,
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
        review,
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
      review,
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

      const nextDailyResults =
        nextGame.mode === "daily"
          ? {
              ...current.dailyResults,
              [today]: current.dailyResults?.[today] ? Math.min(current.dailyResults[today], finalTime) : finalTime,
            }
          : current.dailyResults;
      const nextProfile = {
        ...current,
        xp: current.xp + gainedXp,
        solved: current.solved + 1,
        streak: nextStreak,
        lastPlayed: isFamous ? current.lastPlayed : today,
        badges: [...badges],
        dailyResults: nextDailyResults,
        famousBests: nextFamousBests,
      };
      if (nextGame.mode === "daily") {
        publishDailyLeaderboardResult(nextProfile, nextDailyResults[today], today);
      }
      return nextProfile;
    });
    showToast(t.toasts.solved(gainedXp));
    playFeedback("complete");
  }

  function requestCoach(mode) {
    if (game.completed) return;
    const limit = canUseCoach(profile, isPro, todayKey);
    if (!limit.allowed) {
      showToast(t.limits[limit.reason]);
      setActiveModal("pro");
      return;
    }
    const selectedNumber =
      game.selected === null || game.selected === undefined
        ? game.lastNumber
        : game.values[game.selected] || game.lastNumber;
    const step =
      mode === "lesson"
        ? createLessonStep(game, { technique: getLearningLevelById(game.learningLevelId)?.technique })
        : createCoachStep(game, mode, {
            index: game.selected,
            number: selectedNumber,
          });

    setCoachMode(mode);
    setCoachStep(step);
    setProofVisible(mode !== "hint");

    if (mode === "hint" && !["conflict", "instruction"].includes(step.kind)) {
      dispatchGame({
        type: GAME_ACTIONS.REQUEST_HINT,
        countHint: true,
        target: step.target,
        number: step.number,
      });
    } else if (Number.isInteger(step.target)) {
      dispatchGame({
        type: GAME_ACTIONS.REQUEST_HINT,
        countHint: false,
        target: step.target,
        number: step.number,
      });
    }

    setCoachMessage(`${step.title}: ${step.summary} ${step.explanation}`);
    if (!isPro) {
      setProfile((current) => recordLimitUsage(current, limit.usageKey, todayKey));
    }
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

    if (collaboration.enabled) {
      void collaboration.proposeMove({
        kind: "place",
        index: coachStep.target,
        number: coachStep.number,
      }).then((result) => {
        if (result?.ok) showToast(collaborationLabels.toasts.moveProposed);
      });
      setProofVisible(false);
      return;
    }

    const next = withHistory(game);
    next.values = [...next.values];
    next.notes = next.notes.map((note) => [...note]);
    next.values[coachStep.target] = coachStep.number;
    if (preferences.smartNotes) {
      const peers = getPeers(coachStep.target);
      next.notes = next.notes.map((note, noteIndex) =>
        peers.has(noteIndex) ? note.filter((candidate) => candidate !== coachStep.number) : note,
      );
    }
    next.notes[coachStep.target] = [];
    next.lastNumber = coachStep.number;
    next.selected = coachStep.target;
    next.hintCells = [];
    next.activityLog = [
      ...(next.activityLog || []),
      {
        kind: "coach",
        index: coachStep.target,
        value: coachStep.number,
        technique: coachStep.technique,
        elapsedSec: getElapsed(game),
      },
    ];
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
    dispatchGame,
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

    dispatchGame({ type: GAME_ACTIONS.SELECT_CELL, index: next[0] * 9 + next[1] });
  }

  async function handleAuthNavClick() {
    if (authUser && supabase) {
      await signOut();
      setCloudSynced(false);
      clearAuthReturnRoute();
      clearPostAuthAction();
      showToast(t.toasts.signedOut);
      return;
    }
    requestSignIn();
  }

  async function openPolarCheckout() {
    if (!authUser) {
      showToast(t.modals.proSignIn);
      return;
    }
    setProBusy(true);
    try {
      const { url, error } = await startProCheckout();
      if (error || !url) {
        showToast(t.modals.polarFail);
        return;
      }
      window.location.href = url;
    } finally {
      setProBusy(false);
    }
  }

  async function shareCollaborationRoom() {
    if (!supabase || !isSupabaseConfigured) {
      showToast(collaborationLabels.toasts.needCloud);
      return;
    }
    if (!authUser) {
      showToast(collaborationLabels.toasts.signInRequired);
      requestSignIn({ postAuthAction: POST_AUTH_ACTIONS.shareCollaboration });
      return;
    }
    try {
      const room = await createCollaborationRoom(supabase, {
        authUser,
        profile,
        game,
        isPro,
      });
      const link = `${window.location.origin}${window.location.pathname}${ROUTES.collab(room.id)}`;
      const copied = await copyCollaborationLink(link);
      showToast(copied ? collaborationLabels.toasts.linkCopied : collaborationLabels.toasts.linkReady);
      navigateTo(ROUTES.collab(room.id));
    } catch (error) {
      showToast(error?.message || collaborationLabels.toasts.createFailed);
    }
  }

  async function copyCollaborationLink(link) {
    if (!navigator.clipboard?.writeText) return false;
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    if (!authUser || !authReady || hashRoute.kind === "sign-in") return;
    let action = "";
    try {
      action = window.sessionStorage?.getItem(POST_AUTH_ACTION_KEY) || "";
      if (action) window.sessionStorage?.removeItem(POST_AUTH_ACTION_KEY);
    } catch {
      return;
    }
    if (action === POST_AUTH_ACTIONS.shareCollaboration) {
      void shareCollaborationRoom();
    }
  }, [authUser, authReady, hashRoute.kind]);

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
            onComplete={() => {
              const returnTo = readAuthReturnRoute();
              clearAuthReturnRoute();
              navigateTo(returnTo);
            }}
            onBack={() => {
              const returnTo = readAuthReturnRoute();
              clearAuthReturnRoute();
              clearPostAuthAction();
              navigateTo(returnTo);
            }}
          />
        </div>
        <div className={`toast ${toast ? "show" : ""}`} aria-live="polite">
          {toast}
        </div>
      </>
    );
  }

  if (isCollaborationRoute && !authUser) {
    return (
      <>
        <div className="app-shell">
          <AuthPage
            labels={t.auth}
            brandTagline={t.tagline}
            navAria={t.aria.nav}
            cloudAvailable={isSupabaseConfigured}
            onSignedIn={(msg) => showToast(msg || t.toasts.signedIn)}
            onComplete={() => {
              clearAuthReturnRoute();
            }}
            onBack={() => {
              clearAuthReturnRoute();
              clearPostAuthAction();
              navigateTo(ROUTES.play);
            }}
          />
        </div>
        <div className={`toast ${toast ? "show" : ""}`} aria-live="polite">
          {toast}
        </div>
      </>
    );
  }

  if (hashRoute.kind === "landing") {
    return (
      <>
        <div className="app-shell">
          <LandingPage
            labels={t.landing}
            navLabels={t.nav}
            authLabel={authUser ? t.nav.signOut : t.nav.signIn}
            brandTagline={t.tagline}
            navAria={t.aria.nav}
            language={preferences.language}
            languageOptions={LANG_META}
            onLanguageChange={(languageKey) => setPreferences((current) => ({ ...current, language: languageKey }))}
            onPlay={() => navigateTo(ROUTES.play)}
            onLearn={() => navigateTo(ROUTES.learn)}
            onFamous={() => navigateTo(ROUTES.famous)}
            onSignIn={() => void handleAuthNavClick()}
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
              navigateTo(ROUTES.play);
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
              navigateTo(ROUTES.play);
            }}
            onTechniques={() => {
              navigateTo(ROUTES.techniques);
            }}
            onSelectLesson={(id) => {
              if (!isLessonUnlocked(id, loadLearningProgress().completedIds)) {
                showToast(t.learning.locked);
                return;
              }
              navigateTo(ROUTES.lesson(id));
            }}
          />
        </div>
        <div className={`toast ${toast ? "show" : ""}`} aria-live="polite">
          {toast}
        </div>
      </>
    );
  }

  if (hashRoute.kind === "techniques") {
    return (
      <>
        <div className="app-shell">
          <TechniquesPage
            labels={t.learning}
            brandTagline={t.tagline}
            navAria={t.aria.nav}
            language={preferences.language}
            onBack={() => {
              navigateTo(ROUTES.learn);
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
      <header className={`topbar main-topbar ${mobileMenuOpen ? "is-open" : ""}`} aria-label={t.aria.nav}>
        <Brand tagline={t.tagline} />

        <button
          className="mini-button icon-button mobile-menu-button"
          type="button"
          aria-label={mobileMenuOpen ? t.actions.close : "Menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="primary-actions"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          <span>{mobileMenuOpen ? t.actions.close : "Menu"}</span>
        </button>

        <div className="top-actions" id="primary-actions">
          <IconButton
            icon={BookOpen}
            label={t.nav.learn}
            variant="famous"
            onClick={() => {
              setMobileMenuOpen(false);
              navigateTo(ROUTES.learn);
            }}
          />
          <IconButton icon={Trophy} label={t.nav.famous} variant="famous" onClick={() => { setMobileMenuOpen(false); navigateTo(ROUTES.famous); }} />
          <IconButton icon={Settings} label={t.nav.settings} onClick={() => { setMobileMenuOpen(false); setActiveModal("settings"); }} />
          <IconButton icon={HelpCircle} label={t.nav.rules} onClick={() => { setMobileMenuOpen(false); setActiveModal("rules"); }} />
          <IconButton icon={Crown} label={t.nav.pro} variant="pro" onClick={() => { setMobileMenuOpen(false); setActiveModal("pro"); }} />
          <IconButton icon={LogIn} label={authUser ? t.nav.signOut : t.nav.signIn} variant="auth" onClick={() => { setMobileMenuOpen(false); handleAuthNavClick(); }} />
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
                  <button className="mini-button learning-back" type="button" onClick={() => { navigateTo(ROUTES.learn); }}>
                    <ArrowLeft size={17} aria-hidden="true" />
                    {t.learning.back}
                  </button>
                </>
              ) : (
                <>
                  <p className="eyebrow">
                    {isCollaborationRoute ? collaborationLabels.eyebrow : game.mode === "daily" ? t.modes.daily : t.modes.free} · {game.generator.clues} {t.stats.hints}
                  </p>
                  <h1>
                    {isCollaborationRoute
                      ? collaborationLabels.title
                      : game.mode === "daily"
                        ? t.modes.dailyTitle
                        : `${t.difficulties[game.difficulty]} ${t.modes.freeTitle}`}
                  </h1>
                </>
              )}
            </div>
            <div className="live-stats" aria-label={t.aria.stats}>
              <Metric value={formatTime(elapsed)} label={t.stats.time} />
              <Metric value={game.mistakes} label={t.stats.mistakes} />
              <Metric value={game.hintsUsed} label={t.stats.hints} />
            </div>
          </div>

          {!isCollaborationRoute ? (
            <div className="share-strip">
              <div>
                <p className="eyebrow">{collaborationLabels.eyebrow}</p>
                <h2>{collaborationLabels.room}</h2>
              </div>
              <button className="mini-button icon-button share-strip-button" type="button" onClick={() => void shareCollaborationRoom()}>
                <Share2 size={17} aria-hidden="true" />
                {collaborationLabels.actions.share}
              </button>
            </div>
          ) : null}

          {game.mode === "learning" || isCollaborationRoute ? null : (
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
                <RemoteSelectionOverlays selections={collaboration.remoteSelections} />
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
                    <WinReview review={game.review} labels={t.learning} />
                    <div className="win-actions">
                      {game.mode === "learning" && game.learningLevelId ? (
                        <>
                          <button type="button" onClick={() => { navigateTo(ROUTES.learn); }}>
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
            <IconButton icon={Pencil} label={t.actions.pencil} active={game.noteMode} onClick={() => dispatchGame({ type: GAME_ACTIONS.TOGGLE_NOTE_MODE })} />
            <IconButton icon={Eraser} label={t.actions.erase} onClick={eraseCell} />
            <IconButton icon={Undo2} label={t.actions.undo} disabled={collaboration.enabled || game.history.length === 0} onClick={undo} />
            <IconButton icon={Redo2} label={t.actions.redo} disabled={collaboration.enabled || game.future.length === 0} onClick={redo} />
            <IconButton
              icon={RefreshCw}
              label={t.actions.newGame}
              disabled={collaboration.enabled}
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
                    records={isPro ? sortedHistory : sortedHistory.slice(0, FREE_TIER_LIMITS.historyVisibleRecords)}
                    totalRecords={sortedHistory.length}
                    isPro={isPro}
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
          {isCollaborationRoute ? (
            <CollaborationPanel
              collaboration={collaboration}
              labels={collaborationLabels}
              onCopyLink={async () => {
                const link = `${window.location.origin}${window.location.pathname}${ROUTES.collab(hashRoute.roomId)}`;
                const copied = await copyCollaborationLink(link);
                showToast(copied ? collaborationLabels.toasts.linkCopied : collaborationLabels.toasts.linkReady);
              }}
            />
          ) : null}
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
                <h2>{profile.city || DEFAULT_CITY}</h2>
              </div>
              <span className="city-filter">{t.panels.local}</span>
            </div>
            <ol className="leaderboard">
              {leaderboard.map((leader) => (
                <li key={leader.id || `${leader.name}-${leader.seconds}`}>
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
              isPro={isPro}
              voiceOptions={getCoachVoiceOptions(speechVoices, langMeta.speech)}
              onChange={(next) => setPreferences((current) => ({ ...current, ...next }))}
              onUpgrade={() => setActiveModal("pro")}
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
                requestSignIn();
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

function RemoteSelectionOverlays({ selections }) {
  if (!selections?.length) return null;
  const byCell = new Map();
  for (const selection of selections) {
    if (!Number.isInteger(selection.index)) continue;
    const list = byCell.get(selection.index) || [];
    list.push(selection);
    byCell.set(selection.index, list);
  }
  return (
    <div className="remote-selection-layer" aria-hidden="true">
      {[...byCell.entries()].map(([index, cellSelections]) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const primary = cellSelections[0];
        return (
          <div
            key={index}
            className="remote-selection"
            style={{
              "--row": row,
              "--col": col,
              "--selection-color": primary.color,
            }}
          >
            <div className="remote-selection__labels">
              {cellSelections.slice(0, 3).map((selection) => (
                <span key={selection.userId} style={{ "--selection-color": selection.color }}>
                  {selection.name}
                </span>
              ))}
              {cellSelections.length > 3 ? <span>+{cellSelections.length - 3}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
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

function CollaborationPanel({ collaboration, labels, onCopyLink }) {
  const [draft, setDraft] = useState("");
  const activeIds = new Set(collaboration.activeMembers.map((member) => member.user_id));

  async function handleSend(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    await collaboration.sendMessage(body);
  }

  return (
    <section className="panel-block collaboration-block">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{labels.eyebrow}</p>
          <h2>{labels.room}</h2>
        </div>
        <span className="status-dot">
          {collaboration.activeMembers.length}/{collaboration.room?.maxParticipants || 5}
        </span>
      </div>

      {collaboration.loading ? <p className="collaboration-note">{labels.loading}</p> : null}
      {collaboration.error ? <p className="collaboration-error">{collaboration.error}</p> : null}

      <div className="collaboration-actions">
        <button className="mini-button icon-button" type="button" onClick={onCopyLink}>
          <Share2 size={16} aria-hidden="true" />
          {labels.actions.copyLink}
        </button>
        <label className="collaboration-toggle">
          <span>{labels.actions.autoAgree}</span>
          <span className="switch">
            <input
              type="checkbox"
              checked={Boolean(collaboration.currentMember?.auto_agree)}
              onChange={(event) => void collaboration.setAutoAgree(event.target.checked)}
            />
            <span />
          </span>
        </label>
      </div>

      <div className="collaboration-members" aria-label={labels.members}>
        {collaboration.members.map((member) => (
          <span
            key={member.user_id}
            className={activeIds.has(member.user_id) ? "is-active" : ""}
            style={{ "--member-color": member.color_token }}
          >
            <i />
            {member.display_name}
          </span>
        ))}
      </div>

      <div className="collaboration-proposals">
        <strong>{labels.pending}</strong>
        {collaboration.pendingProposals.length ? (
          collaboration.pendingProposals.map((proposal) => {
            const summary = collaboration.voteSummary(proposal);
            const proposer = collaboration.members.find((member) => member.user_id === proposal.proposer_id);
            return (
              <article key={proposal.id} className="collaboration-proposal">
                <span>{proposer?.display_name || labels.someone}</span>
                <p>{summarizeAction(proposal.action, labels.moves)}</p>
                <small>
                  {labels.votes(summary.approvalCount, summary.threshold)}
                </small>
                <div>
                  <button
                    className="mini-button icon-button"
                    type="button"
                    disabled={Boolean(summary.myVote?.approved)}
                    onClick={() => void collaboration.approveProposal(proposal)}
                  >
                    <CheckCircle2 size={15} aria-hidden="true" />
                    {labels.actions.agree}
                  </button>
                  <button
                    className="mini-button icon-button"
                    type="button"
                    disabled={summary.myVote?.approved === false}
                    onClick={() => void collaboration.rejectProposal(proposal)}
                  >
                    <X size={15} aria-hidden="true" />
                    {labels.actions.pass}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <p className="collaboration-note">{labels.noPending}</p>
        )}
      </div>

      <div className="collaboration-chat">
        <div className="collaboration-chat__head">
          <MessageCircle size={16} aria-hidden="true" />
          <strong>{labels.chat}</strong>
        </div>
        <div className="collaboration-chat__messages">
          {collaboration.messages.length ? (
            collaboration.messages.map((message) => (
              <p key={message.id}>
                <strong>{message.display_name}</strong>
                <span>{message.body}</span>
              </p>
            ))
          ) : (
            <p className="collaboration-note">{labels.noMessages}</p>
          )}
        </div>
        <form className="collaboration-chat__form" onSubmit={handleSend}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={labels.messagePlaceholder}
            maxLength={500}
          />
          <button type="submit" aria-label={labels.actions.send}>
            <Send size={16} aria-hidden="true" />
          </button>
        </form>
      </div>
    </section>
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
      {step.reasoning?.length > 0 && (
        <ol className="coach-reasoning">
          {step.reasoning.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )}
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

function createGameReview(game, finalTime) {
  const wrongEntries = game.wrongEntries || [];
  const activity = [...(game.activityLog || [])].sort((a, b) => a.elapsedSec - b.elapsedSec);
  const firstWrong = wrongEntries[0] || null;
  let slowest = null;
  let previous = 0;

  for (const entry of activity) {
    if (!Number.isFinite(entry.elapsedSec)) continue;
    const gap = Math.max(0, entry.elapsedSec - previous);
    if (!slowest || gap > slowest.seconds) {
      slowest = { ...entry, seconds: gap };
    }
    previous = entry.elapsedSec;
  }

  if (Number.isFinite(finalTime)) {
    const finishGap = Math.max(0, finalTime - previous);
    if (!slowest || finishGap > slowest.seconds) {
      slowest = { kind: "finish", seconds: finishGap, elapsedSec: finalTime };
    }
  }

  const missedTechnique =
    game.hintsUsed > 0
      ? createCoachStep({ ...game, completed: false }, "lesson")?.technique || "Candidate Scan"
      : firstWrong
      ? "Conflict Explanation"
      : null;

  return {
    firstWrong,
    slowest,
    missedTechnique,
    clean: !firstWrong && game.hintsUsed === 0 && game.mistakes === 0,
  };
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
  onTechniques,
  onSelectLesson,
}) {
  const tierStats = TECHNIQUE_TIERS.map((key) => {
    const label =
      {
        beginner: tierLabels.beginner,
        tactician: labels.tierTactician,
        master: labels.tierMaster,
        expert: labels.tierExpert,
      }[key] || key;
    const techniques = SUDOKU_TECHNIQUES.filter((technique) => technique.tier === key);
    const completedLessons = LEARNING_LEVELS.filter((level) => progress.completedIds.includes(level.id)).length;
    const tierIndex = TECHNIQUE_TIERS.indexOf(key);
    const unlockThreshold = [0, 6, 12, 16][tierIndex] ?? 0;
    const done = completedLessons >= unlockThreshold ? techniques.length : 0;
    return { key, label, total: Math.max(1, techniques.length), done };
  });

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
          <div className="learning-hero-actions">
            <button className="mini-button icon-button" type="button" onClick={onTechniques}>
              <BookOpen size={17} aria-hidden="true" />
              {labels.techniques}
            </button>
          </div>
        </section>

        <section className="learning-map" aria-label={labels.pathTitle}>
          <div className="learning-map__intro">
            <p className="eyebrow">{labels.pathTitle}</p>
            <p>{labels.pathLead}</p>
          </div>
          <ol className="learning-map__steps">
            {tierStats.map((tier, index) => (
              <li key={tier.key} className={tier.done === tier.total ? "is-complete" : ""}>
                <span>{index + 1}</span>
                <strong>{tier.label}</strong>
                <small>{tier.done}/{tier.total}</small>
              </li>
            ))}
          </ol>
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

function TechniquesPage({ labels, brandTagline, navAria, language, onBack }) {
  return (
    <>
      <header className="topbar" aria-label={navAria}>
        <Brand tagline={brandTagline} />
        <div className="top-actions">
          <IconButton icon={ArrowLeft} label={labels.back} onClick={onBack} />
        </div>
      </header>

      <main className="learning-page" aria-label={labels.techniquesTitle}>
        <section className="learning-hero">
          <p className="eyebrow">{labels.techniques}</p>
          <h1>{labels.techniquesTitle}</h1>
          <p className="learning-lead">{labels.techniquesLead}</p>
        </section>

        <section className="technique-grid" role="list">
          {SUDOKU_TECHNIQUES.map((technique) => (
            <TechniqueCard key={technique.id} technique={technique} labels={labels} language={language} />
          ))}
        </section>
      </main>
    </>
  );
}

function TechniqueCard({ technique, labels, language }) {
  const [choice, setChoice] = useState(null);
  const trainer = technique.trainer;
  const answered = choice !== null;
  const correct = String(choice) === String(trainer.answer);
  const tierLabel =
    {
      beginner: labels.tierBeginner,
      tactician: labels.tierTactician,
      master: labels.tierMaster,
      expert: labels.tierExpert,
    }[technique.tier] || technique.tier;

  return (
    <article className="technique-card" role="listitem">
      <div className="technique-card__copy">
        <span className="learning-tier">{tierLabel}</span>
        <h2>{technique.name}</h2>
        <p>{pickLocalized(technique.summary, language)}</p>
        <small>{pickLocalized(technique.detail, language)}</small>
      </div>
      <div className="technique-trainer">
        <p className="eyebrow">{labels.trainerTitle}</p>
        <MiniTrainerGrid trainer={trainer} />
        <strong>{pickLocalized(trainer.question, language)}</strong>
        <div className="technique-options" role="group" aria-label={labels.trainerChoose}>
          {trainer.options.map((option) => (
            <button
              key={String(option)}
              type="button"
              className={answered && String(option) === String(trainer.answer) ? "is-answer" : ""}
              onClick={() => setChoice(option)}
            >
              {trainer.optionLabel ? trainer.optionLabel(option) : option}
            </button>
          ))}
        </div>
        {answered ? (
          <p className={correct ? "trainer-feedback is-correct" : "trainer-feedback is-wrong"}>
            {correct ? labels.trainerCorrect : labels.trainerWrong}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function MiniTrainerGrid({ trainer }) {
  return (
    <div className="mini-trainer-grid" aria-hidden="true">
      {trainer.cells.map((value, index) => (
        <span
          key={index}
          className={[
            value ? "is-given" : "",
            trainer.focus === index ? "is-focus" : "",
            index === 2 || index === 5 ? "is-row-edge" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {value || trainer.marks?.[index] || ""}
        </span>
      ))}
    </div>
  );
}

function WinReview({ review, labels }) {
  if (!review) {
    return <p className="win-review win-review--empty">{labels.improveNoData}</p>;
  }

  if (review.clean) {
    return (
      <div className="win-review">
        <p className="eyebrow">{labels.improveTitle}</p>
        <strong>{labels.improveClean}</strong>
      </div>
    );
  }

  return (
    <div className="win-review">
      <p className="eyebrow">{labels.improveTitle}</p>
      {review.firstWrong ? (
        <span>
          {labels.improveFirstError}: R{Math.floor(review.firstWrong.index / 9) + 1}C{(review.firstWrong.index % 9) + 1},{" "}
          {review.firstWrong.value} {"->"} {review.firstWrong.better}
        </span>
      ) : null}
      {review.slowest?.seconds > 0 ? (
        <span>
          {labels.improveSlowest}: {formatTime(review.slowest.seconds)}
        </span>
      ) : null}
      {review.missedTechnique ? (
        <span>
          {labels.improveTechnique}: {review.missedTechnique}
        </span>
      ) : null}
    </div>
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

function SettingsPanel({ preferences, labels, isPro, voiceOptions = [], onChange, onUpgrade }) {
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
      <SettingRow
        icon={MessageCircle}
        title={labels.coachVoice}
        copy={labels.coachVoiceCopy}
        control={
          <div className="voice-control">
            <label className="switch">
              <input
                type="checkbox"
                checked={preferences.coachVoiceEnabled}
                onChange={(event) => onChange({ coachVoiceEnabled: event.target.checked })}
              />
              <span />
            </label>
            <select
              value={preferences.coachVoiceURI}
              disabled={!preferences.coachVoiceEnabled}
              onChange={(event) => onChange({ coachVoiceURI: event.target.value })}
            >
              <option value="auto">{labels.voiceAuto}</option>
              {voiceOptions.length === 0 ? (
                <option value="unavailable" disabled>
                  {labels.voiceUnavailable}
                </option>
              ) : null}
              {voiceOptions.map((voice) => (
                <option key={voice.value} value={voice.value}>
                  {voice.label}
                </option>
              ))}
            </select>
          </div>
        }
      />
      <SettingRow
        icon={Sparkles}
        title={labels.smartNotes}
        copy={labels.smartNotesCopy}
        control={
          <label className="switch">
            <input
              type="checkbox"
              checked={preferences.smartNotes}
              onChange={(event) => onChange({ smartNotes: event.target.checked })}
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
          {THEMES.map((theme) => {
            const locked = isThemePro(theme.key) && !isPro;
            return (
              <button
                className={`${preferences.theme === theme.key ? "active" : ""} ${locked ? "locked" : ""}`.trim()}
                key={theme.key}
                type="button"
                onClick={() => {
                  if (locked) {
                    onUpgrade();
                    return;
                  }
                  onChange({ theme: theme.key });
                }}
              >
                <i className={`theme-swatch ${theme.key}`} aria-hidden="true" />
                {theme.label}
                {locked ? <Lock size={14} strokeWidth={2.2} aria-label={labels.proTheme} /> : null}
              </button>
            );
          })}
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
  totalRecords = records.length,
  isPro = true,
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
      {!showDemo && !isPro && totalRecords > records.length ? (
        <p className="history-preview-hint">{labels.freeHistoryLimit(records.length)}</p>
      ) : null}

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
  const firstWrong = wrongMoves[0] || null;
  const cleanSolve = record.hintsUsed === 0 && record.mistakes === 0 && wrongMoves.length === 0;
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
          <div className="history-review-card">
            <p className="eyebrow">{labels.reviewTitle}</p>
            <strong>{cleanSolve ? labels.cleanSolve : labels.assistedSolve}</strong>
            <span>
              {firstWrong
                ? `${labels.firstWrong}: #${firstWrong.stepIndex}, ${labels.wrongDigit.toLowerCase()} ${firstWrong.value}, ${labels.better} ${firstWrong.better}`
                : labels.noWrongMoves}
            </span>
            {!cleanSolve ? <em>{labels.practiceTechnique}</em> : null}
          </div>
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
